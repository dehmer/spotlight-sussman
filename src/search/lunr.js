import * as R from 'ramda'
import lunr from 'lunr'
import evented from '../evented'
import { compare } from './common'
import symbol from './symbol'
import { layer, feature } from './layer'

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
    console.time('[lunr] re-index')
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

    console.timeEnd('[lunr] re-index')
    evented.emit({ type: 'search-index.refreshed' })
  }

  reindex()

  evented.on(event => {
    if (event.type === 'model.changed') reindex()
  })
})()

const tag = s => s.length < 2 ? '' : `+tags:${s.substring(1)}*`
const scope = s => (s.length < 2) ? '' : `+scope:${s.substring(1)}`

const term = R.cond([
  [R.startsWith('#'), tag],
  [R.startsWith('@'), scope],
  [R.identity, s => `+text:${s}*`],
  [R.T, R.always('')]
])

const terms = value => {
  if (value.startsWith(':')) return value.substring(1)
  else return (value || '')
    .split(' ')
    .filter(R.identity)
    .map(term)
    .join(' ')
}

const search = R.tryCatch(
  terms => terms.trim() ? index.search(terms.trim()) : [],
  R.always([])
)

const option = ref => scopes[ref.split(':')[0]].option(ref)
// const limit = R.identity /* no limits */
const limit = R.take(150)
const sort = entries => entries.sort(compare(R.prop('title')))

const refs = R.map(({ ref }) => option(ref))
export const searchIndex = R.compose(sort, refs, limit, search, terms)

const handlers = {
  'search-scope.changed': ({ scope }) => evented.emit({
    type: 'search-provider.changed',
    provider: scope
      ? filter => searchIndex(`@${scope} ${filter}`)
      : searchIndex
  })
}

evented.on(event => (handlers[event.type] || R.always({}))(event))
