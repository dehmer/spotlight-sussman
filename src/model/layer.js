import VectorSource from 'ol/source/Vector'
import Collection from 'ol/Collection'
import GeoJSON from 'ol/format/GeoJSON'
import uuid from 'uuid-random'
import scenario from './mip-scenario.json'
import evented from '../evented'

const featureCollection = new Collection()
export const source = new VectorSource({ features: featureCollection })

const format = new GeoJSON({
  dataProjection: 'EPSG:4326', // WGS84
  featureProjection: 'EPSG:3857' // Web-Mercator
})

const readFeatures = features => features.forEach(feature => {
  // Delete deprecated 'title':
  delete feature.title
  featureCollection.push(format.readFeature(feature))
})

export const layers = (() => {
  Object.values(scenario).forEach(layer => {
    readFeatures(Object.values(layer.features))
  })
  return scenario
})()

const K = v => fn => { fn(v); return v }

const importFile = file => new Promise((resolve, reject) => {
  const reader = new FileReader()
  const filename = file => file.name.substring(0, file.name.indexOf('.'))

  /**
   * Assign internal layer/feature ids;
   * re-werite feature collection as associative array.
   */
  const rewrite = (name, json) => {
    const layerUUID = uuid()
    json.name = name
    json.id = `layer:${layerUUID}`

    // re-write feature array as associative array:
    json.features = json.features.reduce((acc, feature) => {
      feature.id = `feature:${layerUUID}/${uuid()}`
      acc[feature.id] = feature
      return acc
    }, {})

    return json
  }

  reader.onload = (({ target }) => {
    if (target.error) reject(target.error)
    else resolve(rewrite(filename(file), JSON.parse(target.result)))
  })
  reader.readAsText(file)
})

export const load = async files => {
  const json = await Promise.all(files.map(importFile))
  json.reduce((acc, layer) => K(acc)(acc => {
    acc[layer.id] = layer
    readFeatures(Object.values(layer.features))
  }), layers)
  evented.emit({ type: 'model.changed' })
}

evented.on(event => {
  if (event.type === 'command.layer.update') {
    const layer = layers[event.id]
    if (layer.name !== event.properties.name) {
      layer.name = event.properties.name
      evented.emit({ type: 'model.changed' })
    }
  }
  else if (event.type === 'command.feature.update') {
    const layerUUID = event.id.split(':')[1].split('/')[0]
    const layer = layers[`layer:${layerUUID}`]
    const feature = layer.features[event.id]
    if (feature.properties.t !== event.properties.t) {
      feature.properties.t = event.properties.t
      evented.emit({ type: 'model.changed'})
    }
  }
})

export const identity = sidc => sidc[1] === 'F' ? ['OWN'] : sidc[1] === 'H' ? ['ENEMY'] : []
