import { storage } from '.'
import evented from '../evented'
import { isLayer, isFeature, isGroup, isSymbol, layerId } from './ids'
import { isContained, item } from './helpers'
import { options } from '../model/options'
import { searchIndex } from '../search/lunr'

const option = id => options[id.split(':')[0]](id)

const handlers = {}

handlers.open = id => {
  if (isLayer(id)) {
    const layer = option(id)
    const features = storage.keys()
      .filter(isContained(id))
      .filter(isFeature)
      .map(option)

    evented.emit({
      type: 'command.search.provider',
      scope: layer.title,
      provider: (query, callback) => {
        callback(features)
      }
    })
  } else if (isGroup(id)) {
    const group = item(id)
    const options = searchIndex(group.terms)
      .filter(({ ref }) => !isGroup(ref))
      .filter(({ ref }) => !isSymbol(ref))
      .map(({ ref }) => ref)
      .map(option)

    evented.emit({
      type: 'command.search.provider',
      scope: group.title,
      provider: (query, callback) => {
        callback(options)
      }
    })
  }

}

handlers.back = id => {
  if (isFeature(id)) {
    evented.emit({ type: 'command.search.scope.layer' })
  }
}

evented.on(event => {
  if (!event.type) return
  if (!event.type.startsWith('action')) return
  if (!event.ids) return
  if (!event.ids.length === 1) return

  const handler = handlers[event.type.split('.')[1]]
  if (!handler) return
  handler(event.ids[0])
})
