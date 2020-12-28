import React from 'react'
import { TitleEditor } from './TitleEditor'
import { TitleLabel } from './TitleLabel'
import { Description } from './Description'
import { TagList } from './TagList'

export const Body = props => {
  return (
    <div className='card-body'>
      { props.editor
          ? <TitleEditor editor={props.editor} onPropertyChange={props.onPropertyChange}/>
          : <TitleLabel title={props.title}/>
      }
      <Description value={props.description}/>
      <TagList id={props.id} tags={props.tags}/>
    </div>
  )
}
