import React from 'react'

export const Description = React.memo(props => {
  if (!props.value) return null
  return <span className='card-description'>{props.value}</span>
})
