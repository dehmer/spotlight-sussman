import React from 'react'
import * as R from 'ramda'
import './spotlight.css'
import { index, entry } from '../model/search-index'

const Search = ({ initialValue = '', onChange }) => {
  const handleChange = ({ target }) => onChange(target.value)

  return <div className='search-conainer'>
    <input
      className='search-input'
      placeholder='Spotlight Search'
      value={initialValue}
      onChange={handleChange}
    >

    </input>
  </div>
}

const TagContainer = ({ tags }) => {
  const tag = tag => <span key={tag} className='tag'>{tag}</span>
  if (!tags) return null
  else return <div className='tag-container'> {tags.map(tag)} </div>
}

const Card = props => {

  const avatar = props.url
    ? <div className='card-avatar'>
        <img className='avatar-image' src={props.url()}></img>
      </div>
    : null

  return <div className='card'>
    { avatar }
    <div className='card-body'>
      <div className='card-title'>{props.title}</div>

      {
        props.description
          ? <span className='card-description'>{props.description}</span>
          : null
      }

      <TagContainer tags={props.tags}/>
    </div>
  </div>
}


const List = ({ entries }) => (
  <div className='list-container'>
    <ul className='list'>
      { entries.map(entry => <Card {...entry}/>) }
    </ul>
  </div>
)

export const Spotlight = () => {
  const [filter, setFilter] = React.useState('')
  const [entries, setEntries] = React.useState([])

  const handleChange = value => {
    setFilter(value)
    if (!value.trim()) return setEntries([])

    // TODO: filter possible '*' from value
    const term = value => value.startsWith('#')
      ? `+tag:${value.substring(1)}`
      : value.indexOf(':') === -1
        ? `+text:${value}*`
        : value.length > value.indexOf(':') + 1
          ? `+${value}`
          : ''

    const terms = value.split(' ')
      .filter(value => value.length > 1)
      .map(term)
      .join(' ')

    if (!terms) return

    const search = terms => index.search(terms).map(({ ref }) => entry(ref))
    const limit = R.identity /* no limits */
    const load = R.compose(limit, search)
    setEntries(load(terms))
  }

  return (
    <div className="spotlight">
      <Search initialValue={filter} onChange={handleChange}></Search>
      <List entries={entries}></List>
    </div>
  )
}