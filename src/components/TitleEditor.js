import React from 'react'
import emitter from '../emitter'

export const TitleEditor = props => {
  const [value, setValue] = React.useState(props.value)

  const handleChange = ({ target }) => {
    setValue(target.value)
  }

  const commit = name => emitter.emit(`${props.id}/rename`, { name })
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
