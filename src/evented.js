const customEvent = detail => new CustomEvent('evented', { detail })

export default {
  // TODO: off
  emit: event => window.dispatchEvent(customEvent(event)),
  on: handler => window.addEventListener('evented', event => {
    handler(event.detail)
  }, false)
}
