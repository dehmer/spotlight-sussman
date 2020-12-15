import lunr from 'lunr'
import { documents as symbolDocuments, entry as symbolEntry } from './feature-descriptor'
import { documents as layerDocuments, entry as layerEntry } from './layer'

export var index

const reindex = () => {
  index = lunr(function () {
    console.time('[lunr]')
    this.pipeline.remove(lunr.stemmer)
    this.searchPipeline.remove(lunr.stemmer)
    this.metadataWhitelist = ['position']

    // this.ref('id')
    this.field('text')
    this.field('scope')
    this.field('tag')

    symbolDocuments().forEach(document => this.add(document))
    layerDocuments().forEach(document => this.add(document))

    console.log(Object.entries(layerDocuments))
    console.timeEnd('[lunr]')
  })
}

reindex()

const entryMapper = {
  symbol: symbolEntry,
  layer: layerEntry
}

export const entry = ref => {
  const [scope] = ref.split(':')
  return entryMapper[scope](ref)
}

window.addEventListener('model.changed', reindex)