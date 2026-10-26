import type { CSSProperties } from 'react'
import './Slider.css'

type Props = {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
}

// сколько знаков после запятой показывать, по шагу слайдера
const digitsOf = (step: number) => (step >= 1 ? 0 : step >= 0.1 ? 1 : 2)

export const Slider = ({ label, value, min, max, step, onChange }: Props) => {
  const digits = digitsOf(step)
  const style = { '--f': (value - min) / (max - min) } as CSSProperties

  return (
    <div className="slider">
      <span className="slider__label">{label}</span>
      <label className="slider__card">
        <span className="slider__scale">
          <span>{min.toFixed(digits)}</span>
          <span className="slider__value">{value.toFixed(digits)}</span>
          <span>{max.toFixed(digits)}</span>
        </span>
        <input
          className="slider__input"
          type="range"
          aria-label={label}
          min={min}
          max={max}
          step={step}
          value={value}
          style={style}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      </label>
    </div>
  )
}
