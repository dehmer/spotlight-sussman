import Collection from 'ol/Collection'
import Feature from 'ol/Feature'
import { getCenter } from 'ol/extent'
import { storage } from '.'
import evented from '../evented'
import { isLayer, isFeature, isGroup, isSymbol, isPlace } from './ids'
import { isContained, getContainedFeatures, getItem } from './helpers'
import { options } from '../model/options'
import { searchIndex } from '../search/lunr'
import { readGeometry, readFeature } from './format'
import * as TS from '../map/ts'

const option = id => options[id.split(':')[0]](id)

export const highlightedFeatures = new Collection()

const handlers = {}

handlers.open = ({ id }) => {
  if (isLayer(id)) {
    const layer = option(id)
    const features = () => storage.keys()
      .filter(isContained(id))
      .filter(isFeature)
      .map(option)

    evented.emit({
      type: 'command.search.provider',
      scope: layer.title,
      provider: (query, callback) => {
        callback(features())
      }
    })
  } else if (isGroup(id)) {
    const group = getItem(id)
    const options = () => searchIndex(group.terms)
      .filter(({ ref }) => !isGroup(ref))
      .filter(({ ref }) => !isSymbol(ref))
      .map(({ ref }) => ref)
      .map(option)

    evented.emit({
      type: 'command.search.provider',
      scope: group.title,
      provider: (query, callback) => {
        callback(options())
      }
    })
  }
}

handlers.back = ({ id }) => {
  if (isFeature(id)) {
    evented.emit({ type: 'command.search.scope.layer' })
  }
}

handlers.panto = ({ id }) => {
  if (isPlace(id)) {
    const item = storage.getItem(id)
    const geometry = readGeometry(item.geojson)
    const extent = geometry.getExtent()
    const center = getCenter(extent)
    evented.emit({ type: 'map.panto', center, resolution: item.resolution })
  } else if (isFeature(id)) {
    const item = storage.getItem(id)
    const geometry = readFeature(item).getGeometry()
    const center = getCenter(geometry.getExtent())
    evented.emit({ type: 'map.panto', center })
  }
}

handlers.identify = ({ id, trigger }) => {
  if (trigger === 'down') {
    if (isPlace(id)) {
      const item = storage.getItem(id)
      const geometry = readGeometry(item.geojson)
      const feature = new Feature({ geometry })
      highlightedFeatures.push(feature)
    }
    else if (isLayer(id)) {
      const geometries = getContainedFeatures(id)
        .map(readFeature)
        .map(feature => feature.getGeometry())
        .map(TS.read)
      const collection = TS.collect(geometries)
      const bounds = TS.minimumRectangle(collection)
      highlightedFeatures.push(new Feature({ geometry: TS.write(bounds) }))
    } else if (isFeature(id)) {
      const item = storage.getItem(id)
      const feature = readFeature(item)
      const geometry = TS.read(feature.getGeometry())
      const bounds = TS.minimumRectangle(geometry)
      highlightedFeatures.push(new Feature({ geometry: TS.write(bounds) }))
    } else if (isGroup(id)) {
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
    }
  } else if(trigger === 'up') {
    highlightedFeatures.clear()
  }
}

evented.on(event => {
  if (!event.type) return
  if (!event.type.startsWith('action')) return

  const handler = handlers[event.type.split('.')[1]]
  if (!handler) return
  handler(event)
})
