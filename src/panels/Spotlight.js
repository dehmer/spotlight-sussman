import React from 'react'
import { CardList } from '../components/CardList'

const Search = ({ initialValue = '', onChange }) => {
  const handleChange = ({ target }) => onChange(target.value)

  return (
    <div className='search-conainer'>
      <input
        className='search-input'
        placeholder='Spotlight Search'
        value={initialValue}
        onChange={handleChange}
      />
    </div>
  )
}


export const Spotlight = props => {
  const { provider: search, filter, handleChange } = props
  const entries = search(filter) || []

  return (
    <div className="spotlight panel">
      <Search initialValue={filter} onChange={handleChange}></Search>
      <CardList entries={entries}></CardList>
    </div>
  )
}