import uuid from 'uuid-random'
import { url } from './symbol'

export const layers = {}

const importFile = file => new Promise((resolve, reject) => {
  const reader = new FileReader()
  const filename = file => file.name.substring(0, file.name.indexOf('.'))
  reader.onload = (({ target }) => {
    if (target.error) reject(target.error)
    else {
      const json = JSON.parse(target.result)
      const layerUUID = uuid()
      json.name = filename(file)
      json.id = `layer:${layerUUID}`

      // re-write feature array as associative array:
      json.features = json.features.reduce((acc, feature) => {
        feature.id = `feature:${layerUUID}/${uuid()}`
        acc[feature.id] = feature
        return acc
      }, {})
      resolve(json)
    }
  })
  reader.readAsText(file)
})

export const load = async files => {
  const json = await Promise.all(files.map(importFile))
  json.reduce((acc, layer) => {
    acc[layer.id] = layer
    return acc
  }, layers)

  window.dispatchEvent(new CustomEvent('model.changed'))
}

const identity = sidc => sidc[1] === 'F' ? ['OWN'] : sidc[1] === 'H' ? ['ENEMY'] : []

export const documents = () => {
  return Object.entries(layers).reduce((acc, [id, layer]) => {
    acc.push({ id, scope: 'layer', text:  layer.name })
    return Object.entries(layer.features).reduce((acc, [id, feature]) => {
      acc.push({
        id,
        scope: 'feature',
        tags: [layer.name, ...identity(feature.properties.sidc)],
        text: feature.properties.t
      })
      return acc
    }, acc)
  }, [])
}

const scopes = {
  layer: ref => {
    const layer = layers[ref]
    return {
      key: ref,
      title: layer.name,
      scope: 'LAYER',
      tags: []
    }
  },
  feature: ref => {
    const layer = layers[`layer:${ref.split(':')[1].split('/')[0]}`]
    const { properties } = layer.features[ref]
    return {
      key: ref,
      title: properties.t || 'N/A',
      scope: 'FEATURE',
      tags: [layer.name.toUpperCase(),  ...identity(properties.sidc)],
      url: () => url(properties.sidc)
    }
  }
}
export const entry = ref => scopes[ref.split(':')[0]](ref)
