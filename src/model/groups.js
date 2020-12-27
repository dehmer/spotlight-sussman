import * as R from 'ramda'
import uuid from 'random-uuid'
import evented from '../evented'
import { search } from '../search/lunr'

const groups = {}
var terms = ''

// -> lunr documents interface

export const lunr = (() => {

  const document = ({ id, scope, name, tags }) => {
    return { id, scope: [...scope, 'group'], text: name, tags }
  }

  return () => Object.values(groups).map(document)
})()

// <- lunr documents interface

// -> Spotlight interface

export const option = (() => {
  const option = group => {

    const matches = search(group.terms).filter(({ ref }) => !ref.startsWith('group:'))
    console.log(matches)

    const scope = [...group.scope, 'group']
    const tags = group.tags || []

    return {
      id: group.id,
      title: group.name,
      tags: [
        ...scope.map(label => ({ type: 'SCOPE', label })),
        ...tags.map(label => ({ type: 'USER', label }))
      ],
      capabilities: ['RENAME']
    }
  }

  return id => option(groups[id])
})()

// <- Spotlight interface

evented.on(event => {
  if (event.type === 'search.current') terms = event.terms
  else if (event.type === 'command.group.create') {
    if (!terms) return
    const fields = terms.split(' ')
      .map(part => R.drop(1, (/\+(\w+):(\w+)/g).exec(part)))
      .reduce((acc, tuple) => {
        acc[tuple[0]] = acc[tuple[0]] || []
        acc[tuple[0]].push(tuple[1])
        return acc
      }, {})

    const id = `group:${uuid()}`
    const name = fields.text.join(' ') || 'N/A'
    groups[id] = { id, name, terms, ...fields }
    evented.emit({ type: 'model.changed' })
  }
})