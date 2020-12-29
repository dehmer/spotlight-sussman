import * as R from 'ramda'
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

// -> Spotlight interface

export const option = (() => {
  const replace = (s, i, r) => s.substring(0, i) + r + s.substring(i + r.length)

  const tags = symbol => {
    const dimension = symbol.dimension
      ? symbol.dimension.split(', ').map(label => `SYSTEM:${label}:NONE`)
      : []

    const scope = symbol.scope
      ? [`SYSTEM:${symbol.scope}:NONE`]
      : []

    return [
      'SCOPE:SYMBOL:NONE',
      ...dimension,
      ...scope,
      ...(symbol.tags || []).map(label => `USER:${label}:NONE`)
    ].join(' ')
  }

  const option = symbol => {
    return {
      id: symbol.id,
      title: R.last(symbol.hierarchy),
      description: R.dropLast(1, symbol.hierarchy).join(' • '),
      url: url(replace(replace(symbol.sidc, 1, 'F'), 3, 'P')),
      scope: 'SYMBOL',
      tags: tags(symbol)
    }
  }

  return id => option(storage.getItem(id))
})()

// <- Spotlight interface

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
