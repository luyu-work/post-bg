import { useEffect, useRef, useState } from 'react'
import './SelectColor.css'

type Option<T extends string> = { value: T; label: string }

type Props<T extends string> = {
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
}

export const SelectColor = <T extends string>({ options, value, onChange }: Props<T>) => {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={rootRef} className={`select-color${open ? ' select-color--open' : ''}`}>
      <button
        type="button"
        className="select-color__chip"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {/* все подписи лежат в одной ячейке, ширина чипа равна самой длинной */}
        <span className="select-color__labels">
          {options.map((o) => (
            <span key={o.value} className={o.value === value ? 'is-current' : undefined}>
              {o.label}
            </span>
          ))}
        </span>
        <svg
          className="select-color__arrow"
          viewBox="0 0 10 10"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M1.5 3.5 5 7l3.5-3.5" />
        </svg>
      </button>

      {open && (
        <div className="select-color__menu" role="listbox">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              role="option"
              aria-selected={o.value === value}
              className={`select-color__option${o.value === value ? ' is-selected' : ''}`}
              onClick={() => {
                onChange(o.value)
                setOpen(false)
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
