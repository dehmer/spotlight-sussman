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
    return acc
  }, [])
}

export const entry = ref => {
  // console.log('[Layer]', ref)
  // const layer = layers[ref]

  return {
    key: ref,
    title: ref.split(':')[1],
    tags: ['LAYER']

  }

}