import lunr from 'lunr'
import { documents as symbolDocuments, entry as symbolEntry } from './feature-descriptor'
import { documents as layerDocuments, entry as layerEntry } from './layer'

export var index

const reindex = () => {
  index = lunr(function () {
    this.pipeline.remove(lunr.stemmer)
    this.searchPipeline.remove(lunr.stemmer)
    this.field('text')
    this.field('scope')
    this.field('tags')

    const add = this.add.bind(this)
    symbolDocuments().forEach(add)
    layerDocuments().forEach(add)
  })
}

reindex()

const entryMapper = {
  symbol: symbolEntry,
  layer: layerEntry,
  feature: layerEntry
}

export const entry = ref => {
  const [scope] = ref.split(':')
  return entryMapper[scope](ref)
}

window.addEventListener('model.changed', reindex)