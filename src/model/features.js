import * as R from 'ramda'
import { hierarchy, url } from './symbols'
import { layerId } from '../storage/ids'
import { storage } from '../storage'

const identity = sidc => R.cond([
  [R.equals('F'), R.always(['OWN'])],
  [R.equals('H'), R.always(['ENY'])],
  [R.equals('U'), R.always(['UKN'])],
  [R.T, R.always([])]
])(sidc[1])

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

// <- lunr documents interface

// -> Spotlight interface

export const option = (() => {

  const tags = ({ hidden, tags }, sidc) => [
    'SCOPE:FEATURE:NONE',
    `SYSTEM:${hidden ? 'HIDDEN' : 'VISIBLE'}:CLICK`,
    ...(identity(sidc)).map(label => `SYSTEM:${label}:NONE`),
    ...(tags || []).map(label => `USER:${label}:NONE`)
  ].join(' ')

  const option = feature => {
    const layer = storage.getItem(layerId(feature.id))
    const { properties } = feature
    const { sidc, t } = properties
    const description = layer.name.toUpperCase() + ' ⏤ ' + hierarchy(sidc).join(' • ')

    return {
      id: feature.id,
      title: t || 'N/A',
      description,
      url: url(sidc),
      tags: tags(feature, sidc),
      capabilities: 'RENAME'
    }
  }

  return id => option(storage.getItem(id))
})()

// <- Spotlight interface
