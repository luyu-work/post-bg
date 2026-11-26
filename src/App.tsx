import { useCallback, useMemo, useRef, useState } from 'react'
import { ExportBar } from './components/ExportBar/ExportBar'
import type { ExportSource } from './lib/export'
import { useBackgroundExport } from './lib/useBackgroundExport'
import { DiceButton } from './components/DiceButton'
import { ResetButton } from './components/ResetButton'
import { SettingsButton } from './components/SettingsButton'
import { SettingsForm } from './components/SettingsForm'
import { SettingsPanel } from './components/SettingsPanel'
import { SquaresGrid } from './components/SquaresGrid'
import { customPalettes, getAccent, getPalettes, type HueName } from './lib/palettes'
import { useSettings } from './lib/settings'
import './App.css'

export const App = () => {
  const exportRef = useRef<ExportSource | null>(null)
  const exportControls = useBackgroundExport(exportRef)
  const { settings, update, reset } = useSettings()
  const [panelOpen, setPanelOpen] = useState(false)
  const [shuffle, setShuffle] = useState(0)
  // форма собирается заново при каждом открытии, разделы снова закрыты, кроме цвета
  const [openCount, setOpenCount] = useState(0)
  const closePanel = useCallback(() => setPanelOpen(false), [])
  const togglePanel = () => {
    if (!panelOpen) setOpenCount((n) => n + 1)
    setPanelOpen(!panelOpen)
  }

  // пресет это готовая палитра, свой цвет собирает палитру из выбранного
  const { preset, color } = settings
  const palettes = useMemo(() => (preset === 'custom' ? customPalettes(color) : getPalettes(preset)), [preset, color])

  // новая случайная раскладка пятен и шума, настройки не меняются
  const shuffleScene = () => setShuffle((s) => s + 1)

  // выбор пресета тоже генерирует новую раскладку
  const selectPreset = (name: HueName) => {
    update({ preset: name, color: getAccent(name) })
    shuffleScene()
  }

  return (
    <>
      <SquaresGrid exportRef={exportRef} palettes={palettes} alpha={settings.alpha} params={settings} shuffle={shuffle} animate={settings.animate && exportControls.busy !== 'video'} />
      <div className={`app__controls${panelOpen ? ' app__controls--shifted' : ''}`}>
        <SettingsButton expanded={panelOpen} onClick={togglePanel} />
        <ResetButton visible={panelOpen} onClick={reset} />
        <DiceButton visible={panelOpen} onClick={shuffleScene} />
      </div>
      <SettingsPanel open={panelOpen} onClose={closePanel} color={settings.color}>
        <SettingsForm key={openCount} settings={settings} onChange={update} onPreset={selectPreset} exportControls={exportControls} />
        <ExportBar controls={exportControls} />
      </SettingsPanel>
    </>
  )
}
