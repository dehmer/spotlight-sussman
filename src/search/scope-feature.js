import { url } from '../model/symbol'
import { layers, identity } from '../model/layer'
import { dispatchProvider } from './scope-common'

const option = key => {
  const layer = layers[`layer:${key.split(':')[1].split('/')[0]}`]
  const { properties } = layer.features[key]

  return {
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
}

const featureList = id => filter => {
  const title = feature => feature.title
  const match = feature => title(feature).toLowerCase().includes(filter.toLowerCase())
  const compare = (a, b) => title(a).localeCompare(title(b), {numeric: true, sensitivity: 'base'})

  return Object
    .keys(layers[id].features)
    .map(option)
    .filter(match)
    .sort(compare)
}

export default { option, featureList }
