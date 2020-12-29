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
    if (props.onClick) props.onClick()
    else if (props.action === 'CLICK') {
      const ids = R.uniq([props.id, ...selection.selected()])
      const type = `command.storage.${props.label.toLowerCase()}`
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
        closable && <TagIcon
          path={mdi.mdiClose}
          closable={closable}
          onClose={props.onClose}
        />
      }

    </span>
  )
}

export default React.memo(Tag)
