import { SelectColor } from './components/SelectColor'
import { SettingsButton } from './components/SettingsButton'
import { SquaresGrid } from './components/SquaresGrid'
import { HUE_OPTIONS } from './lib/palettes'
import { useSettings } from './lib/settings'
import './App.css'

export const App = () => {
  const [settings, update] = useSettings()

  return (
    <>
      <SquaresGrid hue={settings.hue} />
      <div className="app__select">
        <SelectColor options={HUE_OPTIONS} value={settings.hue} onChange={(hue) => update({ hue })} />
        <SettingsButton />
      </div>
    </>
  )
}
