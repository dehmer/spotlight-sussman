import { storage } from '.'
import { isLayer, isFeature, layerId } from './ids'

export const item = id => storage.getItem(id)
export const features = keys => p => keys.filter(isFeature).map(item).filter(p)
export const isContained = id => feature => layerId(feature) === id
export const containedFeatures = id => isLayer(id)
  ? features(storage.keys())(isContained(id))
  : []
