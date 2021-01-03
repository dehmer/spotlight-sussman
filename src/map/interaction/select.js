import { Select } from 'ol/interaction'
import { click, platformModifierKeyOnly } from 'ol/events/condition'
import style from '../style'

const hitTolerance = 3
const noAltKey = ({ originalEvent }) => originalEvent.altKey !== true // macOS: option key
const conjunction = (...ps) => v => ps.reduce((acc, p) => acc && p(v), true)


export default features => {

  const interaction = new Select({
    hitTolerance,

    // Operates on all layers including selection (necessary to detect toggles).
    // layers: [layer, selectionLayer],
    features,
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

  return interaction
}
