import React from 'react'
import 'ol/ol.css'
import * as ol from 'ol'
import { OSM, Vector as VectorSource } from 'ol/source'
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer'

export const Map = props => {

  const vectorSource = new VectorSource()

  React.useEffect(() => {
    const target = 'map'
    const controls = []
    const center = [1740294.4412834928, 6145380.806904582]
    const zoom = 14
    const view = new ol.View({ center, zoom })
    const layers = [
      new TileLayer({ source: new OSM() }),
      new VectorLayer({ source: vectorSource })
    ]
    new ol.Map({ target, controls, layers, view })
  }, [])

  return <div id='map' className='map fullscreen'></div>
}