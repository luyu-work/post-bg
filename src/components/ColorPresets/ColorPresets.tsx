import { useState } from 'react'
import { getAccent, HUE_OPTIONS, type HueName } from '../../lib/palettes'
import type { Preset } from '../../lib/settings'
import { Hint } from '../Hint'
import './ColorPresets.css'

type Props = {
  value: Preset
  onSelect: (name: HueName) => void
}

export const ColorPresets = ({ value, onSelect }: Props) => {
  const [hovered, setHovered] = useState<HueName | null>(null)

  return (
    <div className="color-presets">
      {HUE_OPTIONS.map((o) => (
        <div key={o.value} className="color-presets__cell">
          {hovered === o.value && (
            <span className="color-presets__hint">
              <Hint>{o.hint}</Hint>
            </span>
          )}
          <button
            type="button"
            className={`color-presets__item${o.value === value ? ' is-selected' : ''}`}
            style={{ background: getAccent(o.value) }}
            aria-label={o.label}
            aria-pressed={o.value === value}
            onClick={() => onSelect(o.value)}
            onPointerEnter={() => setHovered(o.value)}
            onPointerLeave={() => setHovered(null)}
            onFocus={() => setHovered(o.value)}
            onBlur={() => setHovered(null)}
          />
        </div>
      ))}
    </div>
  )
}
