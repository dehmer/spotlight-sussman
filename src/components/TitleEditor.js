import React from 'react'
import evented from '../evented'

export const TitleEditor = props => {
  const [value, setValue] = React.useState(props.value)

  const handleChange = ({ target }) => {
    setValue(target.value)
  }

  const commit = name => evented.emit({ type: 'command.storage.rename', id: props.id, name})
  const handleBlur = () => commit(value)

  const handleKeyDown = event => {
    const noop = () => { event.stopPropagation(); event.preventDefault() }
    if (event.code === 'KeyA' && event.metaKey) event.stopPropagation()
    else if (event.code === 'ArrowDown') noop()
    else if (event.code === 'ArrowUp') noop()
    else if (event.code === 'Escape') commit(props.value)
  }

  return <div>
    <input
      className='title-input'
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      autoFocus
    />
  </div>
}
