// Track selections throughout the application.
// Selections are URIs.
import evented from './evented'

// Current selections.
let state = []

/**
 * select :: [uri] -> unit
 * Add selections.
 */
const select = uris => {
  if (!uris) return
  if (!Array.isArray(uris)) throw new Error('invalid argument; array expected')
  if (uris.length === 0) return
  if (uris.some(x => typeof x !== 'string')) throw new Error('invalid argument; string element expected')

  const additions = uris.filter(x => !state.includes(x))

  state = [...state, ...additions]
  if (additions.length) evented.emit({ type: 'selected', list: additions })
}

/**
 * deselect :: () => unit
 * deselect :: [uri] => unit
 * Remove all or given selections.
 */
const deselect = uris => {
  if (uris && !Array.isArray(uris)) throw new Error('invalid argument; array expected')
  if (uris && uris.some(x => typeof x !== 'string')) throw new Error('invalid argument; string element expected')

  const removals = uris
    ? uris.filter(x => state.includes(x))
    : state

  state = state.filter(x => !removals.includes(x))
  if (removals.length) evented.emit({ type: 'deselected', list: removals })
}

const isEmpty = () => state.length === 0
const isSelected = uri => state.includes(uri)
const selected = (p = () => true) => state.filter(p)

export default {
  select,
  deselect,
  isEmpty,
  isSelected,
  selected
}
