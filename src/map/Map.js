import React from 'react'
import 'ol/ol.css'
import * as ol from 'ol'
import { OSM } from 'ol/source'
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer'
import { source } from '../storage/command'
import './epsg'
import style from './style'

export const Map = props => {
  React.useEffect(() => {
    const target = 'map'
    const controls = []
    // const [center, zoom] = [[1740294.4412834928, 6145380.806904582], 14] // St. Pölten
    const [center, zoom] = [[2650758.3877764223, 8019983.4523651665], 8] // Estonia
    const view = new ol.View({ center, zoom })
    const layers = [
      new TileLayer({ source: new OSM() }),
      new VectorLayer({ source, style: style('default') })
    ]
    new ol.Map({ target, controls, layers, view })
  }, [])

  return <div id='map' className='map fullscreen'></div>
}