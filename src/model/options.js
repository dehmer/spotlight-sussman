import * as R from 'ramda'
import { storage } from '../storage'
import { hierarchy, url, dimensions, scopes } from './symbols'
import { searchIndex } from '../search/lunr'
import { layerId } from '../storage/ids'
import { identity } from './sidc'

export const options = {}

// -> Spotlight interface.

/**
 * feature:/
 */
options.feature = (() => {

  const tags = ({ hidden, tags }, sidc) => [
    'SCOPE:FEATURE:action.identify',
    `IMAGE:BACK:action:mdiArrowUp`,
    `SYSTEM:${hidden ? 'HIDDEN' : 'VISIBLE'}:command.storage`,
    ...dimensions(sidc).map(label => `SYSTEM:${label}:NONE`),
    ...scopes(sidc).map(label => `SYSTEM:${label}:NONE`),
    ...(identity(sidc)).map(label => `SYSTEM:${label}:NONE`),
    ...(tags || []).map(label => `USER:${label}:NONE`)
  ].join(' ')

  const option = feature => {
    const layer = storage.getItem(layerId(feature.id))
    const { properties } = feature
    const { sidc, t } = properties
    const description = layer.name.toUpperCase() + ' ⏤ ' + hierarchy(sidc).join(' • ')

    return {
      id: feature.id,
      title: t || 'N/A',
      description,
      url: url(sidc),
      tags: tags(feature, sidc),
      capabilities: 'RENAME|TAG',
      actions: 'PRIMARY:action.panto'
    }
  }

  return id => option(storage.getItem(id))
})()


/**
 * group:/
 */
options.group = (() => {
  const option = group => {

    const items = searchIndex(group.terms)
      .filter(({ ref }) => !ref.startsWith('group:'))
      .map(({ ref }) => options[ref.split(':')[0]](ref))

    const tags = R.uniq(items.flatMap(item => item.tags.split(' ')))
      .filter(tag => tag.match(/SYSTEM:.*:command\.storage/))

    return {
      id: group.id,
      title: group.name,
      tags: [
        'GROUP:GROUP:action.identify',
        ...(group.scope || []).map(label => `SCOPE:${label}:NONE`),
        `IMAGE:OPEN:action:mdiArrowDown`,
        ...tags,
        ...(group.tags || []).map(label => `USER:${label}:NONE`)
      ].join(' '),
      capabilities: 'RENAME'
    }
  }

  return id => option(storage.getItem(id))
})()


/**
 * layer:/
 */
options.layer = (() => {

  const tags = ({ hidden, tags }) => [
    'SCOPE:LAYER:action.identify',
    `IMAGE:OPEN:action:mdiArrowDown`,
    `SYSTEM:${hidden ? 'HIDDEN' : 'VISIBLE'}:command.storage`,
    ...(tags || []).map(label => `USER:${label}:NONE`)
  ].join(' ')

  const option = layer => ({
    id: layer.id,
    title: layer.name,
    tags: tags(layer),
    capabilities: 'RENAME|TAG'
  })

  return id => option(storage.getItem(id))
})()


/**
 * symbol:/
 */
options.symbol = (() => {
  const replace = (s, i, r) => s.substring(0, i) + r + s.substring(i + r.length)

  const tags = ({ sidc, tags }) => [
    'SCOPE:SYMBOL:NONE',
    ...dimensions(sidc).map(label => `SYSTEM:${label}:NONE`),
    ...scopes(sidc).map(label => `SYSTEM:${label}:NONE`),
    ...(tags || []).map(label => `USER:${label}:NONE`)
  ].join(' ')

  const option = symbol => {
    return {
      id: symbol.id,
      title: R.last(symbol.hierarchy),
      description: R.dropLast(1, symbol.hierarchy).join(' • '),
      url: url(replace(replace(symbol.sidc, 1, 'F'), 3, 'P')),
      scope: 'SYMBOL',
      tags: tags(symbol),
      capabilities: 'TAG'
    }
  }

  return id => option(storage.getItem(id))
})()

options.place = (() => {
  const tags = entry => [entry.class, entry.type]
    .filter(R.identity)
    .map(label => `SYSTEM:${label}:NONE`)

  const option = entry => {
    return {
      id: entry.id,
      title: entry.name,
      description: entry.description,
      tags: [
        'SCOPE:PLACE:action.identify',
        ...tags(entry),
        ...(entry.tags || []).map(label => `USER:${label}:NONE`)
      ].join(' '),
      capabilities: 'TAG|RENAME',
      actions: 'PRIMARY:action.panto'
    }
  }

  return id => option(storage.getItem(id))
})()
