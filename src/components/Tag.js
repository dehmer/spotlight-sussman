import React from 'react'

export const Tag = props => {
  const { type, label } = props

  const className = props.action
    ? `tag-active tag-${type.toLowerCase()}`
    : `tag tag-${type.toLowerCase()}`

  const handleClick = props.action

  return (
    <span
      className={className}
      onClick={handleClick}
    >
      { label }
    </span>
  )
}
