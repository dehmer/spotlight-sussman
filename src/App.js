import React from 'react'
import { Map } from './components/Map'
import { PanelRoot } from './panels/PanelRoot'

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
