import * as R from 'ramda'
import ms from 'milsymbol'
import json from './symbols.json'
import { normalize } from './sidc'
import evented from '../evented'

const id = descriptor => `symbol:${descriptor.sidc.substring(0, 10)}`

export const symbols = json.reduce((acc, descriptor) => R.tap(acc => {
  descriptor.id = id(descriptor)
  acc[descriptor.id] = descriptor
}, acc), {})

export const hierarchy = sidc => {
  const descriptor = symbols[`symbol:${normalize(sidc)}`]
  return descriptor ? descriptor.hierarchy : ['N/A']
}

// -> lunr documents interface

export const lunr = (() => {
  const tags = ({ dimension, scope, tags }) => [
    ...dimension ? dimension.split(', ') : [],
    ...scope ? scope.split(', ') : [],
    ...(tags || [])
  ]

  const document = symbol => ({
    id: symbol.id,
    scope: 'symbol',
    text: symbol.hierarchy.join(' '),
    tags: tags(symbol)
  })

  return () => Object.values(symbols).map(document)
})()

// <- lunr documents interface

// -> Spotlight interface

export const option = (() => {
  const replace = (s, i, r) => s.substring(0, i) + r + s.substring(i + r.length)

  const tags = symbol => {
    const dimension = symbol.dimension
      ? symbol.dimension.split(', ').map(label => ({ type: 'SYSTEM', label }))
      : []

    return [
      { type: 'SCOPE', label: 'SYMBOL' },
      ...dimension,
      { type: 'SYSTEM', label: symbol.scope },
      ...(symbol.tags || []).map(label => ({ type: 'USER', label }))
    ]
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

  return id => option(symbols[id])
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

// -> command interface

evented.on(event => {
  const [type, command] = event.type.split('.')
  if (type !== 'command') return
  if (!event.id.startsWith('symbol:')) return

  const handlers = {
    'add-tag': ({ id, tag }) => symbols[id].tags = R.uniq([...(symbols[id].tags || []), tag]),
    'remove-tag': ({ id, tag }) => symbols[id].tags = symbols[id].tags.filter(x => x !== tag)
  }

  if (handlers[command]) {
    handlers[command](event)
    evented.emit({ type: 'model.changed' })
  }
})

// <- command interface
