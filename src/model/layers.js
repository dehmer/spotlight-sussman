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
