import React from 'react'
import Body from './Body'
import { Avatar } from './Avatar'

// Selection has precedence over focus:
const className = props => (props.focus && !props.selected)
  ? 'card card-focus'
  : 'card'

const Card = React.forwardRef((props, ref) => (
  <div
    className={className(props)}
    ref={ref}
    role='option'
    aria-selected={props.selected}
    onClick={props.onClick}
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
))

export default React.memo(Card)