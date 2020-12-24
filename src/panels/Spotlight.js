import React from 'react'
import * as R from 'ramda'
import { CardList } from '../components/CardList'
import { Card } from '../components/Card'
import evented from '../evented'
import selectionService from '../selection'

const Search = () => {
  const [value, setValue] = React.useState('')

  React.useEffect(() => {
    evented.on(event => {
      if (event.type !== 'search-scope.changed') return
      setValue('')
    })
  })

  const handleChange = ({ target }) => {
    setValue(target.value)
    evented.emit({ type: 'search-filter.changed', value: target.value })
  }

  const handleKeyDown = event => {
    if (event.code === 'KeyA' && event.metaKey) return event.stopPropagation()
    if (event.code === 'ArrowDown') return event.preventDefault()
    if (event.code === 'ArrowUp') return event.preventDefault()
    if (event.code === 'Escape') {
      setValue('')
      evented.emit({ type: 'search-filter.changed', value: '' })
    }
  }

  return (
    <div className='search-conainer'>
      <input
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

const callAction = (action, target) =>
  target &&
  target.actions &&
  target.actions[action] &&
  target.actions[action].call()

const reducer = (state, event) => {
  switch (event.type) {
    case 'snapshot': return event.snapshot
    case 'toggle-edit': {
      const index = state.findIndex(entry => entry.key === event.key)
      const entry = state[index]
      if (!entry || !entry.actions || !entry.actions.rename) return state

      const clone = [...state]
      if (clone[index].editor) {
        entry.actions.rename(clone[index].editor.value)
        delete clone[index].editor
      }
      else clone[index] = { ...entry, editor: {
        property: 'title',
        value: entry.title
      }}

      return clone
    }
    case 'cancel-edit': {
      const clone = [...state]
      clone.forEach(entry => delete entry.editor)
      return clone
    }
    case 'property-changed': {
      const clone = [...state]
      const index = clone.findIndex(entry => entry.key === event.key)
      clone[index] = { ...clone[index], editor: {
        property: event.property,
        value: event.value
      }}

      return clone
    }
    default: return state
  }
}

/**
 *
 */
export const Spotlight = () => {
  // TODO: make multi-select optional (e.g. palette uses single-select)

  const [entries, dispatch] = React.useReducer(reducer, [])
  const [focus, setFocus] = React.useState()
  const [selection, setSelection] = React.useState([])

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
    acc[value.key] = React.createRef()
    return acc
  }, {})

  const scrollIntoView = key =>
    cardrefs[key] &&
    cardrefs[key].current &&
    cardrefs[key].current.scrollIntoView({
      behavior: "auto",
      block: "nearest"
    })

  const key = fn => key => {
    const sameRef = ([_, ref]) => current(ref) === fn(current(cardrefs[key]))
    const entry = Object.entries(cardrefs).find(sameRef)
    return entry ? entry[0] : null
  }

  React.useEffect(() => {
    evented.on(({ type, result }) => {
      if (type !== 'search-result.changed') return
      dispatch({ type: 'snapshot', snapshot: result })
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
    scrollIntoView(key)

    updateSelection(shiftKey
      ? selected(key)
        ? [...toggleSelection(focus), key]
        : [...selection, focus, key]
      : []
    )

    setFocus(key)
  }

  const findIndex = key => entries.findIndex(entry => entry.key === key)
  const findEntry = key => entries[findIndex(key)]
  const rangeSelection = key => {

    const keyRange = (from, to) => {
      const reverse = from > to ? R.reverse : R.identity
      const key = i => entries[i].key
      return reverse(R.map(key, R.range(from, to + 1)))
    }

    if (!selection.length) {
      // No prior selection to take into account.
      const [from, to] = [focus || entries[0], key].map(findIndex)
      return from < to
        ? keyRange(from, to) // ascending
        : keyRange(to, from).reverse() // descending
    } else {
      // Superimpose with current selection.
      // NOTE: Indexes of current selection define an order (asc/desc).
      const indexes = selection.map(findIndex)
      const index = findIndex(key)
      return R.head(indexes) < R.last(indexes) // ascending
        ? index > R.head(indexes)
          ? keyRange(R.head(indexes), index) // ascending
          : keyRange(index, R.head(indexes)).reverse() // descending
        : index < R.head(indexes)
          ? keyRange(index, R.head(indexes)).reverse() // descending
          : keyRange(R.head(indexes), index) // ascending
    }
  }

  const handleKeyDown = event => {
    const focused = focus && cardrefs[focus]
    const first = R.always(entries.length ? R.head(entries).key : null)
    const last = R.always(entries.length ? R.last(entries).key : null)

    const keyHandlers = {
      ArrowDown: ({ shiftKey, metaKey }) => {
        if (metaKey) callAction('open', findEntry(focus))
        else {
          const succ = focused ? key(next) : first
          updateFocus(succ, shiftKey)
        }
      },
      ArrowUp: ({ shiftKey, metaKey }) => {
        if (metaKey) callAction('back', findEntry(focus))
        else {
          const succ = focused ? key(previous) : last
          updateFocus(succ, shiftKey)
        }
      },
      Home: ({ shiftKey }) => {
        const key = first()
        if (shiftKey) setSelection(rangeSelection(key))
        scrollIntoView(key)
        setFocus(key)
      },
      End: ({ shiftKey }) => {
        const key = last()
        if (shiftKey) setSelection(rangeSelection(key))
        scrollIntoView(key)
        setFocus(key)
      },
      KeyA: ({ metaKey }) => {
        if (metaKey) updateSelection(entries.map(entry => entry.key))
      },
      Enter: () => {
        dispatch({ type: 'toggle-edit', property: 'title', key: focus })
        ref.current.focus()
      },
      Escape: () => {
        dispatch({ type: 'cancel-edit' })
        ref.current.focus()
      }
    }

    ;(keyHandlers[event.code] || R.always({}))(event)
  }

  const handleClick = key => ({ metaKey, shiftKey }) => {
    setFocus(key)

    const selection = metaKey
      ? [...toggleSelection(key), focus]
      : shiftKey
        ? rangeSelection(key)
        : []


    updateSelection(selection)
  }

  const handlePropertyChange = key => event => {
    dispatch({ type: 'property-changed', key, ...event })
  }

  const card = props => <Card
    ref={cardrefs[props.key]}
    focus={focus === props.key}
    selected={selection.includes(props.key)}
    onClick={handleClick(props.key)}
    onPropertyChange={handlePropertyChange(props.key)}
    {...props}
  />

  return (
    <div
      ref={ref}
      className="spotlight panel"
      tabIndex='0'
      onKeyDown={handleKeyDown}
    >
      <Search/>
      <CardList>{entries.map(card)}</CardList>
    </div>
  )
}
