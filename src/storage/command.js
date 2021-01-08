import * as R from 'ramda'
import uuid from 'uuid-random'
import * as geom from 'ol/geom'
import DateTime from 'luxon/src/datetime'
import { storage, txn } from '.'
import { layerId, featureId } from './ids'
import { isLayer, isFeature, isGroup, isSymbol, isPlace, isLink } from './ids'
import { FEATURE_ID, LAYER_ID, PLACE_ID, GROUP_ID, SYMBOL_ID, LINK_ID } from './ids'
import emitter from '../emitter'
import { searchIndex } from '../search/lunr'
import { writeGeometry } from './format'
import selection from '../model/selection'
import { currentDateTime, toMilitaryTime } from '../model/datetime'

// -> command handlers

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

const contained = R.cond([
  [R.is(Array), ids => ids.reduce((acc, id) => acc.concat([id, ...contained(id)]), [])],
  [isLayer, pid => storage.keys().filter(cid => layerId(cid) === pid)],
  [isGroup, gid => {
    const ids = searchIndex(storage.getItem(gid).terms)
      .filter(({ ref }) => !isGroup(ref) && !isSymbol(ref))
      .map(({ ref }) => ref)
    return contained(ids)
  }],
  [R.T, id => [id]]
])

const showItem = item => delete item.hidden
const hideItem = item => item.hidden = true

emitter.on(`:id(.*)/show`, txn((storage, { id }) => {
  const ids = R.uniq([id, ...selection.selected()])
  ids.flatMap(id => contained(id)).forEach(storage.updateKey(showItem))
}))

emitter.on(`:id(.*)/hide`, txn((storage, { id }) => {
  const ids = R.uniq([id, ...selection.selected()])
  ids.flatMap(id => contained(id)).forEach(storage.updateKey(hideItem))
}))

const taggable = id => !isGroup(id)
const addtag = txn((storage, { id, tag }) => {
  const ids = R.uniq([id, ...selection.selected(taggable)])
  const op = item => item.tags = R.uniq([...(item.tags || []), tag])
  ids.forEach(storage.updateKey(op))
})

emitter.on(`:id(${LAYER_ID})/tag/add`, addtag)
emitter.on(`:id(${FEATURE_ID})/tag/add`, addtag)
emitter.on(`:id(${SYMBOL_ID})/tag/add`, addtag)
emitter.on(`:id(${GROUP_ID})/tag/add`, addtag)
emitter.on(`:id(${LINK_ID})/tag/add`, addtag)
emitter.on(`:id(${PLACE_ID})/tag/add`, txn((storage, { id, tag }) => {
  storage.updateKey(item => {
    item.tags = R.uniq([...(item.tags || []), tag])
    item.sticky = true
  })(id)
}))

const removetag = txn((storage, { id, tag }) => {
  const ids = R.uniq([id, ...selection.selected(taggable)])
  const op = item => item.tags = (item.tags || []).filter(x => x !== tag)
  ids.forEach(storage.updateKey(op))
})

emitter.on(`:id(${LAYER_ID})/tag/remove`, removetag)
emitter.on(`:id(${FEATURE_ID})/tag/remove`, removetag)
emitter.on(`:id(${SYMBOL_ID})/tag/remove`, removetag)
emitter.on(`:id(${GROUP_ID})/tag/remove`, removetag)
emitter.on(`:id(${LINK_ID})/tag/remove`, removetag)
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

  const link = id => {
    const item = storage.getItem(id)
    if (!item) return /* already gone */
    const ref = storage.getItem(item.ref)
    if (!ref) return /* already gone */

    storage.updateItem(ref => {
      ref.links = ref.links.filter(link => link !== item.id)
      if (ref.links.length === 0 && isFeature(ref.id)) {
        ref.properties.g = ref.properties.g.replace(/►/g, '').trim()
      }
    })(ref)
  }

  const layer = pid => {
    storage.keys().filter(cid => isFeature(cid) && layerId(cid) === pid).forEach(remove)
    R.forEach(remove, storage.getItem(pid).links || [])
  }

  const feature = id => {
    R.forEach(remove, storage.getItem(id).links || [])
  }

  const remove = id => {
    // Remove/clean-up dependencies first:
    R.cond([
      [isLink, link],
      [isLayer, layer],
      [isFeature, feature]
    ])(id)

    storage.removeItem(id)
  }

  R.uniq(ids.filter(R.identity)).forEach(remove)
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

emitter.on('storage/layer', txn(storage => {
  const features = pid => id => {
    if (isPlace(id)) {
      const place = storage.getItem(id)
      return {
        id: featureId(pid),
        type: 'Feature',
        geometry: place.geojson,
        properties: { t: place.name },
        tags: place.tags
      }
    } else return []
  }

  const item = storage.getItem('search:')
  const ids = searchIndex(item.terms)
    .filter(({ ref }) => !isGroup(ref) && !isSymbol(ref))
    .map(({ ref }) => ref)

  const pid = layerId()
  const items = R.uniq(contained(ids)).flatMap(features(pid))
  const tags = R.uniq(items.flatMap(R.prop('tags')))
  storage.setItem({ id: pid, name: `Layer - ${currentDateTime()}`, tags })
  items.forEach(storage.setItem)
}))

emitter.on('search/current', ({ terms }) => {
  storage.setItem({ id: 'search:', terms })
})


/**
 *
 */
emitter.on(`:id(${FEATURE_ID})/links/add`, txn((storage, { id, files }) => {
  const item = storage.getItem(id)

  const links = files.map(file => ({
    id: `link:${uuid()}`,
    ref: id,
    container: item.properties.t,
    name: file.name,
    lastModifiedDate: toMilitaryTime(DateTime.fromJSDate(file.lastModifiedDate)),
    type: file.type
  }))

  links.forEach(storage.setItem)

  const appendMarker = s => s ? `${s} ►` : '►'

  storage.updateItem(item => {
    const properties = item.properties
    if (!item.links || item.links.length === 0) properties.g = appendMarker(properties.g)
    item.links = [...(item.links || []), ...links.map(link => link.id)]
  })(item)
}))


/**
 *
 */
emitter.on(`:id(${LAYER_ID})/links/add`, txn((storage, { id, files }) => {
  const item = storage.getItem(id)

  const links = files.map(file => ({
    id: `link:${uuid()}`,
    ref: id,
    container: item.name,
    name: file.name,
    lastModifiedDate: toMilitaryTime(DateTime.fromJSDate(file.lastModifiedDate)),
    type: file.type
  }))

  links.forEach(storage.setItem)

  storage.updateItem(item => {
    item.links = [...(item.links || []), ...links.map(link => link.id)]
  })(item)
}))

// <- command handlers
