import * as R from 'ramda'
import uuid from 'uuid-random'
import * as geom from 'ol/geom'
import { storage, txn } from '.'
import { layerId, featureId } from './ids'
import { isLayer, isFeature, isGroup, isSymbol } from './ids'
import { FEATURE_ID, LAYER_ID, PLACE_ID, GROUP_ID, SYMBOL_ID } from './ids'
import emitter from '../emitter'
import { searchIndex } from '../search/lunr'
import { getContainedFeatures } from './helpers'
import { writeGeometry } from './format'

// -> command handlers

const ids = () => R.uniq(selection.selected())

emitter.on('layers/import', txn((storage, { layers }) => {

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
}))

emitter.on(`:id(${FEATURE_ID})/hide`, txn((storage, { id }) => {
  storage.getItem(id)
  storage.updateItem(item => item.hidden = true)(item)
}))

emitter.on(`:id(${FEATURE_ID})/show`, txn((storage, { id }) => {
  const item = storage.getItem(id)
  storage.updateItem(item => delete item.hidden)(item)
}))

emitter.on(`:id(${LAYER_ID})/hide`, txn((storage, { id }) => {
  const item = storage.getItem(id)
  ;[item, ...getContainedFeatures(id)].forEach(storage.updateItem(item => item.hidden = true))
}))

emitter.on(`:id(${LAYER_ID})/show`, txn((storage, { id }) => {
  const item = storage.getItem(id)
  ;[item, ...getContainedFeatures(id)].forEach(storage.updateItem(item => delete item.hidden))
}))

emitter.on(`:id(${GROUP_ID})/hide`, txn((storage, { id }) => {
  const item = storage.getItem(id)
  searchIndex(item.terms)
    .filter(({ ref }) => !isGroup(ref) && !isSymbol(ref))
    .map(({ ref }) => ref)
    .flatMap(id => [storage.getItem(id), ...getContainedFeatures(id)])
    .forEach(storage.updateItem(item => item.hidden = true))
}))

emitter.on(`:id(${GROUP_ID})/show`, txn((storage, { id }) => {
  const item = storage.getItem(id)
  searchIndex(item.terms)
    .filter(({ ref }) => !isGroup(ref) && !isSymbol(ref))
    .map(({ ref }) => ref)
    .flatMap(id => [storage.getItem(id), ...getContainedFeatures(id)])
    .forEach(storage.updateItem(item => delete item.hidden))
}))

const addtag = txn((storage, { id, tag }) => {
  storage.updateKey(item => item.tags = R.uniq([...(item.tags || []), tag]))(id)
})

emitter.on(`:id(${LAYER_ID})/tag/add`, addtag)
emitter.on(`:id(${FEATURE_ID})/tag/add`, addtag)
emitter.on(`:id(${SYMBOL_ID})/tag/add`, addtag)
emitter.on(`:id(${PLACE_ID})/tag/add`, txn((storage, { id, tag }) => {
  storage.updateKey(item => {
    item.tags = R.uniq([...(item.tags || []), tag])
    item.sticky = true
  })(id)
}))

const removetag = txn((storage, { id, tag }) => {
  storage.updateKey(item => item.tags = (item.tags || []).filter(x => x !== tag))(id)
})

emitter.on(`:id(${LAYER_ID})/tag/remove`, removetag)
emitter.on(`:id(${FEATURE_ID})/tag/remove`, removetag)
emitter.on(`:id(${SYMBOL_ID})/tag/remove`, removetag)
emitter.on(`:id(${PLACE_ID})/tag/remove`, removetag)

const rename = txn((storage, { id, name }) => {
  storage.updateKey(item => item.name = name.trim())(id)
})

emitter.on(`:id(${LAYER_ID})/rename`, rename)
emitter.on(`:id(${GROUP_ID})/rename`, rename)

emitter.on(`:id(${FEATURE_ID})/rename`, txn((storage, { id, name }) => {
  storage.updateKey(feature => feature.properties.t = name.trim())(id)
}))

emitter.on(`:id(${PLACE_ID})/rename`, txn((storage, { id, name }) => {
  storage.updateKey(place => {
    place.name = name.trim()
    place.sticky = true
  })(id)
}))

emitter.on('items/remove', txn((storage, { ids }) => {
  storage.getItems(ids).forEach(item => {
    if (!item) return
    storage.removeItem(item.id)
    const features = getContainedFeatures(item.id)
    features.forEach(item => storage.removeItem(item.id))
  })
}))

emitter.on('storage/group', txn(storage => {
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
}))

emitter.on('storage/bookmark', txn(storage => {
  const view = storage.getItem('session:map.view')
  if (!view) return
  const point = new geom.Point(view.center)
  const geometry = writeGeometry(point)

  storage.setItem({
    id: `place:${uuid()}`,
    display_name: 'Bookmark',
    name: 'Bookmark',
    class: 'bookmark',
    type: 'boundary',
    sticky: true,
    geojson: JSON.parse(geometry),
    resolution: view.resolution
  })
}))

emitter.on('search/current', ({ terms }) => {
  storage.setItem({ id: 'search:', terms })
})

// <- command handlers
