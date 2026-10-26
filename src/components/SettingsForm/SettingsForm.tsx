import type { CSSProperties } from 'react'
import { ColorPicker } from '../ColorPicker'
import { ColorPresets } from '../ColorPresets'
import { Slider } from '../Slider'
import type { HueName } from '../../lib/palettes'
import { SLIDERS, type Settings } from '../../lib/settings'
import './SettingsForm.css'

type Props = {
  settings: Settings
  onChange: (patch: Partial<Settings>) => void
  onPreset: (name: HueName) => void
}

const GROUPS = [...new Set(SLIDERS.map((s) => s.group))]

export const SettingsForm = ({ settings, onChange, onPreset }: Props) => (
  <div className="settings-form" style={{ '--accent': settings.color } as CSSProperties}>
    <section className="settings-form__group">
      <h3 className="settings-form__title">Цвет</h3>
      <ColorPresets value={settings.preset} onSelect={onPreset} />
      <ColorPicker
        color={settings.color}
        alpha={settings.alpha}
        onColor={(color) => onChange({ preset: 'custom', color })}
        onAlpha={(alpha) => onChange({ alpha })}
      />
    </section>

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
