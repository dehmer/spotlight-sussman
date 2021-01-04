import React from 'react'
import 'ol/ol.css'
import * as ol from 'ol'
import { OSM } from 'ol/source'
import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer'
import VectorSource from 'ol/source/Vector'
import { Rotate } from 'ol/control'
import { Fill, Stroke, Circle, Style } from 'ol/style';
import { features, selectedFeatures } from '../model/source'
import { highlightedFeatures } from '../storage/action'
import './epsg'
import style from './style'
import { storage } from '../storage'
import select from './interaction/select'
import evented from '../evented'

export const Map = props => {
  React.useEffect(() => {
    const target = 'map'
    const controls = [new Rotate()]

    const viewOptions = storage.getItem('session:map.view') || {
      center: [2650758.3877764223, 8019983.4523651665],
      resolution: 612,
      rotation: 0
    }


    const fill = new Fill({ color: 'rgba(255,50,50,0.4)' })
    const stroke = new Stroke({ color: 'black', width: 1.25 })
    const highlightStyles = [
      new Style({
        image: new Circle({ fill: fill, stroke: stroke, radius: 50 }),
        fill: fill,
        stroke: stroke
      })
    ]

    const defaultLayer = new VectorLayer({ source: new VectorSource({ features }), style: style('default') })
    const selectLayer = new VectorLayer({ source: new VectorSource({ features: selectedFeatures }), style: style('selected') })
    const highlightLayer = new VectorLayer({
      source: new VectorSource({ features: highlightedFeatures }) ,
      style: highlightStyles
    })

    const view = new ol.View(viewOptions)
    const layers = [
      new TileLayer({ source: new OSM() }),
      defaultLayer,
      selectLayer,
      highlightLayer
    ]

    const map = new ol.Map({ target, controls, layers, view })
    map.addInteraction(select(selectedFeatures))

    view.on('change', ({ target: view }) => {
      // TODO: throttle
      storage.setItem({
        id: 'session:map.view',
        center: view.getCenter(),
        resolution: view.getResolution(),
        rotation: view.getRotation()
      })
    })

    evented.on(event => {
      if (event.type === 'selected' || event.type === 'deselected') {
        defaultLayer.setOpacity(selectedFeatures.getLength() ? 0.35 : 1)
      } else if (event.type === 'map.panto') {
        view.animate({ center: event.center, duration: 500 })
      }
    })
  }, [])

  return <div id='map' className='map fullscreen'></div>
}