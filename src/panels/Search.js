import React from 'react'
import evented from '../evented'

export const Search = () => {
  const [value, setValue] = React.useState('')
  const ref = React.useRef()

  React.useEffect(() => {
    evented.on(event => {
      if (event.type !== 'search-provider.changed') return
      setValue('')
      ref.current.focus()
    })
  })

  const handleChange = ({ target }) => {
    setValue(target.value)
    evented.emit({
      type: 'search-filter.changed',
      value: target.value,
      mode: 'continuous'
    })
  }

  const handleKeyDown = event => {
    if (event.code === 'KeyA' && event.metaKey) return event.stopPropagation()
    else if (event.code === 'ArrowDown') return event.preventDefault()
    else if (event.code === 'ArrowUp') return event.preventDefault()
    else if (event.code === 'Escape') {
      setValue('')
      evented.emit({
        type: 'search-filter.changed',
        value: '',
        mode: 'continuous'
      })
    }
    else if (event.code === 'Enter') {
      event.stopPropagation()
      if (event.metaKey) evented.emit({ type: 'command.storage.newgroup' })
      else evented.emit({
        type: 'search-filter.changed',
        value,
        mode: 'enter'
      })
    }
    else if (event.code === 'Digit1' && event.metaKey) evented.emit({ type: 'command.search.scope.all' })
    else if (event.code === 'Digit2' && event.metaKey) evented.emit({ type: 'command.search.scope.layer' })
    else if (event.code === 'Digit3' && event.metaKey) evented.emit({ type: 'command.search.scope.feature' })
    else if (event.code === 'Digit4' && event.metaKey) evented.emit({ type: 'command.search.scope.symbol' })
    else if (event.code === 'Digit5' && event.metaKey) evented.emit({ type: 'command.search.scope.group' })
    else if (event.code === 'Digit6' && event.metaKey) evented.emit({ type: 'command.search.scope.place' })
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
