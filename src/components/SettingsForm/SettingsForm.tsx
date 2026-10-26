import type { CSSProperties } from 'react'
import { Slider } from '../Slider'
import { getAccent } from '../../lib/palettes'
import { SLIDERS, type Settings } from '../../lib/settings'
import './SettingsForm.css'

type Props = {
  settings: Settings
  onChange: (patch: Partial<Settings>) => void
  onShuffle: () => void
  onReset: () => void
}

const GROUPS = [...new Set(SLIDERS.map((s) => s.group))]

export const SettingsForm = ({ settings, onChange, onShuffle, onReset }: Props) => (
  <div className="settings-form" style={{ '--accent': getAccent(settings.hue) } as CSSProperties}>
    <div className="settings-form__actions">
      <button type="button" className="settings-form__button" onClick={onShuffle}>
        Перемешать
      </button>
      <button type="button" className="settings-form__button" onClick={onReset}>
        Сбросить
      </button>
    </div>

    {GROUPS.map((group) => (
      <section key={group} className="settings-form__group">
        <h3 className="settings-form__title">{group}</h3>
        {SLIDERS.filter((s) => s.group === group).map((s) => (
          <Slider
            key={s.key}
            label={s.label}
            value={settings[s.key]}
            min={s.min}
            max={s.max}
            step={s.step}
            onChange={(v) => onChange({ [s.key]: v })}
          />
        ))}
      </section>
    ))}
  </div>
)
