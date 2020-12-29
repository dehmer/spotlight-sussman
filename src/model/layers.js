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

  const tags = ({ hidden, tags }) => [
    'SCOPE:LAYER:NONE',
    `SYSTEM:${hidden ? 'HIDDEN' : 'VISIBLE'}:CLICK`,
    ...(tags || []).map(label => `USER:${label}:NONE`)
  ].join(' ')

  const option = layer => ({
    id: layer.id,
    title: layer.name,
    tags: tags(layer),
    capabilities: 'RENAME'
  })

  return id => option(storage.getItem(id))
})()

// <- Spotlight interface
