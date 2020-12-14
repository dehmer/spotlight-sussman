import lunr from 'lunr'
import descriptors from './feature-descriptors.json'
import { document } from './feature-descriptor'

const descriptorIndex = {}
descriptors.forEach(descriptor => descriptorIndex[descriptor.sidc] = descriptor)

export const index = lunr(function () {
  this.pipeline.remove(lunr.stemmer)
  this.searchPipeline.remove(lunr.stemmer)
  this.metadataWhitelist = ['position']

  this.ref('sidc')
  this.field('text')
  this.field('tag')

  descriptors
    .map(document)
    .forEach(document => this.add(document))
})
