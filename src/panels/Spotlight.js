import React from 'react'
import * as R from 'ramda'
import { CardList } from '../components/CardList'
import { Card } from '../components/Card'
import evented from '../evented'

const Search = () => {
  const [value, setValue] = React.useState('')

  React.useEffect(() => {
    evented.on(event => {
      if (event.type !== 'search-scope.changed') return
      setValue('')
    })
  })

  const handleChange = ({ target }) => {
    setValue(target.value)
    evented.emit({ type: 'search-filter.changed', value: target.value })
  }

  return (
    <div className='search-conainer'>
      <input
        className='search-input'
        placeholder='Spotlight Search'
        value={value}
        onChange={handleChange}
      />
    </div>
  )
}

const current = ref => ref && ref.current
const next = R.prop('nextSibling')
const previous = R.prop('previousSibling')

const callAction = (action, target) =>
  target &&
  target.actions &&
  target.actions[action] &&
  target.actions[action].call()

export const Spotlight = () => {
  // TODO: make multi-select optional (e.g. palette uses single-select)
  const [result, setResult] = React.useState([])
  const [focus, setFocus] = React.useState()
  const [selection, setSelection] = React.useState([])

  const cardrefs = result.reduce((acc, value) => {
    acc[value.key] = React.createRef()
    return acc
  }, {})

  const scrollIntoView = key =>
    cardrefs[key] &&
    cardrefs[key].current &&
    cardrefs[key].current.scrollIntoView({
      behavior: "auto",
      block: "nearest"
    })

  const key = fn => key => {
    const sameRef = ([_, ref]) => current(ref) === fn(current(cardrefs[key]))
    const entry = Object.entries(cardrefs).find(sameRef)
    return entry ? entry[0] : null
  }

  React.useEffect(() => {
    evented.on(({ type, result }) => {
      if (type !== 'search-result.changed') return
      setResult(result)
    })
  }, [])

  const updateFocus = (succ, shiftKey) => {
    const key = succ(focus)
    scrollIntoView(key)

    setSelection(shiftKey
      ? selected(key)
        ? [...toggleSelection(focus), key]
        : [...selection, focus, key]
      : []
    )

    setFocus(key)
  }

  const selected = key => selection.includes(key)
  const toggleSelection = key => key
    ? selected(key)
      ? selection.filter(x => x !== key)
      : [...selection, key]
    : selection

  const handleKeyDown = event => {
    const focused = focus && cardrefs[focus]
    const first = R.always(result.length ? result[0].key : null)
    const last = R.always(result.length ? result[result.length - 1].key : null)

    const keyHandlers = {
      ArrowDown: ({ shiftKey }) => {
        const succ = focused ? key(next) : first
        updateFocus(succ, shiftKey)
      },
      ArrowUp: ({ shiftKey }) => {
        const succ = focused ? key(previous) : last
        updateFocus(succ, shiftKey)
      }
    }

    ;(keyHandlers[event.code] || R.always({}))(event)
  }

  const card = props => <Card
    ref={cardrefs[props.key]}
    focus={focus === props.key}
    selected={selection.includes(props.key)}
    {...props}
  />

  return (
    <div
      className="spotlight panel"
      tabIndex='0'
      onKeyDown={handleKeyDown}
    >
      <Search/>
      <CardList>{result.map(card)}</CardList>
    </div>
  )
}
