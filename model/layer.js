import uuid from 'uuid-random'
import { url } from './symbol'
import scenario from './mip-scenario.json'

/**
 * Load prepared MIP senario.
 */
export const layers = scenario

const K = v => fn => { fn(v); return v }

const importFile = file => new Promise((resolve, reject) => {
  const reader = new FileReader()
  const filename = file => file.name.substring(0, file.name.indexOf('.'))

  /**
   * Assign internal layer/feature ids;
   * re-werite feature collection as associative array.
   */
  const rewrite = (name, json) => {
    const layerUUID = uuid()
    json.name = name
    json.id = `layer:${layerUUID}`

    // re-write feature array as associative array:
    json.features = json.features.reduce((acc, feature) => {
      feature.id = `feature:${layerUUID}/${uuid()}`
      acc[feature.id] = feature
      return acc
    }, {})

    return json
  }

  reader.onload = (({ target }) => {
    if (target.error) reject(target.error)
    else resolve(rewrite(filename(file), JSON.parse(target.result)))
  })
  reader.readAsText(file)
})

export const load = async files => {
  const json = await Promise.all(files.map(importFile))
  json.reduce((acc, layer) => K(acc)(acc => acc[layer.id] = layer), layers)
  window.dispatchEvent(new CustomEvent('model.changed'))
}

export const identity = sidc => sidc[1] === 'F' ? ['OWN'] : sidc[1] === 'H' ? ['ENEMY'] : []
