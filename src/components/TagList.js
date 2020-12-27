import React from 'react'
import { Tag } from './Tag'
import * as mdi from '@mdi/js'
import evented from '../evented'
import { TagIcon } from './TagIcon'


export const TagList = props => {
  const { tags } = props

  const [inputVisible, setInputVisible] = React.useState(false)
  const [inputValue, setInputValue] = React.useState('')
  const inputRef = React.createRef()

  const handleClose = tag => () => evented.emit({
    type: 'command.remove-tag',
    id: props.id,
    tag
  })

  const tag = props => {
    const closable = props.type === 'USER'
    return (
      <Tag
        key={props.label}
        variant={props.type}
        action={props.action}
        closable={closable}
        onClose={handleClose(props.label)}
      >
        <span>{props.label}</span>
      </Tag>
    )
  }

  const action = () => {
    setInputValue('')
    setInputVisible(true)
  }

  const confirmInput = () => {
    setInputVisible(false)
    if (!inputValue) return
    evented.emit({ type: 'command.add-tag', id: props.id, tag: inputValue })
  }

  const handleKeyDown = event => {
    switch (event.code) {
      case 'Enter': {
        event.stopPropagation()
        confirmInput()
        break;
      }
      case 'Escape': {
        event.stopPropagation()
        setInputVisible(false)
        break;
      }
      case 'KeyA': {
        if (event.metaKey) event.stopPropagation()
        break;
      }
    }
  }

  const handleChange = ({ target }) => setInputValue(target.value)

  return (
    <div className='tag-list'>
      { tags.map(tag) }
      {
        inputVisible
          ? <input
              className='tag-input'
              ref={inputRef}
              autoFocus
              onBlur={confirmInput}
              onKeyDown={handleKeyDown}
              onChange={handleChange}
            >
            </input>
          : <Tag variant='plus' action={action} color='black'>
              <TagIcon path={mdi.mdiPlus} size='12px'/>
              <span>ADD TAG</span>
            </Tag>
      }

    </div>
  )
}
