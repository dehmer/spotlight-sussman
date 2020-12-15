import * as R from 'ramda'
import { index, entry } from '../model/search-index'

const tag = s => {
  if (s.length < 2) return ''
  return `+tags:${s.substring(1)}`
}

const scope = s => {
  if (s.length < 2) return ''
  return `+scope:${s.substring(1)}`
}

const term = R.cond([
  [R.startsWith('#'), tag],
  [R.startsWith('@'), scope],
  [R.identity, s => `+text:${s}*`],
  [R.T, R.always('')]
])

const terms = value =>
  (value || '')
    .split(' ')
    .filter(R.identity)
    .map(term)
    .join(' ')

const search = R.tryCatch(terms => {
  if (!terms.trim()) return []
  else return index.search(terms.trim())
}, R.always([]))

const limit = R.identity /* no limits */
const refs = R.map(({ ref }) => entry(ref))
export default R.compose(refs, limit, search, terms)
