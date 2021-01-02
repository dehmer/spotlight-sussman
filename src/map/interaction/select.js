import { Select } from 'ol/interaction'
import { click, platformModifierKeyOnly } from 'ol/events/condition'
import style from '../style'
import selection from '../../model/selection'
import { isFeature, featureId } from '../../storage/ids'

const hitTolerance = 3
const noAltKey = ({ originalEvent }) => originalEvent.altKey !== true // macOS: option key
const conjunction = (...ps) => v => ps.reduce((acc, p) => acc && p(v), true)

/**
 * select :: [ol/Feature] => unit
 * Update selection without updating collection.
 */
const select = features => {
  // Deselect others than feature:
  const removals = selection.selected(uri => !isFeature(uri))
  selection.deselect(removals)
  selection.select(features.map(featureId))
}


/**
 * deselect :: [Feature] => unit
 * Update selection without updating collection.
 */
const deselect = features =>
  selection.deselect(features.map(featureId))


export default () => {

  const interaction = new Select({
    hitTolerance,

    // Operates on all layers including selection (necessary to detect toggles).
    // layers: [layer, selectionLayer],
    // features: selectedFeatures,
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

  interaction.on('select', ({ selected, deselected }) => {
    select(selected)
    deselect(deselected)
  })

  return interaction
}