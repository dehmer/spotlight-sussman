import evented from '../evented'

export const dispatchProvider = provider => () => {
  evented.emit({ type: 'search-provider.changed', provider })
}

