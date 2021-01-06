import * as R from 'ramda'
import { searchIndex } from './lunr'
import { searchOSM } from './nominatim'
import emitter from '../emitter'
import { options } from '../model/options'
import { compare } from './compare'

const limit = R.take(200)
// const limit = R.identity /* no limits */

// Sort group to the top:
const isGroup = id => id.startsWith('group:')
const field = x => x.title + x.description
const sort = entries => entries.sort((a, b) => {
  const GA = isGroup(a.id)
  const GB = isGroup(b.id)
  if (!GA && !GB) return compare(field)(a, b)
  else if (GA && !GB) return -1
  else if (!GA && GB) return 1
  else return compare(field)(a, b)
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
    emitter.emit('search/current', { terms })
    return R.compose(limit, sort, refs, searchIndex)(terms)
  }

  return (query, callback) => {
    const filter = translate(query.value)
    scope
      ? callback(search(`+scope:${scope} ${filter}`))
      : callback(search(filter))
  }
}

var currentQuery = { value: '' }
var provider = lunrProvider('')

const search = query => {
  currentQuery = query
  provider(query, result => emitter.emit('search/result/updated', { result }))
}

emitter.on('search/provider', event => {
  provider = event.provider
  emitter.emit('search/provider/updated', { scope: event.scope })
  search({ value: '' })
})

emitter.on('index/updated', () => search(currentQuery))

emitter.on('search/scope/:scope', ({ scope }) => {
  switch (scope) {
    case 'all': provider = lunrProvider(''); break;
    default: provider = lunrProvider(scope); break;
  }

  emitter.emit('search/provider/updated', { scope })
  search({ value: '' })
})

emitter.on('search/filter/updated', event => {
  if (event.mode === 'enter') searchOSM(event)
  search(event)
})