import * as R from 'ramda'
import { index, entry } from '../model/search-index'

const term = R.cond([
  [R.startsWith('#'), s => `+tags:${s.substring(1)}*`],
  [R.startsWith('@'), s => `+scope:${s.substring(1)}`],
  [R.identity, s => `+text:${s}*`],
  [R.T, R.always('')]
])

const terms = value =>
  (value || '')
    .split(' ')
    .filter(R.identity)
    .map(term)
    .join(' ')

const search = R.tryCatch(terms => index.search(terms), R.always([]))
const limit = R.identity /* no limits */
const refs = R.map(({ ref }) => entry(ref))
export default R.compose(refs, limit, search, terms)
