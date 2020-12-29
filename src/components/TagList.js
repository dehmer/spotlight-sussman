import * as R from 'ramda'
import React from 'react'
import Tag from './Tag'
import * as mdi from '@mdi/js'
import evented from '../evented'
import { TagIcon } from './TagIcon'
import selection from '../selection'

const TagList = props => {
  const { id, tags } = props
  const [inputVisible, setInputVisible] = React.useState(false)
  const [inputValue, setInputValue] = React.useState('')
  const inputRef = React.createRef()
  const ids = () => R.uniq([id, ...selection.selected()])

  const handleClose = tag => () => {
    evented.emit({ type: 'command.storage.removetag', ids: ids(), tag })
  }

  const onClick = () => {
    setInputValue('')
    setInputVisible(true)
  }

  const tag = spec => {
    const [variant, label, action] = spec.split(':')
    return (
      <Tag
        key={`${variant}:${label}`}
        id={id}
        variant={variant}
        action={action}
        label={label}
        onClose={handleClose(label)}
      >
        <span>{label}</span>
      </Tag>
    )
  }

  const confirmInput = () => {
    setInputVisible(false)
    if (!inputValue) return
    evented.emit({ type: 'command.storage.addtag', ids: ids(), tag: inputValue })
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
      { tags.split(' ').map(tag) }
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
          : <Tag variant='plus' onClick={onClick} color='black'>
              <TagIcon path={mdi.mdiPlus} size='12px'/>
              <span>ADD TAG</span>
            </Tag>
      }
    </div>
  )
}

export default React.memo(TagList)