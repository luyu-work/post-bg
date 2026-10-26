import type { CSSProperties } from 'react'
import { ColorPicker } from '../ColorPicker'
import { ColorPresets } from '../ColorPresets'
import { Section } from '../Section'
import { Slider } from '../Slider'
import { Switch } from '../Switch'
import type { HueName } from '../../lib/palettes'
import { GROUP_ANIMATION, SLIDERS, type Settings } from '../../lib/settings'
import './SettingsForm.css'

type Props = {
  settings: Settings
  onChange: (patch: Partial<Settings>) => void
  onPreset: (name: HueName) => void
}

const GROUPS = [...new Set(SLIDERS.map((s) => s.group))]

export const SettingsForm = ({ settings, onChange, onPreset }: Props) => (
  <div className="settings-form" style={{ '--accent': settings.color } as CSSProperties}>
    <Section title="Цвет" defaultOpen>
      <ColorPresets value={settings.preset} onSelect={onPreset} />
      <ColorPicker
        color={settings.color}
        alpha={settings.alpha}
        onColor={(color) => onChange({ preset: 'custom', color })}
        onAlpha={(alpha) => onChange({ alpha })}
      />
    </Section>

    {GROUPS.map((group) => (
      <Section key={group} title={group}>
        {group === GROUP_ANIMATION && (
          <Switch label="Включить анимацию" checked={settings.animate} onChange={(animate) => onChange({ animate })} />
        )}
        {/* пока анимация выключена, в разделе виден только свитч */}
        {SLIDERS.filter((s) => s.group === group && (group !== GROUP_ANIMATION || settings.animate)).map((s) => (
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
      </Section>
    ))}
  </div>
)
