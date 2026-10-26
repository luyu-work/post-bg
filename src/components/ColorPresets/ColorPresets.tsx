import { getAccent, HUE_OPTIONS, type HueName } from '../../lib/palettes'
import type { Preset } from '../../lib/settings'
import './ColorPresets.css'

type Props = {
  value: Preset
  onSelect: (name: HueName) => void
}

export const ColorPresets = ({ value, onSelect }: Props) => (
  <div className="color-presets">
    {HUE_OPTIONS.map((o) => (
      <button
        key={o.value}
        type="button"
        className={`color-presets__item${o.value === value ? ' is-selected' : ''}`}
        style={{ background: getAccent(o.value) }}
        title={o.label}
        aria-label={o.label}
        aria-pressed={o.value === value}
        onClick={() => onSelect(o.value)}
      />
    ))}
  </div>
)
