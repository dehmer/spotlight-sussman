import React from 'react'
import * as R from 'ramda'
import lunr from 'lunr'
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

const Card = props => {
  return <div className='card'>
    {/* TODO: card-content */}
    <div>
      <div className='card-title'>{props.title}</div>
      <p className='card-description'>{props.description}</p>
      <TagContainer tags={props.tags}/>
    </div>
  </div>
}

const entries = items => items.map(descriptor => {
  const title = R.last(descriptor.hierarchy)
  const description = R.dropLast(1, descriptor.hierarchy).join(' • ')
  const dimension = descriptor.dimension ? descriptor.dimension.split(', ') : []

  const tags = [
    ...dimension,
    descriptor.scope
  ].filter(R.identity)

  return <Card
    key={descriptor.sidc}
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

  const handleSearchChange = value => {
    setFilter(value)
    if (!value.trim()) return setItems([])

    // TODO: filter possible '*' from value
    const term = value.split(' ').map(value => `${value}*`).join(' ')
    const items = index.search(term).map(entry => descriptorIndex[entry.ref])
    setItems(items)
  }

  return (
    <div className="spotlight">
      <Search initialValue={filter} onChange={handleSearchChange}></Search>
      <List items={items}></List>
    </div>
  )
}