const customEvent = detail => new CustomEvent('evented', { detail })

var proxies = []

export default {
  emit: event => window.dispatchEvent(customEvent(event)),
  on: handler => {
    const proxy = event => handler(event.detail)
    proxies.push([handler, proxy])
    window.addEventListener('evented', proxy)
  },
  off: handler => {
    const proxy = proxies.find(x => x[0] === handler)
    proxies = proxies.filter(x => x[0] !== handler)
    window.removeEventListener('evented', proxy[1])
  }
}
