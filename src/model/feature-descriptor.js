import json from '../model/feature-descriptors.json'
import { normalize } from './sidc'
import evented from '../evented'

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

evented.on(event => {
  if (event.type === 'command.model.update') {
    const [scope] = event.id.split(':')
    if (scope !== 'symbol') return

    switch (event.property) {
      case 'tags': {
        const tags = event.value
          .filter(tag => tag.type === 'USER')
          .map(tag => tag.label)

        symbols[event.id].tags = tags
        evented.emit({ type: 'model.changed' })
        break;
      }
    }
  }
})
