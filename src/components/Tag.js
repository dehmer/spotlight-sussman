import * as R from 'ramda'
import React from 'react'
import { TagIcon } from './TagIcon'
import * as mdi from '@mdi/js'
import evented from '../evented'
import selection from '../selection'

const Tag = props => {
  const { variant, children } = props
  const closable = variant === 'USER'
  const variantClassName = variant ? `tag-${variant.toLowerCase()}` : ''
  const className = props.action !== 'NONE'
    ? `tag-active ${variantClassName}`
    : `tag ${variantClassName}`

  const style = {
    color: props.color,
    backgroundColor: props.backgroundColor,
    borderColor: props.borderColor
  }

  const handleClick = event => {
    event.stopPropagation()
    if (props.onClick) props.onClick()
    else if (props.action !== 'NONE') {
      const ids = R.uniq([props.id, ...selection.selected()])
      const type = `${props.action}.${props.label.toLowerCase()}`
      evented.emit({ type, ids })
    }
  }

  return (
    <span
      className={className}
      onClick={handleClick}
      style={style}
    >
      { children }
      {
        closable &&
        props.capabilities.includes('TAG') &&
        <TagIcon
          path={mdi.mdiClose}
          closable={closable}
          onClose={props.onClose}
          color='grey'
        />
      }

    </span>
  )
}

export default React.memo(Tag)
