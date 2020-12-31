import * as R from 'ramda'

/* eslint-disable */
// XMLHttpRequest.readyState.
const UNSENT           = 0 // Client has been created. open() not called yet.
const OPENED           = 1 // open() has been called.
const HEADERS_RECEIVED = 2 // send() has been called, and headers and status are available.
const LOADING          = 3 // Downloading; responseText holds partial data.
const DONE             = 4 // The operation is complete.
/* eslint-enable */


const options = {
  formal: 'json',
  dedupe: 1,
  polygon_geojson: 1
}

const tags = entry => [entry.class, entry.type]
  .filter(R.identity)
  .map(label => `SYSTEM:${label}:NONE`)

const properties = entry => {
  const parts = entry.display_name.split(', ')
  return {
    id: `osm:${entry.osm_id}`,
    title: R.head(parts),
    description: R.tail(parts).join(', '),
    tags: ['SCOPE:PLACE:NONE', ...tags(entry)].join(' ')
  }
}

export const searchOSM = (query, callback) => {
  const { value, mode } = query
  if (!value) callback([])
  if (mode !== 'enter') return

  const xhr = new XMLHttpRequest()
  xhr.addEventListener('readystatechange', event => {
    const request = event.target

    switch (request.readyState) {
      case DONE: {
        try {
          const entries = JSON.parse(request.responseText)
          callback(entries.map(properties))
        } catch (err) {
          console.error('[nominatim]', err)
        }
      }
    }
  })

  const params = Object.entries(options)
    .reduce((acc, [key, value]) => acc.concat([`${key}=${value}`]), ['format=json'])
    .join('&')

  const url = `https://nominatim.openstreetmap.org/search/${value}?${params}`
  const async = true
  xhr.open('GET', url, async)
  xhr.setRequestHeader('Accept-Language', 'de')
  xhr.send()
}
