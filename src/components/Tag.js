import React from 'react'

export const Tag = props => {
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
