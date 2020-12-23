import React from 'react'
import { Tag } from './Tag'

export const TagList = ({ tags }) => {
  return (
    <div className='tag-list'>
      {
        tags.
          filter(props => props.label)
          .map(props => <Tag key={props.label} {...props}/>)
      }
    </div>
  )
}
