import VectorSource from 'ol/source/Vector'
import Collection from 'ol/Collection'
import Feature from 'ol/Feature'
import GeoJSON from 'ol/format/GeoJSON'
import uuid from 'uuid-random'
import scenario from './mip-scenario.json'
import evented from '../evented'

const isString = v => typeof v === 'string' || v instanceof String
export const isLayer = id => id.startsWith('layer:')
export const isFeature = id => id.startsWith('feature:')

const layerId = v =>
  isString(v)
    ? isFeature(v)
      ? `layer:${v.split(':')[1].split('/')[0]}`
      : isLayer(v)
        ? v
        : `layer:${v}` // UUID
    : v instanceof Feature
      ? layerId(v.getId())
      : undefined


const featureCollection = new Collection()

const features = (p = () => true) => {
  const features = []
  featureCollection.forEach(feature => {
    if (p(feature)) features.push(feature)
  })

  return features
}

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
    const features = Object.values(layer.features)
    readFeatures(features)
  })
  return scenario
})()

const feature = id => layers[layerId(id)].features[id]

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

// ==> Event handlers

// TODO: handle tags updated
const update = ({ id, properties}) => {
  if (isLayer(id)) {
    const layer = layers[id]
    if (layer.name === properties.name) return
    layer.name = properties.name
    evented.emit({ type: 'model.changed' })
  } else if (isFeature(id)) {
    const feature = layers[layerId(id)].features[id]
    if (feature.properties.t === properties.t) return
    feature.properties.t = properties.t
    evented.emit({ type: 'model.changed' })
  }
}

const hide = ({ ids }) => {
  const removals = ids.reduce((acc, id) => {
    if (isLayer(id)) {
      layers[id].hidden = true
      return acc.concat(features(feature => layerId(feature) === id))
    } else if (isFeature(id)) {
      layers[layerId(id)].features[id].hidden = true
      return acc.concat(features(feature => feature.getId() === id))
    } else return acc
  }, [])

  removals.forEach(feature => featureCollection.remove(feature))
  evented.emit({ type: 'model.changed' })
}

const show = ({ ids }) => {
  const additions = ids.reduce((acc, id) => {
    if (isLayer(id)) {
      delete layers[id].hidden
      return acc.concat(Object.values(layers[id].features))
    } else if (isFeature(id)) {
      delete layers[layerId(id)].features[id].hidden
      return acc.concat(layers[layerId(id)].features[id])
    } return acc
  }, [])

  readFeatures(additions)
  evented.emit({ type: 'model.changed' })
}

const handlers = {
  update, hide, show,
  layer: event => {
    switch (event.property) {
      case 'tags': {
        const tags = event.value
          .filter(tag => tag.type === 'USER')
          .map(tag => tag.label)

        layers[event.id].tags = tags
        evented.emit({ type: 'model.changed' })
        break
      }
    }
  },
  feature: event => {
    switch (event.property) {
      case 'tags': {
        const tags = event.value
          .filter(tag => tag.type === 'USER')
          .map(tag => tag.label)

        feature(event.id).tags = tags
        evented.emit({ type: 'model.changed' })
        break
      }
    }
  }
}



evented.on(event => {
  if (event.type.startsWith('command.layer')) {
    // more old school way...
    const command = event.type.split('.')[2]
    ;(handlers[command] || (() => {}))(event)
  } else if (event.type === 'command.model.update') {
    // fresh attempt on event handling...
    const [scope] = event.id.split(':')
    ;(handlers[scope] || (() => {}))(event)
  }
})

export const identity = sidc => sidc[1] === 'F'
  ? ['OWN']
  : sidc[1] === 'H'
    ? ['ENEMY']
    : []

