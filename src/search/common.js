import evented from '../evented'

export const dispatchProvider = provider => () => {
  evented.emit({ type: 'search-provider.changed', provider })
}

const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base'})
export const compare = fn => (a, b) => collator.compare(fn(a), fn(b))
