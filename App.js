import React from 'react'
import 'ol/ol.css'
import * as ol from 'ol'
import OSM from 'ol/source/OSM'
import { Tile as TileLayer } from 'ol/layer'
import { Spotlight } from './spotlight'

/**
 * <Map/> and <App/> are siblings with <body/> as parent.
 */
export const App = () => {

  React.useEffect(() => {
    const target = 'map'
    const controls = []
    const center = [1740294.4412834928, 6145380.806904582]
    const zoom = 14
    const view = new ol.View({ center, zoom })
    const layers = [new TileLayer({ source: new OSM() })]
    new ol.Map({ target, controls, layers, view })
  }, [])

  return (
    <Spotlight></Spotlight>
  )
}
