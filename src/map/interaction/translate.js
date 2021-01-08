import { Translate } from 'ol/interaction'

const hitTolerance = 3

export default features => {

  const interaction = new Translate({
    hitTolerance,
    features
  })

  return interaction
}