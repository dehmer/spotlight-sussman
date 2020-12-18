import React from 'react'
import { CardList } from '../components/CardList'
import evented from '../evented'

const Search = () => {
  const [value, setValue] = React.useState('')

  React.useEffect(() => {
    evented.on(event => {
      if (event.type !== 'search-scope.changed') return
      setValue('')
    })
  })

  const handleChange = ({ target }) => {
    setValue(target.value)
    evented.emit({ type: 'search-filter.changed', value: target.value })
  }

  return (
    <div className='search-conainer'>
      <input
        className='search-input'
        placeholder='Spotlight Search'
        value={value}
        onChange={handleChange}
      />
    </div>
  )
}

export const Spotlight = () => {
  const [result, setResult] = React.useState([])

  React.useEffect(() => {
    evented.on(({ type, result }) => {
      if (type !== 'search-result.changed') return
      setResult(result)
    })
  }, [])

  return (
    <div className="spotlight panel">
      <Search/>
      <CardList>{result}</CardList>
    </div>
  )
}