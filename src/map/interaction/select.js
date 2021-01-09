import * as R from 'ramda'
import { Select } from 'ol/interaction'
import { click, platformModifierKeyOnly } from 'ol/events/condition'
import style from '../style'
import selection from '../../selection'
import emitter from '../../emitter'

const hitTolerance = 3
const noAltKey = ({ originalEvent }) => originalEvent.altKey !== true // macOS: option key
const conjunction = (...ps) => v => ps.reduce((acc, p) => acc && p(v), true)


/**
 *
 */
export default layers => {
  const sources = layers.map(layer => layer.getSource())
  const featureById = id => sources.reduce((acc, source) => {
    return acc ? acc : source.getFeatureById(id)
  }, null)

  const interaction = new Select({
    hitTolerance,
    layers,
    style: (feature, resolution) => {
      const fn = interaction.getFeatures().getLength() < 2
        ? style('selected')
        : style('multi')
      return fn(feature, resolution)
    },
    condition: conjunction(click, noAltKey),
    toggleCondition: platformModifierKeyOnly, // macOS: command
    multi: false // don't select all features under cursor at once.
  })

  interaction.on('select', () => {
    // Propagate to global selection.
    // NOTE: selected, deselected are deltas/changes.
    const ids = features => features.map(feature => feature.getId())
    selection.set(ids(interaction.getFeatures().getArray()))
  })

  // Sync selected features with external selection changes.
  emitter.on('selection', ({ selected, deselected }) => {
    const features = interaction.getFeatures()
    const missing = feature => !features.getArray().includes(feature)

    deselected.map(featureById)
      .filter(R.identity)
      .forEach(feature => features.remove(feature))

    selected.map(featureById)
      .filter(R.identity)
      .filter(missing)
      .forEach(feature => features.push(feature))
  })

  return interaction
}
