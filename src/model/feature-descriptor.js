import json from '../model/feature-descriptors.json'
import { normalize } from './sidc'

const id = descriptor => `symbol:${descriptor.sidc.substring(0, 10)}`

export const symbols = json.reduce((acc, descriptor) => {
  descriptor.id = id(descriptor)
  acc[descriptor.id] = descriptor
  return acc
}, {})

export const hierarchy = sidc => {
  const descriptor = symbols[`symbol:${normalize(sidc)}`]
  return descriptor ? descriptor.hierarchy : ['N/A']
}
