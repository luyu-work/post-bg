import { useCallback, useState } from 'react'
import { SelectColor } from './components/SelectColor'
import { SettingsButton } from './components/SettingsButton'
import { SettingsPanel } from './components/SettingsPanel'
import { SquaresGrid } from './components/SquaresGrid'
import { HUE_OPTIONS } from './lib/palettes'
import { useSettings } from './lib/settings'
import './App.css'

export const App = () => {
  const [settings, update] = useSettings()
  const [panelOpen, setPanelOpen] = useState(false)
  const closePanel = useCallback(() => setPanelOpen(false), [])

  return (
    <>
      <SquaresGrid hue={settings.hue} />
      <div className={`app__select${panelOpen ? ' app__select--shifted' : ''}`}>
        <SelectColor options={HUE_OPTIONS} value={settings.hue} onChange={(hue) => update({ hue })} />
        <SettingsButton expanded={panelOpen} onClick={() => setPanelOpen((v) => !v)} />
      </div>
      <SettingsPanel open={panelOpen} onClose={closePanel} />
    </>
  )
}
