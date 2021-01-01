import * as R from 'ramda'
import uuid from 'uuid-random'
import { storage } from '.'
import { layerId, featureId } from './ids'
import { isLayer, isFeature, isGroup, isSymbol, isPlace } from './ids'
import evented from '../evented'
import { searchIndex } from '../search/lunr'
import { getContainedFeatures } from './helpers'

// -> command handlers

const handlers = {}

/**
 * Item-related helpers.
 */
const Item = {
  show: storage.updateItem(item => delete item.hidden),
  hide: storage.updateItem(item => item.hidden = true),
  addtag: tag => storage.updateItem(item => item.tags = R.uniq([...(item.tags || []), tag])),
  removetag: tag => storage.updateItem(item => item.tags = (item.tags || []).filter(x => x !== tag))
}

const cantag = id => !isGroup(id)
const onmap = id => id && (isFeature(id) || isLayer(id)) || isGroup(id)


/**
 *
 */
handlers.addlayers = ({ layers }) => {

  // Overwrite existing layers, i.e. delete before re-adding.
  const names = layers.map(R.prop('name'))
  const [layerIds, otherIds] = R.partition(isLayer, storage.keys())
  const featureIds = otherIds.filter(isFeature)

  const removals = layerIds
    .map(storage.getItem)
    .filter(layer => names.includes(layer.name))
    .map(layer => layer.id)

  featureIds.reduce((acc, featureId) => {
    if (acc.includes(layerId(featureId))) acc.push(featureId)
    return acc
  }, removals)

  removals.forEach(id => storage.removeItem(id))

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
  })
}


/**
 *
 */
handlers.visible = ({ ids }) => storage.getItems(ids.filter(onmap))
  .forEach(item => {

  if (isGroup(item.id)) {
    const ids = searchIndex(item.terms)
      .filter(({ ref }) => !isGroup(ref))
      .filter(({ ref }) => !isSymbol(ref))
      .map(({ ref }) => ref)
    evented.emit({ type: 'command.storage.visible', ids })
    return
  }

  ;[item, ...getContainedFeatures(item.id)].forEach(Item.hide)
})

/**
 *
 */
handlers.hidden = ({ ids }) => storage.getItems(ids.filter(onmap))
  .forEach(item => {

  if (isGroup(item.id)) {
    const ids = searchIndex(item.terms)
      .filter(({ ref }) => !isGroup(ref))
      .filter(({ ref }) => !isSymbol(ref))
      .map(({ ref }) => ref)
    evented.emit({ type: 'command.storage.hidden', ids })
    return
  }

  ;[item, ...getContainedFeatures(item.id)].forEach(Item.show)
})

/**
 *
 */
handlers.addtag = ({ ids, tag }) => storage.getItems(ids.filter(cantag))
  .filter(R.identity)
  .forEach(item => {
    Item.addtag(tag)(item)
    if (isPlace(item.id)) storage.updateItem(place => place.sticky = true)
  })


/**
 *
 */
handlers.removetag = ({ ids, tag }) => storage.getItems(ids.filter(cantag))
  .filter(R.identity)
  .forEach(Item.removetag(tag))

/**
 *
 */
handlers.rename = ({ id, name }) => {
  const rename = R.cond([
    [R.compose(isFeature, R.prop('id')), feature => feature.properties.t = name.trim()],
    [R.compose(isPlace, R.prop('id')), place => {
      place.name = name.trim()
      place.sticky = true
    }],
    [R.T, item => item.name = name.trim()]
  ])

  storage.updateKey(rename)(id)
}

handlers.newgroup = () => {
  const search = storage.getItem('search:')
  if (!search) return
  const { terms } = search

  const fields = terms.split(' ')
    .filter(R.identity)
    .map(part => R.drop(1, (/\+?(\w+):(\w+)/g).exec(part)))
    .reduce((acc, tuple) => {
      acc[tuple[0]] = acc[tuple[0]] || []
      acc[tuple[0]].push(tuple[1])
      return acc
    }, {})

  const id = `group:${uuid()}`
  const name = (fields.text || []).join(' ') || 'N/A'
  storage.setItem({ id, name, terms, ...fields })
}

handlers.remove = ({ ids }) => storage.getItems(ids).forEach(item => {
  if (!item) return
  storage.removeItem(item.id)
  const features = getContainedFeatures(item.id)
  features.forEach(item => storage.removeItem(item.id))
})

// <- command handlers

evented.on(event => {
  if (!event.type) return
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
