import React from 'react'
import { layers, identity } from '../model/layer'
import { dispatchProvider } from './scope-common'
import feature from './scope-feature'
import { Card } from '../components/Card'

const documents = () => {
  return Object.entries(layers).reduce((acc, [id, layer]) => {
    acc.push({ id, scope: 'layer', text:  layer.name })
    return Object.entries(layer.features).reduce((acc, [id, feature]) => {
      acc.push({
        id,
        scope: 'feature',
        tags: [layer.name, ...identity(feature.properties.sidc)],
        text: feature.properties.t
      })
      return acc
    }, acc)
  }, [])
}

const card = key => {
  const layer = layers[key]
  const props = {
    key: key,
    title: layer.name,
    scope: 'LAYER',
    tags: [],
    primaryAction: dispatchProvider(feature.featureList(layer.id))
  }

  return <Card {...props}/>
}

export default { documents, card }
