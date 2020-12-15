import * as R from 'ramda'
import json from '../model/feature-descriptors.json'
import { url } from './symbol'

const id = descriptor => `symbol:${descriptor.sidc}`

const descriptors = json.reduce((acc, descriptor) => {
  descriptor.id = id(descriptor)
  acc[descriptor.id] = descriptor
  return acc
}, {})

const document = descriptor => {
  console.log('[document]', descriptor)
  const tags = [
    ...descriptor.dimension ? descriptor.dimension.split(', ') : [],
    ...descriptor.scope ? descriptor.scope.split(', ') : []
  ].flat().join(' ')

  if (!descriptor.hierarchy) console.error(descriptor)

  return {
    id: descriptor.id,
    scope: 'symbol',
    text: descriptor.hierarchy.join(' '),
    tags
  }
}

console.log(descriptors)

export const documents = () => Object.values(descriptors).map(document)

export const entry = ref => {
  const replace = (s, i, r) => s.substring(0, i) + r + s.substring(i + r.length)
  const descriptor = descriptors[ref]
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
