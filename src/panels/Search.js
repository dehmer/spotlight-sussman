import React from 'react'
import emitter from '../emitter'

export const Search = () => {
  const [value, setValue] = React.useState('')
  const ref = React.useRef()

  React.useEffect(() => {
    const handler = () => {
      setValue('')
      ref.current.focus()
    }

    emitter.on('search/provider/updated', handler)
    return () => emitter.off('search/provider/updated', handler)
  })

  const handleChange = ({ target }) => {
    setValue(target.value)
    emitter.emit('search/filter/updated', { value: target.value, mode: 'continuous' })
  }

  const handleKeyDown = event => {
    if (event.code === 'KeyA' && event.metaKey) return event.stopPropagation()
    else if (event.code === 'ArrowDown') return event.preventDefault()
    else if (event.code === 'ArrowUp') return event.preventDefault()
    else if (event.code === 'Escape') {
      setValue('')
      emitter.emit('search/filter/updated', { value: '', mode: 'continuous' })
    }
    else if (event.code === 'Enter') {
      event.stopPropagation()
      if (event.metaKey) emitter.emit('storage/group')
      else emitter.emit('search/filter/updated', { value, mode: 'enter' })
    }
    else if (event.code === 'Digit1' && event.metaKey) emitter.emit('search/scope/all')
    else if (event.code === 'Digit2' && event.metaKey) emitter.emit('search/scope/layer')
    else if (event.code === 'Digit3' && event.metaKey) emitter.emit('search/scope/feature')
    else if (event.code === 'Digit4' && event.metaKey) emitter.emit('search/scope/symbol')
    else if (event.code === 'Digit5' && event.metaKey) emitter.emit('search/scope/group')
    else if (event.code === 'Digit6' && event.metaKey) emitter.emit('search/scope/place')
  }

  return (
    <div className='search-container'>
      <input
        ref={ref}
        className='search-input'
        placeholder='Spotlight Search'
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
    </div>
  )
}
