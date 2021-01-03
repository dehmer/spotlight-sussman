import React from 'react'
import 'ol/ol.css'
import * as ol from 'ol'
import { OSM } from 'ol/source'
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer'
import { Rotate } from 'ol/control'
import { defaultSource, selectSource } from '../model/source'
import selection from '../model/selection'
import './epsg'
import style from './style'
import { storage } from '../storage'
import select from './interaction/select'
import evented from '../evented'
import { isFeature } from '../storage/ids'

export const Map = props => {
  React.useEffect(() => {
    const target = 'map'
    const controls = [new Rotate()]

    const viewOptions = storage.getItem('session:map.view') || {
      center: [2650758.3877764223, 8019983.4523651665],
      resolution: 612,
      rotation: 0
    }

    const defaultLayer = new VectorLayer({ source: defaultSource, style: style('default') })
    const selectLayer = new VectorLayer({ source: selectSource, style: style('selected') })

    const view = new ol.View(viewOptions)
    const layers = [
      new TileLayer({ source: new OSM() }),
      defaultLayer,
      selectLayer
    ]

    const map = new ol.Map({ target, controls, layers, view })
    map.addInteraction(select())

    view.on('change', ({ target: view }) => {
      // TODO: throttle
      storage.setItem({
        id: 'session:map.view',
        center: view.getCenter(),
        resolution: view.getResolution(),
        rotation: view.getRotation()
      })
    })

    map.on('click', () => selection.deselect())
    evented.on(event => {
      if (event.type !== 'selected' && event.type !== 'deselected')  return
      const selected = selection.selected(isFeature)
      defaultLayer.setOpacity(selected.length ? 0.35 : 1)
    })
  }, [])

  return <div id='map' className='map fullscreen'></div>
}