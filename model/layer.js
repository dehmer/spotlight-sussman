import { url } from './symbol'

export const layers = {}

const readFile = file => new Promise((resolve, reject) => {
  const reader = new FileReader()
  const filename = file => file.name.substring(0, file.name.indexOf('.'))
  reader.onload = (({ target }) => {
    if (target.error) reject(target.error)
    else resolve({ name: filename(file), json: JSON.parse(target.result) })
  })
  reader.readAsText(file)
})

export const load = files => {
  Promise.all(files.map(readFile))
    .then(files => files.forEach(file => layers[file.name] = file.json))
    .then(() => window.dispatchEvent(new CustomEvent('model.changed')))
}

export const documents = () => {
  return Object.entries(layers).reduce((acc, [name, layer]) => {
    acc.push({
      id: `layer:${name}`,
      scope: 'layer',
      text:  name
    })
    return layer.features.reduce((acc, feature, index) => {
      acc.push({
        id: `feature:${name}:${index}`,
        scope: 'feature',
        tags: [name],
        text: feature.properties.t
      })
      return acc
    }, acc)
  }, [])
}

export const entry = ref => {
  const [scope, name, index] = ref.split(':')
  switch (scope) {
    case 'layer': return {
      key: ref,
      title: ref.split(':')[1],
      tags: ['LAYER']
    }
    case 'feature': return {
      key: ref,
      title: layers[name].features[index].properties.t,
      tags: ['FEATURE', name.toUpperCase()],
      url: () => url(layers[name].features[index].properties.sidc)
    }
  }
}