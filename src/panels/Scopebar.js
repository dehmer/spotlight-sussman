import React from 'react'
import TagList from '../components/TagList'
import evented from '../evented'

const initialScopes = [
  'SCOPE:ALL:command.search.scope',
  'SYSTEM:LAYER:command.search.scope',
  'SYSTEM:FEATURE:command.search.scope',
  'SYSTEM:SYMBOL:command.search.scope',
  'SYSTEM:GROUP:command.search.scope',
  'SYSTEM:PLACE:command.search.scope'
]

const reducer = (state, event) => {
  const { type } = event
  const activate = (state, label) => {
    const clone = state.map(tag => {
      const [_, text, action] = tag.split(':')
      return [
        text === (label || '').toUpperCase() ? 'SCOPE' : 'SYSTEM',
        text,
        action
      ].join(':')
    })
    return clone
  }

  if (type !== 'search-provider.changed') return state
  return activate(state, event.scope)
}

export const Scopebar = props => {

  const [scopes, dispatch] = React.useReducer(reducer, initialScopes)

  React.useEffect(() => {
    evented.on(dispatch)
  }, [])

  // TODO: move to CSS (scopebar)
  const style = {
    padding: '12px',
    paddingBottom: '4px',
    borderBottomStyle: 'solid',
    borderWidth: '1px',
    borderColor: 'grey',
    fontSize: '90%'
  }

  return (
    <div style={style}>
      <TagList
        tags={scopes.join(' ')}
      />
    </div>
  )
}
