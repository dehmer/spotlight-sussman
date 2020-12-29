import ms from 'milsymbol'
import json from './symbols.json'
import { normalize } from './sidc'
import { storage } from '../storage'

const id = descriptor => `symbol:${descriptor.sidc.substring(0, 10)}`

// Populate storage with symbols if missing:
if (!storage.keys().some(key => key.startsWith('symbol:'))) {
  json.forEach(symbol => {
    symbol.id = id(symbol)
    storage.setItem(symbol)
  })
}

export const hierarchy = sidc => {
  const descriptor = storage.getItem(`symbol:${normalize(sidc)}`)
  return descriptor ? descriptor.hierarchy : ['N/A']
}

// -> lunr documents interface

export const document = id => {
  const tags = ({ dimension, scope, tags }) => [
    ...dimension ? dimension.split(', ') : [],
    ...scope ? scope.split(', ') : [],
    ...(tags || [])
  ]

  const symbol = storage.getItem(id)

  return ({
    id: symbol.id,
    scope: 'symbol',
    text: symbol.hierarchy.join(' '),
    tags: tags(symbol)
  })
}

// <- lunr documents interface


// -> Symbol URL and cache

const placeholderSymbol = new ms.Symbol('')

const cache = {
  _: placeholderSymbol.asCanvas().toDataURL()
}

export const url = sidc => {
  if (!cache[sidc]) {
    const symbol = new ms.Symbol(sidc)
    if (!symbol.isValid()) return cache._
    cache[sidc] = symbol.asCanvas().toDataURL()
  }

  return cache[sidc]
}

// <- Symbol URL and cache
