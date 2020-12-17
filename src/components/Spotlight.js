import React from 'react'

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

const Tag = props => {
  const { text, onClick, variant = 'default'} = props
  const mustTrim = s => s.length > 32
  const trim = s => mustTrim(s) ? s.substring(0, 16) + '...' : s
  const className = `tag tag-${variant}`
  const title = mustTrim(text) ? text : null
  return <span
    key={text}
    title={title}
    className={className}
    onClick={onClick}
  >
    {trim(text)}
  </span>
}

const TagList = ({ scope, tags }) => {
  const components = [
    <Tag key={scope} text={scope} variant='scope'/>,
    ...tags.map(tag => <Tag key={tag.text} text={tag.text} onClick={tag.command}/>)
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

  const handleDoubeClick = props.primaryAction
      ? props.primaryAction
      : null

  return (
    <div className='card' onDoubleClick={handleDoubeClick}>
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

export const Spotlight = props => {
  const { provider: search, filter, handleChange } = props
  const entries = search(filter) || []

  return (
    <div className="spotlight panel">
      <Search initialValue={filter} onChange={handleChange}></Search>
      <List entries={entries}></List>
    </div>
  )
}