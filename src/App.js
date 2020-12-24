import React from 'react'
import { Map } from './components/Map'
import { PanelContainer } from './panels/PanelContainer'
import './search'

/**
 * <Map/> and <App/> are siblings with <body/> as parent.
 */
export const App = () => {
  return (
    <>
      <Map></Map>
      <PanelContainer></PanelContainer>
    </>
  )
}
