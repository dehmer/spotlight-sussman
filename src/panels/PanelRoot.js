import React from 'react'
import { Spotlight } from './Spotlight'
import { Toolbar } from './Toolbar'

export const PanelRoot = () => (
  <div className='panel-root fullscreen'>
    <Spotlight/>
    <Toolbar/>
  </div>
)
