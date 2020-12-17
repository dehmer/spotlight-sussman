import React from 'react'
import { Card } from './Card'

export const CardList = ({ entries }) => (
  <div className='list-container'>
    <ul className='list'>
      { entries.map(entry => <Card {...entry}/>) }
    </ul>
  </div>
)
