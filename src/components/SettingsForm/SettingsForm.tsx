import type { CSSProperties } from 'react'
import { AnimationExport } from '../ExportBar/ExportBar'
import type { BackgroundExport } from '../../lib/useBackgroundExport'
import { ColorPicker } from '../ColorPicker'
import { ColorPresets } from '../ColorPresets'
import { Section } from '../Section'
import { Slider } from '../Slider'
import { Switch } from '../Switch'
import type { HueName } from '../../lib/palettes'
import { GROUP_ANIMATION, SLIDERS, type Settings } from '../../lib/settings'
import './SettingsForm.css'

type Props = {
  exportControls: BackgroundExport
  settings: Settings
  onChange: (patch: Partial<Settings>) => void
  onPreset: (name: HueName) => void
}

const GROUPS = [...new Set(SLIDERS.map((s) => s.group))]

export const SettingsForm = ({ settings, onChange, onPreset, exportControls }: Props) => (
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
        <div className={group === GROUP_ANIMATION ? `settings-form__motion${settings.animate ? ' is-open' : ''}` : undefined} inert={group === GROUP_ANIMATION && !settings.animate}>
        <div className="settings-form__motion-clip"><div className="settings-form__motion-content">
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
        {group === GROUP_ANIMATION && <AnimationExport controls={exportControls} />}
        </div></div></div>
      </Section>
    ))}
  </div>
)
