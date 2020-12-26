import React from 'react'
import ReactDOM from 'react-dom'
import Mousetrap from 'mousetrap'
import { App } from './App'
import { loadLayerFiles } from './model/io'
import { pushLayers } from './model/layers'
import './selection'

Mousetrap.bind('command+f', event => {
  console.log('[Mousetrap]', event)

  // Returning false here works the same way as jQuery's return false.
  // It prevents the default action and stops the event from bubbling up.
  return false
})

const app = document.getElementById('app')
ReactDOM.render(<App></App>, app)

// Prevent browser from intercepting file:
app.addEventListener('dragover', event => {
  event.preventDefault()
  event.stopPropagation()
}, false)

app.addEventListener('drop', async event => {
  event.preventDefault()
  event.stopPropagation()
  const layers = await loadLayerFiles([...event.dataTransfer.files])
  pushLayers(layers)
}, false)
