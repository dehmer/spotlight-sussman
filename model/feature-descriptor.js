import descriptors from '../model/feature-descriptors.json'

export const descriptorIndex = {}
descriptors.forEach(descriptor => descriptorIndex[descriptor.sidc] = descriptor)

export const document = descriptor => {
  const tag = [
    ...descriptor.dimension ? descriptor.dimension.split(', ') : [],
    ...descriptor.scope ? descriptor.scope.split(', ') : []
  ].flat().join(' ')

  if (!descriptor.hierarchy) console.error(descriptor)

  return {
    sidc: descriptor.sidc,
    text: descriptor.hierarchy.join(' '),
    tag
  }
}
