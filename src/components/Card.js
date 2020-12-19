import React from 'react'
import { TagList } from './TagList'

const Avatar = ({ url }) => {
  return (
    <div className='card-avatar'>
      <img className='avatar-image' src={url}></img>
    </div>
  )
}

const Body = props => {
  const description = props.description
    ? <span className='card-description'>{props.description}</span>
    : null

  return (
    <div className='card-body'>
      <div className='card-title'>{props.title}</div>
      {description}
      <TagList {...props}/>
    </div>
  )
}

export const Card = React.forwardRef((props, ref) => {
  return (
    <div
      className='card'
      ref={ref}
      role='option'
      aria-selected={props.selected}
      onClick={props.onClick}
     >
      <Body {...props}/>
      { props.url ? <Avatar url={props.url}/> : null }
    </div>
  )
})
