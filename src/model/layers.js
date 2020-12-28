import evented from '../evented'
import { storage } from '../storage'


// -> lunr documents interface

export const document = id => {
  const { name: text, hidden, tags } = storage.getItem(id)
  return {
    id,
    scope: 'layer',
    text,
    tags: [hidden ? 'hidden' : 'visible', ...(tags || [])]
  }
}

// <- lunr documents interface

// -> Spotlight interface

export const option = (() => {

  const tags = layer => {
    const changeVisibility = () => evented.emit({
      type: `command.storage.${layer.hidden ? 'show' : 'hide'}`,
      ids: [layer.id]
    })

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

  return id => option(storage.getItem(id))
})()

// <- Spotlight interface
