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

  const cardrefs = result.reduce((acc, value) => {
    acc[value.key] = React.createRef()
    return acc
  }, {})

  const hasfocus = focus && cardrefs[focus]

  const scrollIntoView = key =>
    key &&
    cardrefs[key] &&
    cardrefs[key].current &&
    cardrefs[key].current.scrollIntoView({
      behavior: "auto",
      block: "nearest"
    })

  // key :: (element -> element) -> key -> [key]
  // Not super-efficient but seemingly fast enough:
  const key = fn => key => Object.entries(cardrefs)
    .filter(([_, ref]) => current(ref) === fn(current(cardrefs[key])))
    .map(([key]) => key)

  React.useEffect(() => {
    evented.on(({ type, result }) => {
      if (type !== 'search-result.changed') return
      setResult(result)
    })
  }, [])

  const updateFocus = succ => succ(focus).forEach(focus => {
    scrollIntoView(focus)
    setFocus(focus)
  })

  const keyHandlers = {
    ArrowDown: () => updateFocus(hasfocus ? key(next) : R.always([result[0].key])),
    ArrowUp: () => updateFocus(hasfocus ? key(previous) : R.always([]))
  }

  const handleKeyDown = event => (keyHandlers[event.code] || R.always({}))(event)

  return (
    <div
      className="spotlight panel"
      tabIndex='0'
      onKeyDown={handleKeyDown}
    >
      <Search/>
      <CardList>
        {
          result.map((props, index) => {
            return <Card
              ref={cardrefs[props.key]}
              focus={focus === props.key}
              {...props}
            />
          })
        }
      </CardList>
    </div>
  )
}
