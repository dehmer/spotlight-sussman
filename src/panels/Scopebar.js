import React from 'react'
import TagList from '../components/TagList'
import emitter from '../emitter'

const initialScopes = [
  'SCOPE:ALL:search/scope',
  'SYSTEM:LAYER:search/scope',
  'SYSTEM:FEATURE:search/scope',
  'SYSTEM:SYMBOL:search/scope',
  'SYSTEM:GROUP:search/scope',
  'SYSTEM:PLACE:search/scope'
]

const reducer = (state, { scope }) => {
  return state.map(tag => {
    const [_, text, action] = tag.split(':')
    return [
      text === (scope || '').toUpperCase() ? 'SCOPE' : 'SYSTEM',
      text,
      action
    ].join(':')
  })
}

export const Scopebar = props => {
  const [scopes, dispatch] = React.useReducer(reducer, initialScopes)

  React.useEffect(() => {
    emitter.on('search/provider/updated', dispatch)
    return () => emitter.off('search/provider/updated', dispatch)
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
