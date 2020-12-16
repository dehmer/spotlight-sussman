import json from '../model/feature-descriptors.json'

const id = descriptor => `symbol:${descriptor.sidc}`

export const symbols = json.reduce((acc, descriptor) => {
  descriptor.id = id(descriptor)
  acc[descriptor.id] = descriptor
  return acc
}, {})
