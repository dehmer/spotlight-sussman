import * as R from 'ramda'
import { url } from '../model/symbol'
import { symbols } from '../model/feature-descriptor'
import evented from '../evented'

const documents = () => {
  const document = symbol => ({
    id: symbol.id,
    scope: 'symbol',
    text: symbol.hierarchy.join(' '),
    tags: [
      ...symbol.dimension ? symbol.dimension.split(', ') : [],
      ...symbol.scope ? symbol.scope.split(', ') : [],
      ...[symbol.tags || []]
    ].flat().join(' ')
  })

  return Object.values(symbols).map(document)
}

const option = key => {
  const replace = (s, i, r) => s.substring(0, i) + r + s.substring(i + r.length)
  const descriptor = symbols[key]
  const dimension = descriptor.dimension
    ? descriptor.dimension.split(', ').map(label => ({ type: 'SYSTEM', label }))
    : []

  return {
    key,
    title: R.last(descriptor.hierarchy),
    description: R.dropLast(1, descriptor.hierarchy).join(' • '),
    url: url(replace(replace(descriptor.sidc, 1, 'F'), 3, 'P')),
    scope: 'SYMBOL',
    tags: [
      {
        type: 'SCOPE',
        label: 'SYMBOL'
      },
      ...dimension,
      {
        type: 'SYSTEM',
        label: descriptor.scope
      },
      ...(descriptor.tags || []).map(label => ({
        type: 'USER',
        label,
        action: () => evented.emit({ type: 'search-tag.changed', tag: label })
      }))
    ]
  }
}

export default { documents, option }