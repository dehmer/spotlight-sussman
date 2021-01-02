import React from 'react'
import * as R from 'ramda'
import { CardList } from '../components/CardList'
import Card from '../components/Card'
import TagList from '../components/TagList'
import evented from '../evented'
import selectionService from '../model/selection'

const Search = () => {
  const [value, setValue] = React.useState('')
  const ref = React.useRef()

  React.useEffect(() => {
    evented.on(event => {
      if (event.type !== 'search-provider.changed') return
      setValue('')
      ref.current.focus()
    })
  })

  const handleChange = ({ target }) => {
    setValue(target.value)
    evented.emit({
      type: 'search-filter.changed',
      value: target.value,
      mode: 'continuous'
    })
  }

  const handleKeyDown = event => {
    if (event.code === 'KeyA' && event.metaKey) return event.stopPropagation()
    else if (event.code === 'ArrowDown') return event.preventDefault()
    else if (event.code === 'ArrowUp') return event.preventDefault()
    else if (event.code === 'Escape') {
      setValue('')
      evented.emit({
        type: 'search-filter.changed',
        value: '',
        mode: 'continuous'
      })
    }
    else if (event.code === 'Enter') {
      event.stopPropagation()
      if (event.metaKey) evented.emit({ type: 'command.storage.newgroup' })
      else evented.emit({
        type: 'search-filter.changed',
        value,
        mode: 'enter'
      })
    }
    else if (event.code === 'Digit1' && event.metaKey) evented.emit({ type: 'command.search.scope.all' })
    else if (event.code === 'Digit2' && event.metaKey) evented.emit({ type: 'command.search.scope.layer' })
    else if (event.code === 'Digit3' && event.metaKey) evented.emit({ type: 'command.search.scope.feature' })
    else if (event.code === 'Digit4' && event.metaKey) evented.emit({ type: 'command.search.scope.symbol' })
    else if (event.code === 'Digit5' && event.metaKey) evented.emit({ type: 'command.search.scope.group' })
    else if (event.code === 'Digit6' && event.metaKey) evented.emit({ type: 'command.search.scope.place' })
  }

  return (
    <div className='search-container'>
      <input
        ref={ref}
        className='search-input'
        placeholder='Spotlight Search'
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
    </div>
  )
}

const current = ref => ref && ref.current
const next = R.prop('nextSibling')
const previous = R.prop('previousSibling')

const reducer = (state, event) => {
  switch (event.type) {
    case 'snapshot': return event.snapshot
    case 'toggle-edit': {
      const index = state.findIndex(entry => entry.id === event.id)
      const entry = state[index]
      if (!entry) return state
      if (!(entry.capabilities || '').includes('RENAME')) return state

      const clone = [...state]
      clone[index].edit = true
      return clone
    }
    default: return state
  }
}

/**
 *
 */
