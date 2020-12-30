import * as R from 'ramda'
import lunr from 'lunr'
import evented from '../evented'
import { storage } from '../storage'
import { options } from '../model/options'
import { documents } from '../model/documents'
import { compare } from './compare'

/**
 * Adapt domain models to indexable documents and
 * document refs to spotlight (view) model objects.
 */

var index

;(() => {
  const nullScope = () => null
  const scope = key => documents[key.split(':')[0]] || nullScope

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
        .map(key => scope(key)(key))
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

export const searchIndex = R.tryCatch(
  terms => terms.trim() ? index.search(terms.trim()) : [],
  R.always([])
)

const option = ref => options[ref.split(':')[0]](ref)
const limit = R.take(200)
// const limit = R.identity /* no limits */

// Sort group to the top and only sort groups by title:
const isGroup = id => id.startsWith('group:')
const sort = entries => entries.sort((a, b) => {
  const GA = isGroup(a.id)
  const GB = isGroup(b.id)
  if (!GA && !GB) return 0 // chromium sort is/should be stable
  else if (GA && !GB) return -1
  else if (!GA && GB) return 1
  else return compare(R.prop('title'))(a, b)
})

const refs = R.map(({ ref }) => option(ref))

// Default search provider:
export const search = terms => {
  evented.emit({ type: 'search.current', terms })
  return R.compose(limit, sort, refs, searchIndex)(terms)
}

export const scopedSearch = scope => scope
  ? filter => search(`+scope:${scope} ${filter}`)
  : search
