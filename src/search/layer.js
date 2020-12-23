import * as R from 'ramda'
import { url } from '../model/symbol'
import { layers, identity } from '../model/layer'
import { dispatchProvider, compare } from './common'
import evented from '../evented'
import { hierarchy } from '../model/feature-descriptor'
import selection from '../selection'

const layer = {
  documents: () => {
    return Object.entries(layers).reduce((acc, [id, layer]) => {
      const visibility = layer.hidden ? 'hidden' : 'visible'
      acc.push({
        id,
        scope: 'layer',
        text: layer.name,
        tags: [visibility]
      })
      return Object.entries(layer.features).reduce((acc, [id, feature]) => {
        const { t, sidc } = feature.properties
        acc.push({
          id,
          scope: 'feature',
          tags: [...identity(feature.properties.sidc), visibility],
          text: `${t} ${hierarchy(sidc).join(' ')} ${layer.name}`
        })
        return acc
      }, acc)
    }, [])
  },

  option: key => {
    const layer = layers[key]

    const selected = () => {
      const ids = selection.selected(s => s.startsWith('layer:'))
      return ids.length ? ids : [key]
    }

    const visibility = layer.hidden
      ? {
          type: 'SYSTEM',
          label: 'HIDDEN',
          action: () => {
            evented.emit({ type: 'command.layer.show', ids: selected() })
          }
        }
      : {
          type: 'SYSTEM',
          label: 'VISIBLE',
          action: () => {
            evented.emit({ type: 'command.layer.hide', ids: selected() })
          }
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
    const properties = layer.features[key].properties
    const { sidc, t } = properties

    const selected = () => {
      const ids = selection
        .selected(s => s.startsWith('feature:'))
        .map(id => `layer:${id.split(':')[1].split('/')[0]}`)

      return ids.length ? R.uniq(ids) : [layerId]
    }

    const visibility = layer.hidden
      ? {
          type: 'SYSTEM',
          label: 'HIDDEN',
          action: () => {
            evented.emit({ type: 'command.layer.show', ids: selected() })
          }
        }
      : {
          type: 'SYSTEM',
          label: 'VISIBLE',
          action: () => {
            evented.emit({ type: 'command.layer.hide', ids: selected() })
          }
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
