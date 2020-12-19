import * as R from 'ramda'
import lunr from 'lunr'
import evented from '../evented'
import symbol from './scope-symbol'
import { layer, feature } from './scope-layer'

console.log(layer)
console.log(feature)


/**
 * Adapt domain models to indexable documents and
 * document refs to spotlight (view) model objects.
 */

const scopes = {
  symbol: symbol,
  layer: layer,
  feature: feature
}

var index

;(() => {
  const reindex = () => {
    index = lunr(function () {
      const add = this.add.bind(this)
      this.pipeline.remove(lunr.stemmer)
      this.pipeline.remove(lunr.stopWordFilter) // allow word like 'so', 'own', etc.
      this.searchPipeline.remove(lunr.stemmer)
      this.field('text')
      this.field('scope')
      this.field('tags')

      Object.values(scopes)
        .filter(scope => scope.documents)
        .flatMap(({ documents }) => documents())
        .forEach(add)
    })
  }

  reindex()

  evented.on(event => {
    if (event.type === 'model.changed') reindex()
  })
})()

const tag = s => s.length < 2 ? '' : `+tags:${s.substring(1)}`
const scope = s => (s.length < 2) ? '' : `+scope:${s.substring(1)}`

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

const search = R.tryCatch(
  terms => terms.trim() ? index.search(terms.trim()) : [],
  R.always([])
)

// TODO: return </Card>
const option = ref => scopes[ref.split(':')[0]].option(ref)
// const limit = R.identity /* no limits */
const limit = R.take(150)
const refs = R.map(({ ref }) => option(ref))
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
