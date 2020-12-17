import React from 'react'
import lunr from '../index/lunr'
import { Spotlight } from './Spotlight'
import { Toolbar } from './Toolbar'

export const PanelLayer = () => {

  // NOTE: React.useState() supports lazy initialization.
  const [provider, setProvider] = React.useState(() => lunr)

  const [filter, setFilter] = React.useState('')
  const handleChange = value => setFilter(value)

  React.useEffect(() => {
    window.addEventListener('spotlight.provider', event => {
      setProvider(() => event.detail)
      setFilter('')
    }, false)
  }, [])

  return (
    <div className='panels fullscreen'>
      <Spotlight
        provider={provider}
        filter={filter}
        handleChange={handleChange}
      />
      <Toolbar className='toolbar'></Toolbar>
    </div>
  )
}