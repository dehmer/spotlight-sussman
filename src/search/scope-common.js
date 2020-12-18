import evented from '../evented'
import { layers } from '../model/layer'

export const dispatchProvider = provider => () => {
  evented.emit({ type: 'search-provider.changed', provider })
}
