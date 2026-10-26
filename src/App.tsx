import { useState } from 'react'
import { SelectColor } from './components/SelectColor'
import { SquaresGrid } from './components/SquaresGrid'
import { HUE_OPTIONS, type HueName } from './lib/palettes'
import './App.css'

export const App = () => {
  const [hue, setHue] = useState<HueName>('green')

  return (
    <>
      <SquaresGrid hue={hue} />
      <div className="app__select">
        <SelectColor options={HUE_OPTIONS} value={hue} onChange={setHue} />
      </div>
    </>
  )
}
