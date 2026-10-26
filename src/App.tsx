import { useCallback, useState } from 'react'
import { SelectColor } from './components/SelectColor'
import { SettingsButton } from './components/SettingsButton'
import { SettingsForm } from './components/SettingsForm'
import { SettingsPanel } from './components/SettingsPanel'
import { SquaresGrid } from './components/SquaresGrid'
import { HUE_OPTIONS, type HueName } from './lib/palettes'
import { useSettings } from './lib/settings'
import './App.css'

export const App = () => {
  const { settings, update, reset } = useSettings()
  const [panelOpen, setPanelOpen] = useState(false)
  const [shuffle, setShuffle] = useState(0)
  const closePanel = useCallback(() => setPanelOpen(false), [])
  const reshuffle = useCallback(() => setShuffle((s) => s + 1), [])

  // смена цвета генерирует новую раскладку, как и раньше
  const changeHue = (hue: HueName) => {
    update({ hue })
    reshuffle()
  }

  return (
    <>
      <SquaresGrid hue={settings.hue} params={settings} shuffle={shuffle} />
      <div className={`app__select${panelOpen ? ' app__select--shifted' : ''}`}>
        <SelectColor options={HUE_OPTIONS} value={settings.hue} onChange={changeHue} />
        <SettingsButton expanded={panelOpen} onClick={() => setPanelOpen((v) => !v)} />
      </div>
      <SettingsPanel open={panelOpen} onClose={closePanel}>
        <SettingsForm settings={settings} onChange={update} onShuffle={reshuffle} onReset={reset} />
      </SettingsPanel>
    </>
  )
}
