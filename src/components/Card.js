import React from 'react'
import { TagList } from './TagList'

const Avatar = ({ url }) => {
  return (
    <div className='card-avatar'>
      <img className='avatar-image' src={url}></img>
    </div>
  )
}

const TitleEditor = props => {
  const handleChange = ({ target }) => {
    props.onPropertyChange({ property: 'title', value: target.value })
  }

  const handleKeyDown = event => {
    const noop = () => { event.stopPropagation();  event.preventDefault() }
    if (event.code === 'KeyA' && event.metaKey) event.stopPropagation()
    else if (event.code === 'ArrowDown') noop()
    else if (event.code === 'ArrowUp') noop()
  }

  return <div>
    <input
      className='title-input'
      value={props.editor.value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      autoFocus
    />
  </div>
}

const TitleLabel = props => <div className='title-label'>{props.title}</div>

const Description = props => {
  if (!props.value) return null
  return <span className='card-description'>{props.value}</span>
}

const Body = props => {
  const title = props.editor ? <TitleEditor {...props}/> : <TitleLabel {...props}/>
  return (
    <div className='card-body'>
      { title }
      <Description value={props.description}/>
      <TagList {...props}/>
    </div>
  )
}

export const Card = React.forwardRef((props, ref) => {
  // Selection has precedence over focus:
  const className = (props.focus && !props.selected)
    ? 'card card-focus'
    : 'card'

  return (
    <div
      className={className}
      ref={ref}
      role='option'
      aria-selected={props.selected}
      onClick={props.onClick}
     >
      <Body {...props}/>
      { props.url ? <Avatar url={props.url}/> : null }
    </div>
  )
})
