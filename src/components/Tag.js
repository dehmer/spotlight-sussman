import React from 'react'
import { TagIcon } from './TagIcon'
import * as mdi from '@mdi/js'

export const Tag = props => {
  const { variant, children } = props
  const variantClassName = variant ? `tag-${variant.toLowerCase()}` : ''
  const className = props.action
    ? `tag-active ${variantClassName}`
    : `tag ${variantClassName}`

  const style = {
    color: props.color,
    backgroundColor: props.backgroundColor,
    borderColor: props.borderColor
  }

  const handleClick = event => {
    event.stopPropagation()
    props.action && props.action()
  }

  return (
    <span
      className={className}
      onClick={handleClick}
      style={style}
    >
      { children }
      {
        props.closable && <TagIcon
          path={mdi.mdiClose}
          closable={props.closable}
          onClose={props.onClose}
        />
      }

    </span>
  )
}
