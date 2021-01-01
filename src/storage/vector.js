import VectorSource from 'ol/source/Vector'
import GeoJSON from 'ol/format/GeoJSON'
import { getFeatures } from './helpers'
import { storage } from '.'
import evented from '../evented'

// -> OpenLayers interface (ol/source/Vector)

const format = new GeoJSON({
  dataProjection: 'EPSG:4326', // WGS84
  featureProjection: 'EPSG:3857' // Web-Mercator
})

export const source = new VectorSource()
const readFeature = feature => format.readFeature(feature)
const readFeatures = features => features.map(readFeature)
const addFeatures = features => source.addFeatures(readFeatures(features))
const visibleFeatures = () => getFeatures(storage.keys())(feature => !feature.hidden)
addFeatures(visibleFeatures())

evented.on(event => {
  if (event.type !== 'model.changed') return
  const fast = true
  source.clear(fast)
  addFeatures(visibleFeatures())
})

return source

// <- OpenLayers interface (ol/source/Vector)
