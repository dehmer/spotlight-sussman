import * as R from 'ramda'
import VectorSource from 'ol/source/Vector'
import GeoJSON from 'ol/format/GeoJSON'
import Collection from 'ol/Collection'
import { getFeatures } from '../storage/helpers'
import { storage } from '../storage'
import { featureId } from '../storage/ids'
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
const selectedFeatures = new Collection([], { unique: true })
export const selectSource = new VectorSource({ features: selectedFeatures })

const visibleFeatures = () => getFeatures(storage.keys())(feature => !feature.hidden)
Source.addFeatures(defaultSource)(visibleFeatures())

evented.on(({ type, changes }) => {
  if (type !== 'storage.changed') return

  // FIXME: differentiate selected/deselected

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
  if (event.type === 'selected') {
    const selected = selectedFeatures.getArray().map(featureId)
    event.list.filter(isFeature).forEach(id => {
      const feature = defaultSource.getFeatureById(id)
      if (!feature) return /* selection not on map */
      defaultSource.removeFeature(feature)
      if (!selected.includes(id)) selectedFeatures.push(feature)
    })
  } else if (event.type === 'deselected') {
    event.list.filter(isFeature).forEach(id => {
      const feature = selectedFeatures.getArray().find(feature => feature.getId() === id)
      if (feature) selectedFeatures.remove(feature)
      const item = storage.getItem(id)
      if (item) defaultSource.addFeature(readFeature(item))
    })
  }
})

selectedFeatures.on('add', ({ element }) => {
  selection.select([element.getId()])
})

selectedFeatures.on('remove', ({ element }) => {
  selection.deselect([element.getId()])
})

// -> selection synchronization
