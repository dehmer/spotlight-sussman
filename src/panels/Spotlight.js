import React from 'react'
import * as R from 'ramda'
import { CardList } from '../components/CardList'
import Card from '../components/Card'
import emitter from '../emitter'
import selectionService from '../model/selection'
import { Search } from './Search'
import { Scopebar } from './Scopebar'

const current = ref => ref && ref.current
const next = R.prop('nextSibling')
const previous = R.prop('previousSibling')

const reducer = (state, event) => {
  if (event.id) {
    // toggle/start edit:
    const index = state.findIndex(entry => entry.id === event.id)
    const entry = state[index]
    if (!entry) return state
    if (!(entry.capabilities || '').includes('RENAME')) return state

    const clone = [...state]
    clone[index].edit = true
    return clone
  } else if (event.result) return event.result
  else return state
}

/**
 *
 */
const Spotlight = () => {
  const [entries, dispatch] = React.useReducer(reducer, [])
  const [focus, setFocus] = React.useState()
  const [selection, setSelection] = React.useState([])

  const updateSelection = ids => {
    const uniqueIds = R.uniq(ids.filter(R.identity)) // filter nulls; make unique
    const additions = uniqueIds.filter(x => !selection.includes(x))
    const removals = selection.filter(x => !uniqueIds.includes(x))
    selectionService.select(additions)
    selectionService.deselect(removals)
    setSelection(uniqueIds)
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
    const providerUpdated = () => {
      updateSelection([])
      setFocus(null)
    }

    const selectionUpdated = () => {
      const visible = entries.map(entry => entry.id)
      const selected = selectionService.selected(id => visible.includes(id))
      const additions = selected.filter(id => !selection.includes(id))
      const removals = selection.filter(id => !selected.includes(id))
      updateSelection([...selection.filter(id => !removals.includes(id)), ...additions])
    }

    emitter.on('search/provider/updated', providerUpdated)
    emitter.on('search/result/updated', dispatch)
    emitter.on('selected', selectionUpdated)
    emitter.on('deselected', selectionUpdated)

    return () => {
      emitter.off('search/provider/updated', providerUpdated)
      emitter.off('search/result/updated', dispatch)
      emitter.off('selected', selectionUpdated)
      emitter.off('deselected', selectionUpdated)
    }
  }, [selection, entries])

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
    if (shiftKey) updateSelection(rangeSelection(key))
    scrollIntoView(key)
    setFocus(key)
  }

  const end = shiftKey => {
    const key = last()
    if (shiftKey) updateSelection(rangeSelection(key))
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
        if (!metaKey) return
        const xs = selection.length !== entries.length
          ? entries.map(entry => entry.id)
          : []

        updateSelection(xs)
      },
      Enter: () => {
        if (!focus) return
        dispatch({ type: 'toggle-edit', property: 'title', id: focus })
        ref.current.focus()
      },
      Backspace: ({ metaKey }) => {
        if (!metaKey) return
        emitter.emit('items/remove', { ids: [focus, ...selection] })
      },
      Space: () => {
        if (!focus) return
        updateSelection([...toggleSelection(focus)])
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
