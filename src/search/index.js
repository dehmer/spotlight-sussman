import * as R from 'ramda'
import { search, scopedSearch } from './lunr'
import evented from '../evented'

const emit = result => evented.emit({ type: 'search-result.changed', result })
var filter = '' /* search string */
var provider = search

const handlers = {
  'search-index.refreshed': () => emit(provider(filter)),
  'search-filter.changed': ({ value }) => {
    filter = value
    emit(provider(filter))
  },
  'search-provider.changed': ({ provider: theProvider }) => {
    provider = theProvider
    filter = ''
    emit(provider(filter))
  }
}

evented.on(event => {
  if (event.type.startsWith('command.search.scope')) {
    const scope = event.type.split('.')[3]
    evented.emit({
      type: 'search-provider.changed',
      scope,
      provider: scope != 'all' ? scopedSearch(scope) : search
    })

    return
  }

  ;(handlers[event.type] || R.always({}))(event)
})
