import React from 'react'
import { TitleEditor } from './TitleEditor'
import { TitleLabel } from './TitleLabel'
import { Description } from './Description'
import TagList from './TagList'

const Body = props => {
  return (
    <div className='card-body'>
      { props.edit
          ? <TitleEditor id={props.id} value={props.title}/>
          : <TitleLabel title={props.title}/>
      }
      <Description value={props.description}/>
      <TagList id={props.id} tags={props.tags}/>
    </div>
  )
}

export default React.memo(Body)