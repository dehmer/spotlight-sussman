import React from 'react'
import Icon from '@mdi/react'
import * as mdi from '@mdi/js'
import './toolbar.css'
import lunr from '../index/lunr'

const providerEvent = detail => new CustomEvent('spotlight.provider', { detail })
const dispatchProvider = fn => () => window.dispatchEvent(providerEvent(fn))

const scope = scope => filter => lunr(`@${scope} ${filter}`)

const IconButton = props => {
  const { path, onClick } = props
  return (
    <div className='iconbutton' onClick={onClick}>
      <Icon path={path} size={1}/>
    </div>
  )
}

export const Toolbar = props => {
  return (
    <ul className='toolbar'>
      <IconButton
        path={mdi.mdiMagnify}
        onClick={dispatchProvider(lunr)}
      />

      <IconButton
        path={mdi.mdiLayersTriple}
        onClick={dispatchProvider(scope('layer'))}
      />

      <IconButton
        path={mdi.mdiShapeOutline}
        onClick={dispatchProvider(scope('feature'))}
      />

      <IconButton
        path={mdi.mdiPaletteOutline}
        onClick={dispatchProvider(scope('symbol'))}
      />

      <IconButton path={mdi.mdiMap}/>
      <IconButton path={mdi.mdiCamera}/>
      <IconButton path={mdi.mdiAngleAcute}/>
      <IconButton path={mdi.mdiBookmarkMultiple}/>
      <IconButton path={mdi.mdiMapSearch}/>
    </ul>
  )
}
