import * as R from 'ramda'
import Collection from 'ol/Collection'
import VectorSource from 'ol/source/Vector'
import GeoJSON from 'ol/format/GeoJSON'
import { featureId } from './ids'
import { hierarchy, url } from './symbols'
import evented from '../evented'
import { layerId } from './ids'

const features = {}

// -> OpenLayers interface (ol/source/Vector)

const featureCollection = new Collection()
export const source = new VectorSource({ features: featureCollection })

const format = new GeoJSON({
  dataProjection: 'EPSG:4326', // WGS84
  featureProjection: 'EPSG:3857' // Web-Mercator
})

const readFeatures = features => features.forEach(feature => {
  featureCollection.push(format.readFeature(feature))
})

// <- OpenLayers interface (ol/source/Vector)

// -> lunr documents interface

export const lunr = (() => {
  const tags = ({ hidden, tags }) => [
    hidden ? 'hidden' : 'visible',
    ...(tags || [])
  ]

  const document = feature => {
    const { id, properties, layer } = feature
    const { t, sidc } = properties
    return {
      id,
      scope: 'feature',
      tags: tags(feature),
      text: `${t} ${hierarchy(sidc).join(' ')} ${layer().name}`
    }
  }

  return () => Object.values(features).map(document)
})()

// <- lunr documents interface

// -> Spotlight interface

export const option = (() => {
  const tags = ({ id, hidden, tags }) => {
    const changeVisibility = () => {
      const type = hidden ? 'command.show' : 'command.hide'
      evented.emit({ type, id })
    }

    const scope = { type: 'SCOPE', label: 'FEATURE' }
    const visibility = hidden
      ? { type: 'SYSTEM', label: 'HIDDEN', action: changeVisibility }
      : { type: 'SYSTEM', label: 'VISIBLE', action: changeVisibility }

    return [
      scope,
      visibility,
      ...(tags || []).map(label => ({ type: 'USER', label }))
    ]
  }

  const option = feature => {
    const { properties, layer } = feature
    const { sidc, t } = properties
    const description = layer().name.toUpperCase() + ' ⏤ ' + hierarchy(sidc).join(' • ')

    return {
      id: feature.id,
      title: t || 'N/A',
      description,
      url: url(sidc),
      tags: tags(feature),
      capabilities: ['RENAME']
    }
  }

  return id => option(features[id])
})()

// <- Spotlight interface

export const pushFeatures = xs => {
  xs.reduce((acc, feature) => R.tap(acc => {
    feature.id = featureId(feature.layer().id)
    acc[feature.id] = feature
  }, acc), features)

  // NOTE: feature.id is carried over as feature's id.
  readFeatures(xs)
}

// -> command interface

;(() => {
  const filterFeatures = (p = () => true) => {
    const features = []
    featureCollection.forEach(feature => {
      if (p(feature)) features.push(feature)
    })

    return features
  }

  const handlers = { layer: {}, feature: {} }

  handlers.layer.hide = ({ id }) =>
    filterFeatures(feature => layerId(feature) === id)
      .forEach(feature => featureCollection.remove(feature))

  handlers.layer.show = ({ id }) => readFeatures(
    Object.values(features)
      .filter(feature => layerId(feature.id) === id)
      .filter(feature => !feature.hidden)
  )

  handlers.feature.hide = ({ id }) => {
    features[id].hidden = true
    filterFeatures(feature => feature.getId() === id)
      .forEach(feature => featureCollection.remove(feature))
  }

  handlers.feature.show = ({ id }) => {
    delete features[id].hidden
    readFeatures([features[id]])
  }

  handlers.feature['update-name'] = ({ id, name }) => features[id].properties.t = name
  handlers.feature['add-tag'] = ({ id, tag }) => features[id].tags = R.uniq([...(features[id].tags || []), tag]),
  handlers.feature['remove-tag'] = ({ id, tag }) => features[id].tags = features[id].tags.filter(x => x !== tag)

  evented.on(event => {
    const [type, command] = event.type.split('.')
    if (type !== 'command') return

    const [scope] = event.id.split(':')
    if (!handlers[scope]) return
    if (!handlers[scope][command]) return

    handlers[scope][command](event)
    evented.emit({ type: 'model.changed' })
  })
})()

// <- command interface
