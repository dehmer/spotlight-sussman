import * as R from 'ramda'
import { DragBox } from 'ol/interaction'
import { platformModifierKeyOnly } from 'ol/events/condition'
import selection from '../../selection'

export default sources => {

  // Note: DragBox is not a selection interaction per se.
  // I.e. it does not manage selected features automatically.
  const interaction = new DragBox({
    condition: platformModifierKeyOnly
  })

  interaction.on('boxend', () => {

    // NOTE: Map rotation is not supported, yet.
    // See original source for implementation:
    // https://openlayers.org/en/latest/examples/box-selection.html

    // Collect features intersecting extent.
    // Note: VectorSource.getFeaturesInExtent(extent) yields unexpected results.

    // TODO: getFeaturesInExtent
    const features = []
    const extent = interaction.getGeometry().getExtent()
    sources.forEach(source => {
      source.forEachFeatureIntersectingExtent(extent, feature => {
        features.push(feature)
      })
    })

    // Toggle selections:
    const isSelected = feature => selection.isSelected(feature.getId())
    const [removals, additions] = R.partition(isSelected)(features)
    selection.deselect(removals.map(feature => feature.getId()))
    selection.select(additions.map(feature => feature.getId()))
  })

  return interaction
}
