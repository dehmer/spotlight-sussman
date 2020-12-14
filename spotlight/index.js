import React from 'react'
import * as R from 'ramda'
import lunr from 'lunr'
import ms from 'milsymbol'
import './spotlight.css'
import descriptors from '../model/feature-descriptors.json'

const descriptorIndex = {}
descriptors.forEach(descriptor => descriptorIndex[descriptor.sidc] = descriptor)

const document = descriptor => {
  const tags = [
    ...descriptor.dimension ? descriptor.dimension.split(', ') : [],
    ...descriptor.scope ? descriptor.scope.split(', ') : []
  ].flat().join(' ')

  if (!descriptor.hierarchy) console.error(descriptor)

  return {
    sidc: descriptor.sidc,
    text: descriptor.hierarchy.join(' '),
    tags
  }
}

const index = lunr(function () {
  this.pipeline.remove(lunr.stemmer)
  this.searchPipeline.remove(lunr.stemmer)
  this.metadataWhitelist = ['position']

  this.ref('sidc')
  this.field('text')
  this.field('tags')

  descriptors
    .map(document)
    .forEach(document => this.add(document))
})

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

const Card = props => {

  const symbol = new ms.Symbol(props.sidc)
  const extended = false
  const url = symbol.isValid(extended)
    ? symbol.asCanvas().toDataURL()
    : placeholderSymbol.asCanvas().toDataURL()

  return <div className='card'>
    {/* TODO: card-content */}
    <div className='card-avatar'>
      <img className='avatar-image' src={url}></img>
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
  console.time('[List]')
  const component = (
    <div className='list-container'>
      <ul className='list'>
        { entries(items) }
      </ul>
    </div>
  )

  console.timeEnd('[List]')
  return component
}


export const Spotlight = () => {
  const [filter, setFilter] = React.useState('')
  const [items, setItems] = React.useState([])

  const handleChange = value => {
    console.time('[handleChange]')
    setFilter(value)
    if (!value.trim()) {
      console.timeEnd('[handleChange]')
      return setItems([])
    }

    // TODO: filter possible '*' from value
    const term = value.split(' ')
      .filter(value => value.length > 1)
      .map(value => `+${value}*`).join(' ')

    if (!term) {
      console.timeEnd('[handleChange]')
      return
    }

    const items = index.search(term).map(entry => descriptorIndex[entry.ref])
    console.log('items', items.length)
    setItems(items)
    console.timeEnd('[handleChange]')
  }

  return (
    <div className="spotlight">
      <Search initialValue={filter} onChange={handleChange}></Search>
      <List items={items}></List>
    </div>
  )
}