import React from 'react'
import { Map } from './Map'
import { PanelLayer } from './Panels'

/**
 * <Map/> and <App/> are siblings with <body/> as parent.
 */
export const App = () => {
  return (
    <>
      <Map></Map>
      <PanelLayer></PanelLayer>
    </>
  )
}
