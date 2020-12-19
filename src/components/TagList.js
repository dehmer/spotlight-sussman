import React from 'react'
import { Tag } from './Tag'

export const TagList = ({ scope, tags }) => {
  const components = [
    <Tag key={scope} text={scope} variant='scope'/>,
    ...tags.map(text => <Tag key={text} text={text}/>)
  ]

  return <div className='tag-container'> {components} </div>
}
