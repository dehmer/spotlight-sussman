import * as R from 'ramda'
import { searchIndex } from './lunr'
import evented from '../evented'
import { options } from '../model/options'
import { compare } from './compare'

const limit = R.take(200)
// const limit = R.identity /* no limits */

// Sort group to the top and only sort groups by title:
const isGroup = id => id.startsWith('group:')
const sort = entries => entries.sort((a, b) => {
  const GA = isGroup(a.id)
  const GB = isGroup(b.id)
  if (!GA && !GB) return 0 // chromium sort is/should be stable
  else if (GA && !GB) return -1
  else if (!GA && GB) return 1
  else return compare(R.prop('title'))(a, b)
})

const option = ref => options[ref.split(':')[0]](ref)
const refs = R.map(({ ref }) => option(ref))

const scopedSearch = scope => {
  const search = terms => {
    evented.emit({ type: 'search.current', terms })
    return R.compose(limit, sort, refs, searchIndex)(terms)
  }

  return scope
    ? (filter, callback) => callback(search(`+scope:${scope} ${filter}`))
    : (filter, callback) => callback(search(filter))
}

var currentFilter = '' /* current search string */
var provider = scopedSearch('')

evented.on(event => {
  const search = filter => {
    currentFilter = filter
    provider(filter, result => evented.emit({ type: 'search-result.changed', result }))
  }

  if (event.type.startsWith('command.search.scope')) {
    const scope = event.type.split('.')[3]
    provider = scopedSearch(scope != 'all' ? scope : '')
    evented.emit({ type: 'search-provider.changed', scope })
    search('')
  } else if (event.type === 'search-index.refreshed') search(currentFilter)
  else if (event.type === 'search-filter.changed') search(event.value)
})
