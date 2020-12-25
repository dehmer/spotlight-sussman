import React from 'react'

export const Avatar = ({ url }) => {
  return (
    <div className='card-avatar'>
      <img className='avatar-image' src={url}></img>
    </div>
  )
}
