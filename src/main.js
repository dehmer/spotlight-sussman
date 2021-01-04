import React from 'react'
import ReactDOM from 'react-dom'
import Mousetrap from 'mousetrap'
import { App } from './App'
import { loadLayerFiles } from './model/io'
import './model/selection'
import './storage/command'
import './storage/action'
import evented from './evented'

Mousetrap.bind('command+1', () => {
  evented.emit({ type: 'command.search.scope.all' })
  return false
})

Mousetrap.bind('command+2', () => {
  evented.emit({ type: 'command.search.scope.layer' })
  return false
})

Mousetrap.bind('command+3', () => {
  evented.emit({ type: 'command.search.scope.feature' })
  return false
})

Mousetrap.bind('command+4', () => {
  evented.emit({ type: 'command.search.scope.symbol' })
  return false
})

Mousetrap.bind('command+5', () => {
  evented.emit({ type: 'command.search.scope.group' })
  return false
})

Mousetrap.bind('command+6', () => {
  evented.emit({ type: 'command.search.scope.place' })
  return false
})

Mousetrap.bind('f1', () => {
  evented.emit({ type: 'command.storage.bookmark' })
  return false
})

Mousetrap.bind('f2', () => {
  console.log('[Mousetrap] group')
  return false
})

Mousetrap.bind('f3', () => {
  evented.emit({ type: 'command.storage.snapshot' })
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
  evented.emit({ type: 'command.storage.addlayers', layers })
}, false)
