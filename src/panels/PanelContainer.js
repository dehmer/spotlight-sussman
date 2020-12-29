import React from 'react'
import Spotlight from './Spotlight'
import { Toolbar } from './Toolbar'

export const PanelContainer = () => (
  <div className='panel-container fullscreen'>
    <Spotlight/>
    <Toolbar/>
  </div>
)
