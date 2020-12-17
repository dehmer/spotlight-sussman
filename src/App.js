import React from 'react'
import { Map } from './components/Map'
import { PanelRoot } from './panels/PanelRoot'
import './search'

/**
 * <Map/> and <App/> are siblings with <body/> as parent.
 */
export const App = () => {
  return (
    <>
      <Map></Map>
      <PanelRoot></PanelRoot>
    </>
  )
}
