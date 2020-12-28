import React from 'react'
import { Body } from './Body'
import { Avatar } from './Avatar'


export const Card = React.forwardRef((props, ref) => {

  // Selection has precedence over focus:
  const className = (props.focus && !props.selected)
    ? 'card card-focus'
    : 'card'

  const component = (
    <div
      className={className}
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
        editor={props.editor}
        onPropertyChange={props.onPropertyChange}
      />
      { props.url ? <Avatar url={props.url}/> : null }
    </div>
  )

  return component
})
