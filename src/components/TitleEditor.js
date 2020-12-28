import React from 'react'

export const TitleEditor = props => {

  const handleChange = ({ target }) => {
    props.onPropertyChange({ property: 'title', value: target.value })
  }

  const handleKeyDown = event => {
    const noop = () => { event.stopPropagation();  event.preventDefault() }
    if (event.code === 'KeyA' && event.metaKey) event.stopPropagation()
    else if (event.code === 'ArrowDown') noop()
    else if (event.code === 'ArrowUp') noop()
  }

  return <div>
    <input
      className='title-input'
      value={props.editor.value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      autoFocus
    />
  </div>
}
