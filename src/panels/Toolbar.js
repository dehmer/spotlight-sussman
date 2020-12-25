import React from 'react'
import * as mdi from '@mdi/js'
import { IconButton } from '../components/IconButton'
import evented from '../evented'

const changeScope = scope => evented.emit({ type: 'search-scope.changed', scope })

const descriptors = [
  {
    key: 'search',
    enabled: true,
    path: mdi.mdiMagnify,
    action: () => changeScope(),
    selected: true
  },
  {
    key: 'layers',
    enabled: true,
    path: mdi.mdiLayersTriple,
    action: () => changeScope('layer')
  },
  {
    key: 'features',
    enabled: true,
    path: mdi.mdiShapeOutline,
    action: () => changeScope('feature')
  },
  {
    key: 'palette',
    enabled: true,
    path: mdi.mdiPaletteOutline,
    action: () => changeScope('symbol')
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
