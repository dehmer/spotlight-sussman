import * as R from 'ramda'
import { Style, Icon } from 'ol/style'
import ms from 'milsymbol'
import { defaultStyle, styleFactory } from './default-style'

const MODIFIERS = {
  c: 'quantity',
  f: 'reinforcedReduced',
  g: 'staffComments',
  h: 'additionalInformation',
  m: 'higherFormation',
  q: 'direction',
  t: 'uniqueDesignation',
  v: 'type',
  z: 'speed',
  aa: 'specialHeadquarters',
  w: 'dtg'
}

const modifiers = properties => Object.entries(properties)
  .filter(([key, value]) => MODIFIERS[key] && value)
  .filter(([key, value]) => {
    if (key === 't' && value === '[NO FORMALABBREVIATEDNAME]') return false
    if (key === 't' && value === 'Untitled') return false
    if (key === 'v' && value === 'Not otherwise specified') return false
    if (key === 'v' && value === 'Not Specified') return false
    return true
  })
  .reduce((acc, [key, value]) => R.tap(acc => (acc[MODIFIERS[key]] = value), acc), {})


const icon = (symbol, resolution) => {
  const anchor = [symbol.getAnchor().x, symbol.getAnchor().y]
  const imgSize = size => [Math.floor(size.width), Math.floor(size.height)]
  return new Icon({
    anchor,
    scale: 0.3,
    anchorXUnits: 'pixels',
    anchorYUnits: 'pixels',
    imgSize: imgSize(symbol.getSize()),
    img: symbol.asCanvas()
  })
}

// Point geometry, aka symbol.
export const symbolStyle = mode => (feature, resolution) => {
  const factory = styleFactory({ mode, feature, resolution })(R.identity)
  const { sidc, ...properties } = feature.getProperties()
  const infoFields = mode === 'selected' ||
    mode === 'multi' ||
    factory.showLabels()

  const outlineWidth = mode === 'selected' ? 8 : 4
  const symbol = new ms.Symbol(sidc, {
    ...modifiers(properties),
    outlineWidth,
    outlineColor: 'white',
    infoFields
  })

  return symbol.isValid()
    ? [
      new Style({ image: icon(symbol, resolution) }),
      mode === 'multi' ? factory.handles(feature.getGeometry()) : []
    ].flat()
    : defaultStyle(feature)
}
