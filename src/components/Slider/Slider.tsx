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
  const style = { '--p': `${((value - min) / (max - min)) * 100}%` } as CSSProperties

  return (
    <label className="slider">
      <span className="slider__head">
        <span className="slider__label">{label}</span>
        <span className="slider__value">{value.toFixed(digitsOf(step))}</span>
      </span>
      <input
        className="slider__input"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={style}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  )
}
