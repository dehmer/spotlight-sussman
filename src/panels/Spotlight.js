import React from 'react'
import * as R from 'ramda'
import { CardList } from '../components/CardList'
import Card from '../components/Card'
import evented from '../evented'
import selectionService from '../model/selection'
import { Search } from './Search'
import { Scopebar } from './Scopebar'

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

  return (
    <div
      ref={ref}
      className="spotlight panel"
      tabIndex='0'
      onKeyDown={handleKeyDown}
    >
      <Scopebar/>
      <Search/>
      <CardList>{entries.map(card)}</CardList>
    </div>
  )
}

export default React.memo(Spotlight)