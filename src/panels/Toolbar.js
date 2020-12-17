import React from 'react'
import * as mdi from '@mdi/js'
import lunr from '../index/lunr'
import { IconButton } from '../components/IconButton'

const providerEvent = detail => new CustomEvent('spotlight.provider', { detail })
const dispatchProvider = fn => () => window.dispatchEvent(providerEvent(fn))

const scope = scope => filter => lunr(`@${scope} ${filter}`)

const descriptors = [
  {
    key: 'search',
    enabled: true,
    path: mdi.mdiMagnify,
    action: dispatchProvider(lunr),
    selected: true
  },
  {
    key: 'layers',
    enabled: true,
    path: mdi.mdiLayersTriple,
    action: dispatchProvider(scope('layer'))
  },
  {
    key: 'features',
    enabled: true,
    path: mdi.mdiShapeOutline,
    action: dispatchProvider(scope('feature'))
  },
  {
    key: 'palette',
    enabled: true,
    path: mdi.mdiPaletteOutline,
    action: dispatchProvider(scope('symbol'))
  },
  { key: 'basemaps', enabled: false, path: mdi.mdiMap },
  { key: 'meassure', enabled: false, path: mdi.mdiAngleAcute },
  { key: 'bookmarks', enabled: false, path: mdi.mdiBookmarkMultiple },
  { key: 'places', enabled: false, path: mdi.mdiMapSearch }
]

export const Toolbar = props => {

  const [tools, setTools] = React.useState(descriptors)

  const handleClick = index => () => {
    const [...descriptors] = tools
    if (!descriptors[index].enabled) return
    descriptors.forEach(descriptor => descriptor.selected = false)
    descriptors[index].selected = true
    setTools(descriptors)
    descriptors[index].action()
  }

  const button = (descriptor, index) => <IconButton
    key={descriptor.key}
    path={descriptor.path}
    onClick={handleClick(index)}
    enabled={descriptor.enabled}
    selected={descriptor.selected}
  />

  const entries = tools.map(button)
  return <ul className='toolbar panel'>{entries}</ul>
}
