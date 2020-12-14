import React from 'react'
import * as R from 'ramda'
import './spotlight.css'
import descriptors from '../model/feature-descriptors.json'

const Search = props => {
  return <div className='search-conainer'>
    <input className='search-input' placeholder='Spotlight Search'></input>
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

const entries = () => R.dropLast(1500, descriptors).map(descriptor => {
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

const List = props => {
  return (
    <div className='list-container'>
      <ul className='list'>
        { entries() }
      </ul>
    </div>
  )
}


export const Spotlight = () => {
  return (
    <div className="spotlight">
      <Search></Search>
      <List></List>
    </div>
  )
}