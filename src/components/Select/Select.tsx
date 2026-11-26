import { useEffect, useId, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import './Select.css'

type Option = { value: string; label: string }
type Props = { label: string; value: string; options: Option[]; onChange: (value: string) => void; disabled?: boolean }
export function Select({ label, value, options, onChange, disabled }: Props) {
  const id = useId()
  const button = useRef<HTMLButtonElement>(null)
  const menu = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [accent, setAccent] = useState('')
  const [active, setActive] = useState(0)
  const [position, setPosition] = useState({ left: 0, top: 0, width: 120 })
  const selected = Math.max(0, options.findIndex(o => o.value === value))
  const show = () => {
    const rect = button.current!.getBoundingClientRect()
    const height = options.length * 40 + 8
    setPosition({ left: rect.left, top: rect.bottom + height + 8 < innerHeight ? rect.bottom + 6 : rect.top - height - 6, width: rect.width })
    setAccent(getComputedStyle(button.current!).getPropertyValue('--accent'))
    setActive(selected); setOpen(true)
  }
  useEffect(() => {
    if (!open) return
    const outside = (e: PointerEvent) => { if (!button.current?.contains(e.target as Node) && !menu.current?.contains(e.target as Node)) setOpen(false) }
    const close = () => setOpen(false)
    document.addEventListener('pointerdown', outside)
    window.addEventListener('resize', close)
    document.addEventListener('scroll', close, true)
    return () => { document.removeEventListener('pointerdown', outside); window.removeEventListener('resize', close); document.removeEventListener('scroll', close, true) }
  }, [open])
  const choose = (index: number) => { onChange(options[index].value); setOpen(false) }
  return <>
    <button ref={button} className="select" type="button" role="combobox" aria-label={label} aria-controls={open ? id : undefined} aria-expanded={open} aria-haspopup="listbox" aria-activedescendant={open ? `${id}-${active}` : undefined} disabled={disabled}
      onBlur={() => setOpen(false)} onClick={() => open ? setOpen(false) : show()}
      onKeyDown={e => {
        if (e.key === 'Escape' || e.key === 'Tab') { setOpen(false); if (e.key === 'Escape') e.stopPropagation(); return }
        if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
          e.preventDefault()
          if (!open) { show(); return }
          setActive(i => e.key === 'Home' ? 0 : e.key === 'End' ? options.length - 1 : (i + (e.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length)
        }
        if (open && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); choose(active) }
      }}>
      <span>{options[selected]?.label}</span>
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="m3 4.5 3 3 3-3" stroke="currentColor" strokeWidth="1.5" /></svg>
    </button>
    {open && !disabled && createPortal(<div ref={menu} id={id} role="listbox" aria-label={label} className="select__menu" style={{ ...position, '--accent': accent } as CSSProperties}>
      {options.map((o, i) => <div key={o.value} id={`${id}-${i}`} role="option" aria-selected={o.value === value} className={`select__option${active === i ? ' is-active' : ''}`} onPointerMove={() => setActive(i)} onMouseDown={e => e.preventDefault()} onClick={() => choose(i)}>
        <span>{o.label}</span>{o.value === value && <span aria-hidden="true">✓</span>}
      </div>)}
    </div>, document.body)}
  </>
}
