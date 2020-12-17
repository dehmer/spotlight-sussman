import * as R from 'ramda'
import { searchIndex } from './lunr'
import evented from '../evented'

const emit = result => evented.emit({ type: 'search-result.changed', result })
var provider = searchIndex

const handlers = {
  'search-filter.changed': ({ value }) => emit(provider(value)),
  'search-provider.changed': ({ provider: theProvider }) => {
    provider = theProvider
    emit(provider(''))
  }
}

evented.on(event => (handlers[event.type] || R.always({}))(event))
