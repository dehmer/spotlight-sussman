import * as R from 'ramda'
import VectorSource from 'ol/source/Vector'
import GeoJSON from 'ol/format/GeoJSON'
import { getFeatures } from '../storage/helpers'
import { storage } from '../storage'
import evented from '../evented'
import { isFeature } from '../storage/ids'
import selection from './selection'

const format = new GeoJSON({
  dataProjection: 'EPSG:4326', // WGS84
  featureProjection: 'EPSG:3857' // Web-Mercator
})

const readFeature = feature => format.readFeature(feature)
const readFeatures = features => features.map(readFeature)

const Source = {}
Source.featureById = source => id => source.getFeatureById(id)
Source.featuresById = source => ids => ids.map(Source.featureById(source)).filter(R.identity)
Source.addFeatures = source => features => source.addFeatures(readFeatures(features))
Source.removeFeatures = source => features => features.forEach(feature => source.removeFeature(feature))
Source.features = source => p => source.getFeatures().filter(p)

// -> OpenLayers interface (ol/source/Vector)

export const defaultSource = new VectorSource()
export const selectSource = new VectorSource()

const visibleFeatures = () => getFeatures(storage.keys())(feature => !feature.hidden)
Source.addFeatures(defaultSource)(visibleFeatures())

evented.on(({ type, changes }) => {
  if (type !== 'storage.changed') return
  const featuresById = Source.featuresById(defaultSource)
  const addFeatures = Source.addFeatures(defaultSource)
  const removeFeatures = Source.removeFeatures(defaultSource)

  const updatedIds = changes.update.map(item => item.id).filter(isFeature)
  removeFeatures(featuresById(changes.removal))
  removeFeatures(featuresById(updatedIds))

  addFeatures(changes.addition
    .filter(item => isFeature(item.id))
    .filter(item => !item.hidden)
  )

  addFeatures(changes.update
    .filter(item => isFeature(item.id))
    .filter(item => !item.hidden)
  )
})

// <- OpenLayers interface (ol/source/Vector)

// -> selection synchronization

evented.on(event => {
  if (event.type !== 'selected' && event.type !== 'deselected')  return
  const selected = selection.selected()

  // Move new selections:
  Source.featuresById(defaultSource)(selected)
    .forEach(feature => {
      selectSource.addFeature(feature)
      defaultSource.removeFeature(feature)
    })

  // Move old selections:
  selectSource.getFeatures()
    .filter(feature => !selected.includes(feature.getId()))
    .forEach(feature => {
      defaultSource.addFeature(feature)
      selectSource.removeFeature(feature)
    })
})

// -> selection synchronization
