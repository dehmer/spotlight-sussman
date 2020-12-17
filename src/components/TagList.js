import React from 'react'
import { Tag } from './Tag'

export const TagList = ({ scope, tags }) => {
  const components = [
    <Tag key={scope} text={scope} variant='scope'/>,
    ...tags.map(tag => <Tag key={tag.text} text={tag.text} onClick={tag.command}/>)
  ]

  return <div className='tag-container'> {components} </div>
}
