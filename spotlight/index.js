import React from 'react'
import * as R from 'ramda'
import ms from 'milsymbol'
import './spotlight.css'
import { index } from '../model/search-index'
import { descriptorIndex } from '../model/feature-descriptor'

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

const TagContainer = props => {
  // TODO: tag-container
  return <div>
    { props.tags.map(tag => <span key={tag} className='tag'>{tag}</span>) }
  </div>
}

const placeholderSymbol = new ms.Symbol('')

const cache = {
  _: placeholderSymbol.asCanvas().toDataURL()
}

const url = sidc => {
  if (!cache[sidc]) {
    const symbol = new ms.Symbol(sidc)
    if (!symbol.isValid()) return cache._
    cache[sidc] = symbol.asCanvas().toDataURL()
  }

  return cache[sidc]
}
const Card = props => {
  return <div className='card'>
    {/* TODO: card-content */}
    <div className='card-avatar'>
      <img className='avatar-image' src={url(props.sidc)}></img>
    </div>
    <div className='card-body'>
      <div className='card-title'>{props.title}</div>
      <p className='card-description'>{props.description}</p>
      <TagContainer tags={props.tags}/>
    </div>
  </div>
}

const replace = (s, i, r) => s.substring(0, i) + r + s.substring(i + r.length)

const entries = items => items.map(descriptor => {
  const title = R.last(descriptor.hierarchy)
  const description = R.dropLast(1, descriptor.hierarchy).join(' • ')
  const dimension = descriptor.dimension ? descriptor.dimension.split(', ') : []
  const sidc = () => {
    return replace(replace(descriptor.sidc, 1, 'F'), 3, 'P')
  }

  const tags = [
    ...dimension,
    descriptor.scope
  ].filter(R.identity)

  return <Card
    key={descriptor.sidc}
    sidc={sidc()}
    title={title}
    description={description}
    tags={tags}
  />
})

const List = ({items}) => {
  return (
    <div className='list-container'>
      <ul className='list'>
        { entries(items) }
      </ul>
    </div>
  )
}


export const Spotlight = () => {
  const [filter, setFilter] = React.useState('')
  const [items, setItems] = React.useState([])

  const handleChange = value => {
    setFilter(value)
    if (!value.trim()) return setItems([])

    // TODO: filter possible '*' from value
    const term = value => value.startsWith('#')
      ? `+tag:${value.substring(1)}`
      : `+text:${value}*`

    const terms = value.split(' ')
      .filter(value => value.length > 1)
      .map(term)
      .join(' ')

    if (!terms) return

    const search = terms => index.search(terms).map(entry => descriptorIndex[entry.ref])
    const limit = R.identity /* no limits */
    const load = R.compose(limit, search)
    setItems(load(terms))
  }

  return (
    <div className="spotlight">
      <Search initialValue={filter} onChange={handleChange}></Search>
      <List items={items}></List>
    </div>
  )
}