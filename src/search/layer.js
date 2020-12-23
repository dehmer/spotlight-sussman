import * as R from 'ramda'
import { url } from '../model/symbol'
import { layers, identity, isLayer, isFeature } from '../model/layer'
import { dispatchProvider, compare } from './common'
import evented from '../evented'
import { hierarchy } from '../model/feature-descriptor'
import selection from '../selection'

const selectedLayers = () => selection.selected(isLayer)
const selectedFeatures = () => selection.selected(isFeature)
const selected = id => R.uniq(selectedLayers().concat(selectedFeatures()).concat(id))

const commands = {
  hide: key => () => evented.emit({ type: 'command.layer.hide', ids: selected(key) }),
  show: key => () => evented.emit({ type: 'command.layer.show', ids: selected(key) })
}

const layer = {
  documents: () => {
    return Object.entries(layers).reduce((acc, [id, layer]) => {
      acc.push({
        id,
        scope: 'layer',
        text: layer.name,
        tags: [layer.hidden ? 'hidden' : 'visible']
      })
      return Object.entries(layer.features).reduce((acc, [id, feature]) => {
        const { t, sidc } = feature.properties
        acc.push({
          id,
          scope: 'feature',
          tags: [
            ...identity(feature.properties.sidc),
            feature.hidden ? 'hidden' : 'visible'
          ],
          text: `${t} ${hierarchy(sidc).join(' ')} ${layer.name}`
        })
        return acc
      }, acc)
    }, [])
  },

  option: key => {
    const layer = layers[key]
    const visibility = layer.hidden
      ? {
          type: 'SYSTEM',
          label: 'HIDDEN',
          action: commands.show(key)
        }
      : {
          type: 'SYSTEM',
          label: 'VISIBLE',
          action: commands.hide(key)
        }

    return {
      key: key,
      title: layer.name,
      tags: [
        {
          type: 'SCOPE',
          label: 'LAYER'
        },
        visibility
      ],
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
    const layerId = `layer:${key.split(':')[1].split('/')[0]}`
    const layer = layers[layerId]
    const feature = layer.features[key]
    const properties = feature.properties
    const { sidc, t } = properties

    const visibility = feature.hidden
      ? {
          type: 'SYSTEM',
          label: 'HIDDEN',
          action: commands.show(key)
        }
      : {
          type: 'SYSTEM',
          label: 'VISIBLE',
          action: commands.hide(key)
        }

    return {
      key,
      title: t || 'N/A',
      description: layer.name.toUpperCase() + ' ⏤ ' + hierarchy(sidc).join(' • '),
      url: url(sidc),
      tags: [
        {
          type: 'SCOPE',
          label: 'FEATURE'
        },
        ...identity(sidc).map(label => ({ type: 'SYSTEM', label })),
        visibility
      ],
      actions: {
        back: () => evented.emit({ type: 'search-scope.changed', scope: 'layer' }),
        rename: title => evented.emit({
          type: 'command.layer.update',
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
