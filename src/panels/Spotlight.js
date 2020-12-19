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

export const Spotlight = () => {
  // TODO: make multi-select optional (e.g. palette uses single-select)
  const [result, setResult] = React.useState([])
  const key = index => result[index].key

  // indexes :: { focus: number, selection: [number] }
  const [indexes, setIndexes] = React.useState({
    focus: undefined,
    selection: []
  })

  React.useEffect(() => {
    evented.on(({ type, result }) => {
      if (type !== 'search-result.changed') return
      setResult(result)
      setIndexes({ focus: undefined, selection: [] })
    })
  }, [])

  const refs = result.reduce((acc, value) => {
    acc[value.key] = React.createRef()
    return acc
  }, {})


  const updateIndexes = (index, { shift, meta }) => {
    const focus = index(indexes.focus)
    if (!meta && focus === indexes.focus) return

    refs[key(focus)].current.scrollIntoView({
      behavior: "auto",
      block: "nearest"
    })

    const selected = index => indexes.selection.includes(index)
    const toggleSelection = index => selected(index)
      ? indexes.selection.filter(x => x !== index)
      : [...indexes.selection, index]

    // Meta has precedence over Shift.
    if (meta) return setIndexes({ focus, selection: toggleSelection(focus) })
    if (shift) {
      if (selected(focus)) setIndexes({ focus, selection: toggleSelection(indexes.focus) })
      else setIndexes({ focus, selection: toggleSelection(focus) })
    } else setIndexes({ focus, selection: [focus] })
  }

  const selectAll = ({ meta }) => {
    if (!meta) return
    setIndexes({ focus: indexes.focus, selection: R.range(0, result.length) })
  }

  const length = result.length
  const inc = index => index >= 0 ? Math.min(length - 1, index + 1) : 0
  const dec = index => index ? index - 1 : index

  // TODO: decent/ascent to/from details on metaKey
  const keyHandlers = {
    ArrowDown: ({ shiftKey: shift }) => updateIndexes(inc, { shift }),
    ArrowUp: ({ shiftKey: shift }) => updateIndexes(dec, { shift }),
    PageDown: () => {},
    PageUp: () => {},
    KeyA: ({ metaKey: meta }) => selectAll({ meta }),
    Escape: event => console.log('</Spotlight> Escape'),
  }

  const handleKeyDown = event => {
    // console.log(event)
    ;(keyHandlers[event.code] || R.always({}))(event)
  }

  const handleClick = index => ({ shiftKey: shift, metaKey: meta }) => {
    updateIndexes(R.always(index), { shift, meta })
  }

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
              ref={refs[props.key]}
              {...props}
              selected={indexes.selection.includes(index)}
              onClick={handleClick(index)}
            />
          })
        }
      </CardList>
    </div>
  )
}
