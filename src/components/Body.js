import React from 'react'
import { TitleEditor } from './TitleEditor'
import { TitleLabel } from './TitleLabel'
import { Description } from './Description'
import { TagList } from './TagList'

export const Body = props => {
  const title = props.editor ? <TitleEditor {...props}/> : <TitleLabel {...props}/>
  return (
    <div className='card-body'>
      { title }
      <Description value={props.description}/>
      <TagList {...props}/>
    </div>
  )
}
