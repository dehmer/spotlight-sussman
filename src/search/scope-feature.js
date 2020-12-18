import React from 'react'
import { url } from '../model/symbol'
import { layers, identity } from '../model/layer'
import { dispatchProvider } from './scope-common'
import { Card } from '../components/Card'

const card = key => {
  const layer = layers[`layer:${key.split(':')[1].split('/')[0]}`]
  const { properties } = layer.features[key]

  const props = {
    key,
    title: properties.t || 'N/A',
    scope: 'FEATURE',
    url: url(properties.sidc),
    tags: [
      {
        text: layer.name.toUpperCase(),
        command: dispatchProvider(featureList(layer.id))
      },
      ...identity(properties.sidc).map(text => ({ text }))
    ]
  }

  return <Card {...props}/>
}

const featureList = id => filter => {
  const title = feature => feature.props.title
  const match = feature => title(feature).toLowerCase().includes(filter.toLowerCase())
  const compare = (a, b) => title(a).localeCompare(title(b), {numeric: true, sensitivity: 'base'})

  return Object
    .keys(layers[id].features)
    .map(card)
    .filter(match)
    .sort(compare)
}

export default { card, featureList }
