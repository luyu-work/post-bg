import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { clamp, hexToRgb, hsvToRgb, parseHex, rgbToHex, rgbToHsv, type Hsv } from '../../lib/color-utils'
import { useDrag } from '../../lib/useDrag'
import './ColorPicker.css'

type Props = {
  color: string
  alpha: number
  onColor: (hex: string) => void
  onAlpha: (alpha: number) => void
}

// отступ дорожки слайдеров, чтобы ползунок не вылезал за края
const INSET = 8

export const ColorPicker = ({ color, alpha, onColor, onAlpha }: Props) => {
  // hsv хранится отдельно, иначе при нулевой насыщенности или яркости теряется оттенок
  const [hsv, setHsv] = useState<Hsv>(() => rgbToHsv(hexToRgb(color)))
  const [hexDraft, setHexDraft] = useState<string | null>(null)
  const [alphaDraft, setAlphaDraft] = useState<string | null>(null)

  const hex = rgbToHex(hsvToRgb(hsv))

  // цвет сменили снаружи, например выбрали пресет
  useEffect(() => {
    if (color.toLowerCase() !== hex) setHsv(rgbToHsv(hexToRgb(color)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color])

  const apply = (next: Hsv) => {
    setHsv(next)
    onColor(rgbToHex(hsvToRgb(next)))
  }

  const area = useDrag((x, y) => apply([hsv[0], x, 1 - y]))
  const hue = useDrag((x) => apply([x * 360, hsv[1], hsv[2]]), INSET)
  const opacity = useDrag((x) => onAlpha(Math.round(x * 100) / 100), INSET)

  // тянем иконку мышью, 1px равен 1%, как в Figma
  const scrubStart = useRef<{ x: number; value: number } | null>(null)
  const scrub = {
    onPointerDown: (e: PointerEvent<HTMLElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId)
      scrubStart.current = { x: e.clientX, value: alpha * 100 }
    },
    onPointerMove: (e: PointerEvent<HTMLElement>) => {
      const s = scrubStart.current
      if (s) onAlpha(clamp(Math.round(s.value + e.clientX - s.x), 0, 100) / 100)
    },
    onPointerUp: () => {
      scrubStart.current = null
    },
    onPointerCancel: () => {
      scrubStart.current = null
    },
  }

  const commitHex = () => {
    const parsed = hexDraft === null ? null : parseHex(hexDraft)
    if (parsed) apply(rgbToHsv(hexToRgb(parsed)))
    setHexDraft(null)
  }

  const commitAlpha = () => {
    const n = Number(alphaDraft)
    if (alphaDraft !== null && alphaDraft.trim() !== '' && Number.isFinite(n)) onAlpha(clamp(n, 0, 100) / 100)
    setAlphaDraft(null)
  }

  const handleAt = (f: number) => ({ left: `calc(${INSET}px + (100% - ${INSET * 2}px) * ${f})` }) as CSSProperties

  return (
    <div className="color-picker" style={{ '--hue': `hsl(${hsv[0]} 100% 50%)`, '--color': hex, '--alpha': alpha } as CSSProperties}>
      <div className="color-picker__area" {...area}>
        <span className="color-picker__handle" style={{ left: `${hsv[1] * 100}%`, top: `${(1 - hsv[2]) * 100}%` }} />
      </div>

      <div className="color-picker__sliders">
        <div className="color-picker__track color-picker__hue" {...hue}>
          <span className="color-picker__handle color-picker__handle--track" style={handleAt(hsv[0] / 360)} />
        </div>
        <div className="color-picker__track color-picker__alpha" {...opacity}>
          <span className="color-picker__handle color-picker__handle--track" style={handleAt(alpha)} />
        </div>
      </div>

      <div className="color-picker__fields">
        <span className="color-picker__mode">Hex</span>
        <input
          className="color-picker__input"
          aria-label="Hex"
          maxLength={7}
          spellCheck={false}
          value={hexDraft ?? hex.slice(1).toUpperCase()}
          onChange={(e) => setHexDraft(e.target.value)}
          onBlur={commitHex}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        />
        <span className="color-picker__percent">
          <span className="color-picker__scrub" aria-hidden {...scrub} />
          <input
            className="color-picker__input"
            aria-label="Прозрачность"
            inputMode="numeric"
            maxLength={3}
            value={alphaDraft ?? String(Math.round(alpha * 100))}
            onChange={(e) => setAlphaDraft(e.target.value)}
            onBlur={commitAlpha}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          />
          <span>%</span>
        </span>
      </div>
    </div>
  )
}
