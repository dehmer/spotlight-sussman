import React from 'react'
import 'ol/ol.css'
import * as ol from 'ol'
import OSM from 'ol/source/OSM'
import { Tile as TileLayer } from 'ol/layer'
import { Spotlight } from './spotlight'
import { Toolbar } from './toolbar'
import lunr from './index/lunr'

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

  // NOTE: React.useState() supports lazy initialization.
  const [provider, setProvider] = React.useState(() => lunr)

  const [filter, setFilter] = React.useState('')
  const handleChange = value => setFilter(value)

  React.useEffect(() => {
    window.addEventListener('spotlight.provider', event => {
      setProvider(() => event.detail)
      setFilter('')
    }, false)
  }, [])


  return (
    <>
      <Spotlight
        provider={provider}
        filter={filter}
        handleChange={handleChange}
      />
      <Toolbar className='toolbar'></Toolbar>
    </>
  )
}
