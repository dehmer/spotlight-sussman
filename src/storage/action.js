import Collection from 'ol/Collection'
import Feature from 'ol/Feature'
import { getCenter } from 'ol/extent'
import { storage, txn } from '.'
import emitter from '../emitter'
import { isLayer, isFeature, isGroup, isSymbol, isPlace } from './ids'
import { FEATURE_ID, LAYER_ID, PLACE_ID, GROUP_ID } from './ids'
import { isContained, getContainedFeatures, getItem } from './helpers'
import { options } from '../model/options'
import { searchIndex } from '../search/lunr'
import { readGeometry, readFeature } from './format'
import * as TS from '../map/ts'

const option = id => options[id.split(':')[0]](id)
export const highlightedFeatures = new Collection()

emitter.on(`:id(${LAYER_ID})/open`, ({ id }) => {
  const layer = option(id)
  const features = () => storage.keys()
    .filter(isContained(id))
    .filter(isFeature)
    .map(option)

  emitter.emit('search/provider', {
    scope: layer.title,
    provider: (query, callback) => callback(features())
  })
})

emitter.on(`:id(${GROUP_ID})/open`, ({ id }) => {
  const group = getItem(id)
  const options = () => searchIndex(group.terms)
    .filter(({ ref }) => !isGroup(ref))
    .filter(({ ref }) => !isSymbol(ref))
    .map(({ ref }) => ref)
    .map(option)

  emitter.emit('search/provider', {
    scope: group.title,
    provider: (query, callback) => callback(options())
  })
})

emitter.on(`:id(${PLACE_ID})/panto`, txn((storage, { id }) => {
  const item = storage.getItem(id)
  const geometry = readGeometry(item.geojson)
  const extent = geometry.getExtent()
  const center = getCenter(extent)
  emitter.emit('map/panto', { center, resolution: item.resolution })
}))

emitter.on(`:id(${FEATURE_ID})/panto`, txn((storage, { id }) => {
  const item = storage.getItem(id)
  const geometry = readFeature(item).getGeometry()
  const center = getCenter(geometry.getExtent())
  emitter.emit('map/panto', { center })
}))

emitter.on(`:id(${LAYER_ID})/identify/down`, ({ id }) => {
  const geometries = getContainedFeatures(id)
    .map(readFeature)
    .map(feature => feature.getGeometry())
    .map(TS.read)
  const collection = TS.collect(geometries)
  const bounds = TS.minimumRectangle(collection)
  highlightedFeatures.push(new Feature({ geometry: TS.write(bounds) }))
})

emitter.on(`:id(${FEATURE_ID})/identify/down`, ({ id }) => {
  const item = storage.getItem(id)
  const feature = readFeature(item)
  const geometry = TS.read(feature.getGeometry())
  const bounds = feature.getGeometry().getType() === 'Polygon'
    ? geometry
    : TS.minimumRectangle(geometry)
  highlightedFeatures.push(new Feature({ geometry: TS.write(bounds) }))
})

emitter.on(`:id(${PLACE_ID})/identify/down`, ({ id }) => {
  const item = storage.getItem(id)
  const geometry = readGeometry(item.geojson)
  const feature = new Feature({ geometry })
  highlightedFeatures.push(feature)
})

emitter.on(`:id(${GROUP_ID})/identify/down`, ({ id }) => {
  const item = storage.getItem(id)
  const geometries = searchIndex(item.terms)
    .filter(({ ref }) => !isGroup(ref))
    .filter(({ ref }) => !isSymbol(ref))
    .map(({ ref }) => ref)
    .filter(id => isLayer(id) || isFeature(id))
    .flatMap(id => isLayer(id) ? getContainedFeatures(id) : storage.getItem(id))
    .map(readFeature)
    .map(feature => feature.getGeometry())
    .map(TS.read)
  const collection = TS.collect(geometries)
  const bounds = TS.minimumRectangle(collection)
  highlightedFeatures.push(new Feature({ geometry: TS.write(bounds) }))
})

emitter.on(`:dontcare(.*)/identify/up`, () => {
  highlightedFeatures.clear()
})
