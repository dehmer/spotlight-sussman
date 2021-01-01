import React from 'react'
import 'ol/ol.css'
import * as ol from 'ol'
import { OSM } from 'ol/source'
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer'
import { Rotate } from 'ol/control'
import { source } from '../storage/vector'
import './epsg'
import style from './style'
import { storage } from '../storage'

export const Map = props => {
  React.useEffect(() => {
    const target = 'map'
    const controls = [new Rotate()]

    const viewOptions = storage.getItem('session:map.view') || {
      center: [2650758.3877764223, 8019983.4523651665],
      resolution: 612,
      rotation: 0
    }

    const view = new ol.View(viewOptions)
    const layers = [
      new TileLayer({ source: new OSM() }),
      new VectorLayer({ source, style: style('default') })
    ]
    new ol.Map({ target, controls, layers, view })

    view.on('change', ({ target: view }) => {
      // TODO: throttle
      storage.setItem({
        id: 'session:map.view',
        center: view.getCenter(),
        resolution: view.getResolution(),
        rotation: view.getRotation()
      })
    })
  }, [])

  return <div id='map' className='map fullscreen'></div>
}