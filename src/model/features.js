import { hierarchy } from './symbols'
import { layerId } from '../storage/ids'
import { storage } from '../storage'
import { identity } from './sidc'

// -> lunr documents interface

export const document = id => {
  const feature = storage.getItem(id)
  const layer = storage.getItem(layerId(id))
  const { t, sidc } = feature.properties

  const tags = ({ hidden, tags }) => [
    hidden ? 'hidden' : 'visible',
    ...(tags || []),
    ...identity(sidc)
  ]

  return {
    id,
    scope: 'feature',
    tags: tags(feature),
    text: `${t} ${hierarchy(sidc).join(' ')} ${layer.name}`
  }
}

// <- Spotlight interface
