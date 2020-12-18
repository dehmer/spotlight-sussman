import React from 'react'

export const CardList = ({ children }) => (
  <div className='list-container'>
    <ul className='list'>
      { children }
    </ul>
  </div>
)
