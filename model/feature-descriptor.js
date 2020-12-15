import * as R from 'ramda'
import descriptors from '../model/feature-descriptors.json'
import { url } from './symbol'

const id = descriptor => `symbol:${descriptor.sidc}`

const descriptorIndex = {}
descriptors.forEach(descriptor => descriptorIndex[id(descriptor)] = descriptor)

const document = descriptor => {
  const tags = [
    ...descriptor.dimension ? descriptor.dimension.split(', ') : [],
    ...descriptor.scope ? descriptor.scope.split(', ') : []
  ].flat().join(' ')

  if (!descriptor.hierarchy) console.error(descriptor)

  return {
    id: id(descriptor),
    scope: 'symbol',
    text: descriptor.hierarchy.join(' '),
    tags
  }
}

export const documents = () => descriptors.map(document)


export const entry = ref => {
  const replace = (s, i, r) => s.substring(0, i) + r + s.substring(i + r.length)
  const descriptor = descriptorIndex[ref]
  const title = R.last(descriptor.hierarchy)
  const description = R.dropLast(1, descriptor.hierarchy).join(' • ')
  const dimension = descriptor.dimension ? descriptor.dimension.split(', ') : []

  const tags = [
    ...dimension,
    descriptor.scope
  ].filter(R.identity)

  return {
    key: ref,
    title,
    description,
    scope: 'SYMBOL',
    tags,
    url: () => url(replace(replace(descriptor.sidc, 1, 'F'), 3, 'P'))
  }
}
