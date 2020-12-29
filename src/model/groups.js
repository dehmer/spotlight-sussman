import { storage } from '../storage'

// -> lunr documents interface

export const document = id => {
  const group = storage.getItem(id)

  return {
    id: group.id,
    text: group.name,
    scope: [...(group.scope || []), 'group'],
    tags: group.tags
  }
}

// <- lunr documents interface
