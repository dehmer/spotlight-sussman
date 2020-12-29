import * as R from 'ramda'
import uuid from 'uuid-random'
import Collection from 'ol/Collection'
import VectorSource from 'ol/source/Vector'
import GeoJSON from 'ol/format/GeoJSON'
import { storage } from '.'
import { layerId, featureId } from './ids'
import evented from '../evented'
import { search } from '../search/lunr'

const isId = prefix => id => id.startsWith(prefix)
const isLayerId = isId('layer:')
const isFeatureId = isId('feature:')
const isGroupId = isId('group:')
const item = id => storage.getItem(id)
const features = keys => p => keys.filter(isFeatureId).map(item).filter(p)

// -> OpenLayers interface (ol/source/Vector)

const format = new GeoJSON({
  dataProjection: 'EPSG:4326', // WGS84
  featureProjection: 'EPSG:3857' // Web-Mercator
})

const featureCollection = (() => {
  const collection = new Collection()
  const push = feature => collection.push(format.readFeature(feature))
  features(storage.keys())(feature => !feature.hidden).forEach(push)
  return collection
})()

const filterFeatures = (p = R.T) => {
  const features = []
  featureCollection.forEach(feature => {
    if (p(feature)) features.push(feature)
  })

  return features
}

const removeFeature = feature => featureCollection.remove(feature)
export const source = new VectorSource({ features: featureCollection })

const readFeatures = features => features.forEach(feature => {
  featureCollection.push(format.readFeature(feature))
})

// <- OpenLayers interface (ol/source/Vector)

// -> command handlers

const isContained = id => feature => layerId(feature) === id
const containedFeatures = parent => isLayerId(parent.id)
  ? features(storage.keys())(isContained(parent.id))
  : []


/**
 *
 */
const addlayers = ({ layers }) => {

  // Overwrite existing layers, i.e. delete before re-adding.
  const names = layers.map(R.prop('name'))
  const [layerIds, otherIds] = R.partition(isLayerId, storage.keys())
  const featureIds = otherIds.filter(isFeatureId)

  const removals = layerIds
    .map(item)
    .filter(layer => names.includes(layer.name))
    .map(layer => layer.id)

  featureIds.reduce((acc, featureId) => {
    if (acc.includes(layerId(featureId))) acc.push(featureId)
    return acc
  }, removals)

  removals.forEach(id => storage.removeItem(id))
  filterFeatures(feature => removals.includes(feature.getId())).forEach(removeFeature)

  // Add layers and featues:
  layers.forEach(layer => {
    layer.id = layerId()
    const features = layer.features
    delete layer.features
    delete layer.type
    storage.setItem(layer)

    features.forEach(feature => {
      feature.id = featureId(layer.id)
      storage.setItem(feature)
    })

    readFeatures(features)
  })
}

/**
 *
 */
const visible = ({ ids }) => storage.getItems(ids).forEach(item => {

  if (isGroupId(item.id)) {
    const ids = search(item.terms)
      .filter(({ ref }) => !ref.startsWith('group:'))
      .map(({ ref }) => ref)
    evented.emit({ type: 'command.storage.visible', ids })
    return
  }

  const hide = storage.updateItem(item => item.hidden = true)
  const features = containedFeatures(item)
  ;[item, ...features].forEach(hide)
  const visible = isLayerId(item.id)
    ? feature => layerId(feature) === item.id
    : feature => feature.getId() === item.id
  filterFeatures(visible).forEach(removeFeature)
})

/**
 *
 */
const hidden = ({ ids }) => storage.getItems(ids).forEach(item => {

  if (isGroupId(item.id)) {
    const ids = search(item.terms)
      .filter(({ ref }) => !ref.startsWith('group:'))
      .map(({ ref }) => ref)
    evented.emit({ type: 'command.storage.hidden', ids })
    return
  }

  const show = storage.updateItem(item => delete item.hidden)
  const features = containedFeatures(item)
  ;[item, ...features].forEach(show)
  readFeatures(isLayerId(item.id) ? features : [item])
})

/**
 *
 */
const addtag = ({ ids, tag }) => storage.getItems(ids)
  .forEach(storage.updateItem(item => item.tags = R.uniq([...(item.tags || []), tag])))

/**
 *
 */
const removetag = ({ ids, tag }) => storage.getItems(ids)
  .forEach(storage.updateItem(item => item.tags = item.tags.filter(x => x !== tag)))

/**
 *
 */
const rename = ({ id, name }) => {
  const rename = isFeatureId(id)
    ? (feature => feature.properties.t = name.trim())
    : item => item.name = name.trim()

  storage.updateKey(rename)(id)
}

const group = () => {
  const search = storage.getItem('search:')
  if (!search) return
  const { terms } = search

  const fields = terms.split(' ')
    .map(part => R.drop(1, (/\+(\-?\w+):(\w+)/g).exec(part)))
    .reduce((acc, tuple) => {
      acc[tuple[0]] = acc[tuple[0]] || []
      acc[tuple[0]].push(tuple[1])
      return acc
    }, {})

  const id = `group:${uuid()}`
  const name = (fields.text || []).join(' ') || 'N/A'
  storage.setItem({ id, name, terms, ...fields })
}

const handlers = {
  addlayers,
  visible,
  hidden,
  addtag,
  removetag,
  rename,
  group
}

// <- command handlers

evented.on(event => {
  if (!event.type.startsWith('command.storage')) return
  const handler = handlers[event.type.split('.')[2]]
  if (!handler) return
  handler(event)
  evented.emit({ type: 'model.changed' })
})


evented.on(event => {
  if (event.type !== 'search.current') return
  storage.setItem({ id: 'search:', terms: event.terms })
})