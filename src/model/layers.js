import * as R from 'ramda'
import { layerId } from './ids'
import { preloadLayerFiles } from './io'
import { pushFeatures } from './features'
import evented from '../evented'
import selection from '../selection'

const layers = {}

export const pushLayers = xs => {
  xs.reduce((acc, layer) => R.tap(acc => {
    layer.id = layerId()
    acc[layer.id] = layer
    layer.features.forEach(feature => feature.layer = () => layers[layer.id])
    pushFeatures(layer.features)
    delete layer.features
    delete layer.type
  }, acc), layers)

  evented.emit({ type: 'model.changed' })
}

pushLayers(preloadLayerFiles())

// -> lunr documents interface

export const lunr = (() => {
  const document = ({ id, name: text, hidden, tags }) => ({
    id,
    scope: 'layer',
    text,
    tags: [hidden ? 'hidden' : 'visible', ...(tags || [])]
  })

  return () => Object.values(layers).map(document)
})()

// <- lunr documents interface

// -> Spotlight interface

export const option = (() => {

  const tags = layer => {
    const changeVisibility = () => {
      const type = layer.hidden ? 'command.show' : 'command.hide'
      evented.emit({ type, id: layer.id })
    }

    const scope = { type: 'SCOPE', label: 'LAYER' }
    const visibility = layer.hidden
      ? { type: 'SYSTEM', label: 'HIDDEN', action: changeVisibility }
      : { type: 'SYSTEM', label: 'VISIBLE', action: changeVisibility }
    const user = (layer.tags || []).map(label => ({ type: 'USER', label }))
    return [scope, visibility, ...user]
  }

  const option = layer => ({
    id: layer.id,
    title: layer.name,
    tags: tags(layer),
    capabilities: ['RENAME']
  })

  return id => option(layers[id])
})()

// <- Spotlight interface

// -> command interface

evented.on(event => {
  const [type, command] = event.type.split('.')
  if (type !== 'command') return
  if (!event.id) return
  if (!event.id.startsWith('layer:')) return

  const selected = id => [id, ...selection.selected(x => x.startsWith('layer:'))]
  const forSelected = (id, fn) => R.uniq(selected(id)).forEach(fn)

  const addtag = tag => id => layers[id].tags = R.uniq([...(layers[id].tags || []), tag])
  const removetag = tag => id => layers[id].tags = layers[id].tags.filter(x => x !== tag)

  const handlers = {
    'update-name': ({ id, name }) => layers[id].name = name,
    'add-tag': ({ id, tag }) => forSelected(id, addtag(tag)),
    'remove-tag': ({ id, tag }) => forSelected(id, removetag(tag)),
    'hide': ({ id }) => layers[id].hidden = true,
    'show': ({ id }) => delete layers[id].hidden
  }

  if (handlers[command]) {
    handlers[command](event)
    evented.emit({ type: 'model.changed' })
  }
})

// <- command interface
