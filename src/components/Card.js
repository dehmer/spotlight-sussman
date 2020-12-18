import React from 'react'
import { TagList } from './TagList'

export const Card = props => {
  const avatar = props.url
    ? <div className='card-avatar'>
        <img className='avatar-image' src={props.url}></img>
      </div>
    : null

  const body = (
    <div className='card-body'>
      <div className='card-title'>{props.title}</div>
      {
        props.description
          ? <span className='card-description'>{props.description}</span>
          : null
      }

      <TagList {...props}/>
    </div>
  )

  const handleDoubeClick = props.primaryAction
      ? props.primaryAction
      : null

  return (
    <div className='card' onDoubleClick={handleDoubeClick}>
      { body }
      { avatar }
    </div>
  )
}
