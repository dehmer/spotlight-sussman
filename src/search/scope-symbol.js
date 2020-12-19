import * as R from 'ramda'
import { url } from '../model/symbol'
import { symbols } from '../model/feature-descriptor'

const documents = () => {
  const document = symbol => ({
    id: symbol.id,
    scope: 'symbol',
    text: symbol.hierarchy.join(' '),
    tags: [
      ...symbol.dimension ? symbol.dimension.split(', ') : [],
      ...symbol.scope ? symbol.scope.split(', ') : []
    ].flat().join(' ')
  })

  return Object.values(symbols).map(document)
}

const option = key => {
  const replace = (s, i, r) => s.substring(0, i) + r + s.substring(i + r.length)
  const descriptor = symbols[key]
  const dimension = descriptor.dimension ? descriptor.dimension.split(', ') : []

  return {
    key,
    title: R.last(descriptor.hierarchy),
    description: R.dropLast(1, descriptor.hierarchy).join(' • '),
    url: url(replace(replace(descriptor.sidc, 1, 'F'), 3, 'P')),
    scope: 'SYMBOL',
    tags: [...dimension, descriptor.scope]
      .filter(R.identity)
      .map(text => ({ text }))
  }
}

export default { documents, option }