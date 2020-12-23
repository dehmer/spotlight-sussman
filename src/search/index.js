import * as R from 'ramda'
import { searchIndex } from './lunr'
import evented from '../evented'

const emit = result => evented.emit({ type: 'search-result.changed', result })
var filter = '' /* search string */
var provider = searchIndex

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

evented.on(event => (handlers[event.type] || R.always({}))(event))
