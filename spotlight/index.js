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

const Tag = props => {
  const { value, variant = 'default'} = props
  const mustTrim = s => s.length > 16
  const trim = s => mustTrim(s) ? s.substring(0, 16) + '...' : s
  const className = `tag tag-${variant}`
  const title = mustTrim(value) ? value : null
  return <span key={value} title={title} className={className}>{trim(value)}</span>
}

const TagList = ({ scope, tags }) => {
  const components = [
    <Tag key={scope} value={scope} variant='scope'/>,
    ...tags.map(value => <Tag key={value} value={value}/>)
  ]

  return <div className='tag-container'> {components} </div>
}

/**
 *
 */
const Card = props => {

  const avatar = props.url
    ? <div className='card-avatar'>
        <img className='avatar-image' src={props.url()}></img>
      </div>
    : null

  const body = (
    <div className='card-body'>
      <div className='card-title'>{props.title}</div>
      {
        props.description
          ? <span className='card-description'>{props.description}</span>
          : null
      }

      <TagList {...props}/>
    </div>
  )

  return (
    <div className='card'>
      { body }
      { avatar }
    </div>
  )
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

    const term = R.cond([
      [R.startsWith('#'), s => `+tags:${s.substring(1)}*`],
      [R.startsWith('@'), s => `+scope:${s.substring(1)}`],
      [R.T, s => `+text:${s}*`]
    ])

    const terms = value.split(' ')
      .filter(R.identity)
      .map(term)
      .join(' ')

    if (!terms.trim()) return

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