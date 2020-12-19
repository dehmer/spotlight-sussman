import * as R from 'ramda'
import { url } from '../model/symbol'
import { layers, identity } from '../model/layer'
import { dispatchProvider, compare } from './scope-common'
import evented from '../evented'

const layer = {
  documents: () => {
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
  },

  option: key => {
    const layer = layers[key]

    const actions = {
      open: dispatchProvider(featureList(layer.id))
    }

    return {
      key: key,
      title: layer.name,
      scope: 'LAYER',
      tags: [],
      actions
    }
  }
}

const feature = {
  option: key => {
    const layer = layers[`layer:${key.split(':')[1].split('/')[0]}`]
    const { properties } = layer.features[key]

    const actions = {
      back: () => evented.emit({ type: 'search-scope.changed', scope: 'layer' })
    }

    return {
      key,
      title: properties.t || 'N/A',
      description: layer.name.toUpperCase(),
      scope: 'FEATURE',
      url: url(properties.sidc),
      tags: identity(properties.sidc),
      actions
    }
  }
}

export {
  layer,
  feature
}

export const featureList = id => filter => {
  const title = feature => feature.title
  const match = feature => title(feature).toLowerCase().includes(filter.toLowerCase())

  return Object
    .keys(layers[id].features)
    .map(feature.option)
    .filter(match)
    .sort(compare(R.prop('title')))
}
