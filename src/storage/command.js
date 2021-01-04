import * as R from 'ramda'
import uuid from 'uuid-random'
import { storage, tx } from '.'
import { layerId, featureId } from './ids'
import { isLayer, isFeature, isGroup, isSymbol, isPlace } from './ids'
import evented from '../evented'
import { searchIndex } from '../search/lunr'
import { getContainedFeatures } from './helpers'




// -> command handlers

const handlers = {}

const cantag = id => !isGroup(id)
const onmap = id => id && (isFeature(id) || isLayer(id)) || isGroup(id)


/**
 *
 */
handlers.addlayers = (storage, { layers }) => {

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
handlers.visible = (storage, { ids }) => storage.getItems(ids.filter(onmap))
  .forEach(item => {

  if (isGroup(item.id)) {
    const ids = searchIndex(item.terms)
      .filter(({ ref }) => !isGroup(ref))
      .filter(({ ref }) => !isSymbol(ref))
      .map(({ ref }) => ref)
    handlers.visible(storage, { ids })
    return
  }

  ;[item, ...getContainedFeatures(item.id)]
    .forEach(storage.updateItem(item => item.hidden = true))
})

/**
 *
 */
handlers.hidden = (storage, { ids }) => storage.getItems(ids.filter(onmap))
  .forEach(item => {

  if (isGroup(item.id)) {
    const ids = searchIndex(item.terms)
      .filter(({ ref }) => !isGroup(ref))
      .filter(({ ref }) => !isSymbol(ref))
      .map(({ ref }) => ref)
    handlers.hidden(storage, { ids })
    return
  }

  ;[item, ...getContainedFeatures(item.id)]
    .forEach(storage.updateItem(item => delete item.hidden))
})

/**
 *
 */
handlers.addtag = (storage, { ids, tag }) => storage.getItems(ids.filter(cantag))
  .filter(R.identity)
  .forEach(item => storage.updateItem(item => {
    item.tags = R.uniq([...(item.tags || []), tag])
    if (isPlace(item.id)) item.sticky = true
  })(item))


/**
 *
 */
handlers.removetag = (storage, { ids, tag }) => storage.getItems(ids.filter(cantag))
  .filter(R.identity)
  .forEach(storage.updateItem(item => item.tags = (item.tags || []).filter(x => x !== tag)))


/**
 *
 */
handlers.rename = (storage, { id, name }) => {
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


/**
 *
 */
handlers.newgroup = storage => {
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

handlers.remove = (storage, { ids }) => {
  storage.getItems(ids).forEach(item => {
    if (!item) return
    storage.removeItem(item.id)
    const features = getContainedFeatures(item.id)
    features.forEach(item => storage.removeItem(item.id))
  })
}

// <- command handlers

evented.on(event => {
  if (!event.type) return
  if (!event.type.startsWith('command.storage')) return
  if (event.trigger !== 'click') return

  const handler = handlers[event.type.split('.')[2]]
  if (!handler) return

  const changes = tx(storage => handler(storage, event))
  evented.emit({ type: 'model.changed' })
  evented.emit({ type: 'storage.changed', changes })
})

evented.on(event => {
  if (event.type !== 'search.current') return
  storage.setItem({ id: 'search:', terms: event.terms })
})
