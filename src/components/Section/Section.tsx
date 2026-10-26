import { useState, type ReactNode } from 'react'
import './Section.css'

type Props = {
  title: string
  defaultOpen?: boolean
  children: ReactNode
}

export const Section = ({ title, defaultOpen = false, children }: Props) => {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section className={`section${open ? ' is-open' : ''}`}>
      <button type="button" className="section__head" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="section__title">{title}</span>
        <svg className="section__arrow" viewBox="0 0 8 8" aria-hidden>
          <path d="M1 2.5h6L4 6.5z" fill="currentColor" />
        </svg>
      </button>
      <div className="section__body" inert={!open}>
        <div className="section__content">
          <div className="section__inner">{children}</div>
        </div>
      </div>
    </section>
  )
}
