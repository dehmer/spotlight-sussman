import * as R from 'ramda'
import lunr from 'lunr'
import { symbols } from '../model/feature-descriptor'
import { layers, identity } from '../model/layer'
import { url } from '../model/symbol'
import evented from '../evented'

const dispatchProvider = provider => () => {
  evented.emit({ type: 'search-provider.changed', provider })
}

const featureList = id => filter => Object
  .keys(layers[id].features)
  .map(domains.feature.model)
  .filter(feature => feature.title.toLowerCase().includes(filter.toLowerCase()))
  .sort((a, b) => a.title.localeCompare(b.title, {numeric: true, sensitivity: 'base'}))

const domains = {}

/**
 * Adapt domain models to indexable documents and
 * document refs to spotlight (view) model objects.
 */
domains.symbol = {
  documents: () => {
    const document = symbol => ({
      id: symbol.id,
      scope: 'symbol',
      text: symbol.hierarchy.join(' '),
      tags: [
        ...symbol.dimension ? symbol.dimension.split(', ') : [],
        ...symbol.scope ? symbol.scope.split(', ') : []
      ].flat().join(' ')
    })

    return Object.values(symbols).map(document)
  },
  model: ref => {
    const replace = (s, i, r) => s.substring(0, i) + r + s.substring(i + r.length)
    const descriptor = symbols[ref]
    const title = R.last(descriptor.hierarchy)
    const description = R.dropLast(1, descriptor.hierarchy).join(' • ')
    const dimension = descriptor.dimension ? descriptor.dimension.split(', ') : []

    const tags = [...dimension, descriptor.scope]
      .filter(R.identity)
      .map(text => ({ text }))

    return {
      key: ref,
      title,
      description,
      scope: 'SYMBOL',
      tags,
      url: () => url(replace(replace(descriptor.sidc, 1, 'F'), 3, 'P'))
    }
  }
}

domains.layer = {
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
  model: ref => {
    const layer = layers[ref]
    return {
      key: ref,
      title: layer.name,
      scope: 'LAYER',
      tags: [],
      primaryAction: dispatchProvider(featureList(layer.id))
    }
  }
}

domains.feature = {
  model: ref => {
    const layer = layers[`layer:${ref.split(':')[1].split('/')[0]}`]
    const { properties } = layer.features[ref]
    const tags = [
      {
        text: layer.name.toUpperCase(),
        command: dispatchProvider(featureList(layer.id))
      },
      ...identity(properties.sidc).map(text => ({ text }))
    ]

    return {
      key: ref,
      title: properties.t || 'N/A',
      scope: 'FEATURE',
      tags,
      url: () => url(properties.sidc)
    }
  }
}

var index

const reindex = () => {
  index = lunr(function () {
    this.pipeline.remove(lunr.stemmer)
    this.pipeline.remove(lunr.stopWordFilter) // allow word like 'so', 'own', etc.
    this.searchPipeline.remove(lunr.stemmer)
    this.field('text')
    this.field('scope')
    this.field('tags')

    const add = this.add.bind(this)
    Object.values(domains)
      .filter(domain => domain.documents)
      .flatMap(({ documents }) => documents())
      .forEach(add)
  })
}

reindex()
evented.on(event => {
  if (event.type !== 'model.changed') return
  reindex()
})

const tag = s => {
  if (s.length < 2) return ''
  return `+tags:${s.substring(1)}`
}

const scope = s => {
  if (s.length < 2) return ''
  return `+scope:${s.substring(1)}`
}

const term = R.cond([
  [R.startsWith('#'), tag],
  [R.startsWith('@'), scope],
  [R.identity, s => `+text:${s}*`],
  [R.T, R.always('')]
])

const terms = value =>
  (value || '')
    .split(' ')
    .filter(R.identity)
    .map(term)
    .join(' ')

const search = R.tryCatch(terms => {
  if (!terms.trim()) return []
  else return index.search(terms.trim())
}, R.always([]))

// TODO: return </Card>
const model = ref => domains[ref.split(':')[0]].model(ref)
// const limit = R.identity /* no limits */
const limit = R.take(150)
const refs = R.map(({ ref }) => model(ref))
export const searchIndex = R.compose(refs, limit, search, terms)

const handlers = {
  'search-scope.changed': ({ scope }) => evented.emit({
    type: 'search-provider.changed',
    provider: scope
      ? filter => searchIndex(`@${scope} ${filter}`)
      : searchIndex
  })
}

evented.on(event => (handlers[event.type] || R.always({}))(event))
