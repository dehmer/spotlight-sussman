import * as R from 'ramda'
import { searchIndex } from './lunr'
import { searchOSM } from './nominatim'
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

const lunrProvider = scope => {
  const term = R.cond([
    [R.startsWith('#'), s => s.length < 2 ? '' : `+tags:${s.substring(1)}*`],
    [R.startsWith('@'), s => (s.length < 2) ? '' : `+scope:${s.substring(1)}`],
    [R.identity, s => `+text:${s}*`],
    [R.T, R.always('')]
  ])

  const translate = value => {
    if (value.startsWith(':')) return value.substring(1)
    else return (value || '')
      .split(' ')
      .filter(R.identity)
      .map(term)
      .join(' ')
  }

  const search = terms => {
    evented.emit({ type: 'search.current', terms })
    return R.compose(limit, sort, refs, searchIndex)(terms)
  }

  return (query, callback) => {
    const filter = translate(query.value)
    scope
      ? callback(search(`+scope:${scope} ${filter}`))
      : callback(search(filter))
  }
}

const osmProvider = searchOSM

var currentQuery = { value: '' }
var provider = lunrProvider('')

evented.on(event => {
  console.log('[search]', event)
  const search = query => {
    currentQuery = query
    provider(query, result => evented.emit({ type: 'search-result.changed', result }))
  }

  if (event.type.startsWith('command.search.scope')) {
    const scope = event.type.split('.')[3]
    switch (scope) {
      case 'all': provider = lunrProvider(''); break;
      case 'place': provider = osmProvider; break;
      default: provider = lunrProvider(scope); break;
    }

    evented.emit({ type: 'search-provider.changed', scope })
    search({ value: '' })
  } else if (event.type === 'search-index.refreshed') search(currentQuery)
  else if (event.type === 'search-filter.changed') search(event)
})
