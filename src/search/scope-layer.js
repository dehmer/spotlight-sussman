import * as R from 'ramda'
import { url } from '../model/symbol'
import { layers, identity } from '../model/layer'
import { dispatchProvider, compare } from './scope-common'
import evented from '../evented'
import { hierarchy } from '../model/feature-descriptor'

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

    return {
      key: key,
      title: layer.name,
      scope: 'LAYER',
      tags: [],
      actions: {
        open: dispatchProvider(featureList(layer.id)),
        rename: title => evented.emit({
          type: 'command.layer.update',
          id: key,
          properties: { name: title }
        })
      }
    }
  }
}

const feature = {
  option: key => {
    const layer = layers[`layer:${key.split(':')[1].split('/')[0]}`]
    const properties = layer.features[key].properties
    const { sidc, t } = properties

    return {
      key,
      title: t || 'N/A',
      description: layer.name.toUpperCase() + ' ⏤ ' + hierarchy(sidc).join(' • '),
      scope: 'FEATURE',
      url: url(sidc),
      tags: identity(sidc),
      actions: {
        back: () => evented.emit({ type: 'search-scope.changed', scope: 'layer' }),
        rename: title => evented.emit({
          type: 'command.feature.update',
          id: key,
          properties: { ...properties, t: title }
        })
      }
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
