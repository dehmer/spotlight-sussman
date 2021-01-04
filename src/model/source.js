import Collection from 'ol/Collection'
import Feature from 'ol/Feature'
import uuid from 'uuid-random'
import { storage, tx } from '../storage'
import { featureId } from '../storage/ids'
import evented from '../evented'
import { isFeature } from '../storage/ids'
import selection from './selection'
import { readFeature, writeFeaturesObject } from '../storage/format'
import { currentDateTime } from './datetime'

// -> OpenLayers interface (ol/source/Vector)

export const features = new Collection([], { unique: true })
export const selectedFeatures = new Collection([], { unique: true })

const hasId = id => feature => feature.getId() === id
const featureById = id =>
  features.getArray().find(hasId(id)) ||
  selectedFeatures.getArray().find(hasId(id))

/**
 * removeFeature :: ol/Feature | string -> unit
 */
const removeFeature = x => {
  if (!x) return

  if (x instanceof Feature) {
    features.remove(x)
    selectedFeatures.remove(x)
  }
  else if (typeof x === 'string') removeFeature(featureById(x))
  else removeFeature(x.id)
}

const addFeature = x => {
  if (!x || x.hidden || !isFeature(x.id)) return

  const push = selection.selected().includes(featureId(x))
    ? selectedFeatures.push.bind(selectedFeatures)
    : features.push.bind(features)

  push(readFeature(x))
}

const isVisible = feature => feature && !feature.hidden

storage.keys()
  .filter(isFeature)
  .map(storage.getItem)
  .filter(isVisible)
  .map(readFeature)
  .forEach(feature => features.push(feature))


evented.on(event => {
  if (event.type === 'command.storage.snapshot') {
    const changes = tx(storage => {
      const layer = writeFeaturesObject(features.getArray())
      layer.id = `layer:${uuid()}`
      layer.name = `Snapshot - ${currentDateTime()}`
      layer.tags = ['snapshot']

      const featureCollection = layer.features
      delete layer.features

      featureCollection.forEach(feature => {
        feature.id = featureId(layer.id)
        feature.hidden = true
        storage.setItem(feature)
      })
      storage.setItem(layer)
    })

    evented.emit({ type: 'model.changed' })
    evented.emit({ type: 'storage.changed', changes })
  } else if (event.type === 'storage.changed') {
    const { changes } = event
    selection.deselect(changes.removal)
    changes.removal.forEach(removeFeature)
    changes.update.forEach(removeFeature)
    changes.update.forEach(addFeature)
    changes.addition.forEach(addFeature)
  }
})

// <- OpenLayers interface (ol/source/Vector)

// -> selection synchronization

evented.on(event => {
  if (event.type === 'selected') {
    const selected = selectedFeatures.getArray().map(featureId)
    event.list.filter(isFeature).forEach(id => {
      const feature = featureById(id)
      features.remove(feature)
      if (feature && !selected.includes(id)) selectedFeatures.push(feature)
    })
  } else if (event.type === 'deselected') {
    event.list.filter(isFeature).forEach(id => {
      const feature = featureById(id)
      selectedFeatures.remove(feature)
      const item = storage.getItem(id)
      if (isVisible(item)) features.push(readFeature(item))
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
