import * as R from 'ramda'
import lunr from 'lunr'
import evented from '../evented'
import * as layers from '../model/layers'
import * as features from '../model/features'
import * as symbols from '../model/symbols'
import * as groups from '../model/groups'
import { storage } from '../storage'
import { options } from '../model/options'

/**
 * Adapt domain models to indexable documents and
 * document refs to spotlight (view) model objects.
 */

const scopes = {
  symbol: symbols,
  layer: layers,
  feature: features,
  group: groups
}

var index

;(() => {
  const nullScope = { document: () => null}
  const scope = key => scopes[key.split(':')[0]] || nullScope

  const reindex = () => {
    console.time('[lunr] re-index')
    index = lunr(function () {
      this.pipeline.remove(lunr.stemmer)
      this.pipeline.remove(lunr.stopWordFilter) // allow word like 'so', 'own', etc.
      this.searchPipeline.remove(lunr.stemmer)
      this.field('text')
      this.field('scope')
      this.field('tags')

      storage.keys()
        .map(key => scope(key).document(key))
        .filter(R.identity)
        .forEach(document => this.add(document))
    })

    console.timeEnd('[lunr] re-index')
    evented.emit({ type: 'search-index.refreshed' })
  }

  reindex()

  evented.on(event => {
    if (event.type === 'model.changed') reindex()
  })
})()

export const search = R.tryCatch(
  terms => terms.trim() ? index.search(terms.trim()) : [],
  R.always([])
)

const option = ref => options[ref.split(':')[0]](ref)
// const limit = R.identity /* no limits */
// const sort = entries => entries.sort(compare(R.prop('title')))
const limit = R.take(200)
const sort = entries => entries
const refs = R.map(({ ref }) => option(ref))

// Default search provider:
export const searchIndex = terms => {
  evented.emit({ type: 'search.current', terms })
  return R.compose(sort, refs, limit, search)(terms)
}

export const searchProvider = prefix => prefix
  ? filter => searchIndex(`${prefix} ${filter}`)
  : searchIndex
