import React from 'react'
import Body from './Body'
import { Avatar } from './Avatar'
import emitter from '../emitter'

// Selection has precedence over focus:
const className = props => (props.focus && !props.selected)
  ? 'card card-focus'
  : 'card'

const Card = React.forwardRef((props, ref) => {
  const handleDoubleClick = () => {
    if (!props.actions) return
    const actions = props.actions.split('|')
    const action = actions.find(action => action.includes('PRIMARY'))
    if (!action) return
    emitter.emit(`${props.id}/${action.split(':')[1]}`)
  }

  return (
    <div
      className={className(props)}
      ref={ref}
      role='option'
      aria-selected={props.selected}
      onClick={props.onClick}
      onDoubleClick={handleDoubleClick}
    >
      <Body
        id={props.id}
        title={props.title}
        description={props.description}
        tags={props.tags}
        edit={props.edit}
        capabilities={props.capabilities}
      />
      { props.url ? <Avatar url={props.url}/> : null }
    </div>
  )
})

export default React.memo(Card)