import { useCallback, useMemo, useState } from 'react'
import { ResetButton } from './components/ResetButton'
import { SettingsButton } from './components/SettingsButton'
import { SettingsForm } from './components/SettingsForm'
import { SettingsPanel } from './components/SettingsPanel'
import { SquaresGrid } from './components/SquaresGrid'
import { customPalettes, getAccent, getPalettes, type HueName } from './lib/palettes'
import { useSettings } from './lib/settings'
import './App.css'

export const App = () => {
  const { settings, update, reset } = useSettings()
  const [panelOpen, setPanelOpen] = useState(false)
  const [shuffle, setShuffle] = useState(0)
  const closePanel = useCallback(() => setPanelOpen(false), [])

  // пресет это готовая палитра, свой цвет собирает палитру из выбранного
  const { preset, color } = settings
  const palettes = useMemo(() => (preset === 'custom' ? customPalettes(color) : getPalettes(preset)), [preset, color])

  // выбор пресета генерирует новую раскладку, как и раньше
  const selectPreset = (name: HueName) => {
    update({ preset: name, color: getAccent(name) })
    setShuffle((s) => s + 1)
  }

  return (
    <>
      <SquaresGrid palettes={palettes} alpha={settings.alpha} params={settings} shuffle={shuffle} />
      <div className={`app__controls${panelOpen ? ' app__controls--shifted' : ''}`}>
        <SettingsButton expanded={panelOpen} onClick={() => setPanelOpen((v) => !v)} />
        <ResetButton visible={panelOpen} onClick={reset} />
      </div>
      <SettingsPanel open={panelOpen} onClose={closePanel}>
        <SettingsForm settings={settings} onChange={update} onPreset={selectPreset} />
      </SettingsPanel>
    </>
  )
}
