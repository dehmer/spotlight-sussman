import Collection from 'ol/Collection'
import Feature from 'ol/Feature'
import { storage } from '../storage'
import { featureId } from '../storage/ids'
import evented from '../evented'
import { isFeature } from '../storage/ids'
import selection from './selection'
import { readFeature } from '../storage/format'


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


evented.on(({ type, changes }) => {
  if (type !== 'storage.changed') return
  selection.deselect(changes.removal)
  changes.removal.forEach(removeFeature)
  changes.update.forEach(removeFeature)
  changes.update.forEach(addFeature)
  changes.addition.forEach(addFeature)
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
