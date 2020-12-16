import * as R from 'ramda'
import lunr from 'lunr'
import { symbols } from '../model/feature-descriptor'
import { layers, identity } from '../model/layer'
import { url } from '../model/symbol'

var index

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

    const tags = [
      ...dimension,
      descriptor.scope
    ].filter(R.identity)

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
      tags: []
    }
  }
}

domains.feature = {
  model: ref => {
    const layer = layers[`layer:${ref.split(':')[1].split('/')[0]}`]
    const { properties } = layer.features[ref]
    return {
      key: ref,
      title: properties.t || 'N/A',
      scope: 'FEATURE',
      tags: [layer.name.toUpperCase(),  ...identity(properties.sidc)],
      url: () => url(properties.sidc)
    }
  }
}

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

const model = ref => domains[ref.split(':')[0]].model(ref)

window.addEventListener('model.changed', reindex)

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

const limit = R.identity /* no limits */
const refs = R.map(({ ref }) => model(ref))
export default R.compose(refs, limit, search, terms)