const Spotlight = () => {
  const [entries, dispatch] = React.useReducer(reducer, [])
  const [focus, setFocus] = React.useState()
  const [selection, setSelection] = React.useState([])

  const [scopes, updateScopes] = React.useReducer((state, event) => {
    const { type } = event
    const activate = (state, label) => {
      const clone = state.map(tag => {
        const [_, text, action] = tag.split(':')
        return [
          text === (label || '').toUpperCase() ? 'SCOPE' : 'SYSTEM',
          text,
          action
        ].join(':')
      })
      return clone
    }

    if (type === 'search-provider.changed') {
      return activate(state, event.scope)
    } else return state
  }, [
    'SCOPE:ALL:command.search.scope',
    'SYSTEM:LAYER:command.search.scope',
    'SYSTEM:FEATURE:command.search.scope',
    'SYSTEM:SYMBOL:command.search.scope',
    'SYSTEM:GROUP:command.search.scope',
    'SYSTEM:PLACE:command.search.scope'
  ])

  const updateSelection = items => {
    const uniqueItems = R.uniq(items.filter(R.identity)) // filter nulls; make unique
    const additions = uniqueItems.filter(x => !selection.includes(x))
    const removals = selection.filter(x => !uniqueItems.includes(x))
    selectionService.select(additions)
    selectionService.deselect(removals)
    setSelection(uniqueItems)
  }

  const ref = React.createRef()
  const cardrefs = entries.reduce((acc, value) => {
    acc[value.id] = React.createRef()
    return acc
  }, {})

  const scrollIntoView = id =>
    cardrefs[id] &&
    cardrefs[id].current &&
    cardrefs[id].current.scrollIntoView({
      behavior: "auto",
      block: "nearest"
    })

  const key = fn => key => {
    const sameRef = ([_, ref]) => current(ref) === fn(current(cardrefs[key]))
    const entry = Object.entries(cardrefs).find(sameRef)
    return entry ? entry[0] : null
  }

  React.useEffect(() => {
    evented.on((event) => {
      updateScopes(event)
      const { type, result } = event
      if (type === 'search-result.changed') dispatch({ type: 'snapshot', snapshot: result })
      if (type === 'search-provider.changed') {
        setSelection([])
        selectionService.deselect()
        setFocus(null)
      }
    })
  }, [])


  const selected = key => selection.includes(key)
  const toggleSelection = key => key
    ? selected(key)
      ? selection.filter(x => x !== key)
      : [...selection, key]
    : selection

  const updateFocus = (succ, shiftKey) => {
    const key = succ(focus)
    if (!key) return /* don't 'cycle' */

    scrollIntoView(key)
    updateSelection(shiftKey
      ? selected(key)
        ? [...toggleSelection(focus), key]
        : [...selection, focus, key]
      : []
    )

    setFocus(key)
  }

  const findIndex = id => entries.findIndex(entry => entry.id === id)
  const rangeSelection = id => {

    const keyRange = (from, to) => {
      const reverse = from > to ? R.reverse : R.identity
      const id = i => entries[i].id
      return reverse(R.map(id, R.range(from, to + 1)))
    }

    if (!selection.length) {
      // No prior selection to take into account.
      const [from, to] = [focus || entries[0], id].map(findIndex)
      return from < to
        ? keyRange(from, to) // ascending
        : keyRange(to, from).reverse() // descending
    } else {
      // Superimpose with current selection.
      // NOTE: Indexes of current selection define an order (asc/desc).
      const indexes = selection.map(findIndex)
      const index = findIndex(id)
      return R.head(indexes) < R.last(indexes) // ascending
        ? index > R.head(indexes)
          ? keyRange(R.head(indexes), index) // ascending
          : keyRange(index, R.head(indexes)).reverse() // descending
        : index < R.head(indexes)
          ? keyRange(index, R.head(indexes)).reverse() // descending
          : keyRange(R.head(indexes), index) // ascending
    }
  }

  const focused = focus && cardrefs[focus]
  const first = R.always(entries.length ? R.head(entries).id : null)
  const last = R.always(entries.length ? R.last(entries).id : null)

  const home = shiftKey => {
    const key = first()
    if (shiftKey) setSelection(rangeSelection(key))
    scrollIntoView(key)
    setFocus(key)
  }

  const end = shiftKey => {
    const key = last()
    if (shiftKey) setSelection(rangeSelection(key))
    scrollIntoView(key)
    setFocus(key)
  }

  const handleKeyDown = event => {
    const keyHandlers = {
      ArrowDown: ({ shiftKey, metaKey }) => {
        if (metaKey) return end(shiftKey)
        const succ = focused ? key(next) : first
        updateFocus(succ, shiftKey)
      },
      ArrowUp: ({ shiftKey, metaKey }) => {
        if (metaKey) return home(shiftKey)
        const succ = focused ? key(previous) : last
        updateFocus(succ, shiftKey)
      },
      Home: ({ shiftKey }) => home(shiftKey),
      End: ({ shiftKey }) => end(shiftKey),
      KeyA: ({ metaKey }) => {
        if (metaKey) updateSelection(entries.map(entry => entry.id))
      },
      Enter: () => {
        if (!focus) return
        dispatch({ type: 'toggle-edit', property: 'title', id: focus })
        ref.current.focus()
      },
      Backspace: ({ metaKey }) => {
        if (!metaKey) return
        evented.emit({ type: 'command.storage.remove', ids: [focus, ...selection] })
      }
    }

    ;(keyHandlers[event.code] || R.always({}))(event)
  }

  const handleClick = React.useCallback((id, { metaKey, shiftKey }) => {
    setFocus(id)

    const selection = metaKey
      ? [...toggleSelection(id)]
      : shiftKey
        ? rangeSelection(id)
        : []

    updateSelection(selection)
  }, [focus, selection])

  const card = props => <Card
    key={props.id}
    ref={cardrefs[props.id]}
    focus={focus === props.id}
    selected={selection.includes(props.id)}
    onClick={event => handleClick(props.id, event)}
    {...props}
  />

  const tagListContainerStyle = {
    padding: '12px',
    paddingBottom: '4px',
    borderBottomStyle: 'solid',
    borderWidth: '1px',
    borderColor: 'grey',
    fontSize: '90%'
  }

  const component = (
    <div
      ref={ref}
      className="spotlight panel"
      tabIndex='0'
      onKeyDown={handleKeyDown}
    >
      <div style={tagListContainerStyle}>
        <TagList
          tags={scopes.join(' ')}
        />
      </div>
      <Search/>
      <CardList>{entries.map(card)}</CardList>
    </div>
  )

  return component
}

export default React.memo(Spotlight)