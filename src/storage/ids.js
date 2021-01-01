import * as R from 'ramda'
import uuid from 'uuid-random'
import Feature from 'ol/Feature'

export const layerId = R.cond([
  [R.isNil, () => `layer:${uuid()}`],
  [x => x instanceof Feature, x => layerId(x.getId())],
  // // must be a string then...
  [R.startsWith('feature:'), x => `layer:${x.split(':')[1].split('/')[0]}`],
  [R.startsWith('layer:'), R.identity],
  [R.T, x => layerId(x.id)]
])

export const featureId = layerId =>
  `feature:${layerId.split(':')[1]}/${uuid()}`

const isId = prefix => id => id.startsWith(prefix)
export const isLayer = isId('layer:')
export const isFeature = isId('feature:')
export const isGroup = isId('group:')
export const isSymbol = isId('symbol:')
