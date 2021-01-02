import VectorSource from 'ol/source/Vector'
import GeoJSON from 'ol/format/GeoJSON'
import { getFeatures } from './helpers'
import { storage } from '.'
import evented from '../evented'
import { isFeature } from './ids'

// -> OpenLayers interface (ol/source/Vector)

const format = new GeoJSON({
  dataProjection: 'EPSG:4326', // WGS84
  featureProjection: 'EPSG:3857' // Web-Mercator
})

export const source = new VectorSource()
const features = p => {
  const xs = []
  source.forEachFeature(feature => {
    if (p(feature)) xs.push(feature)
  })
  return xs
}

const readFeature = feature => format.readFeature(feature)
const readFeatures = features => features.map(readFeature)
const addFeatures = features => source.addFeatures(readFeatures(features))
const removeFeatures = features => features.forEach(feature => source.removeFeature(feature))
const visibleFeatures = () => getFeatures(storage.keys())(feature => !feature.hidden)
addFeatures(visibleFeatures())

evented.on(({ type, changes }) => {
  if (type !== 'storage.changed') return
  const updatedIds = changes.update.map(item => item.id).filter(isFeature)
  removeFeatures(features(feature => changes.removal.includes(feature.getId())))
  removeFeatures(features(feature => updatedIds.includes(feature.getId())))

  addFeatures(changes.addition
    .filter(item => isFeature(item.id))
    .filter(item => !item.hidden)
  )

  addFeatures(changes.update
    .filter(item => isFeature(item.id))
    .filter(item => !item.hidden)
  )
})

return source

// <- OpenLayers interface (ol/source/Vector)
