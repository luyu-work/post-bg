import { useEffect, type CSSProperties, type ReactNode } from 'react'
import './SettingsPanel.css'

type Props = {
  color: string
  open: boolean
  onClose: () => void
  children?: ReactNode
}

export const SettingsPanel = ({ open, onClose, children, color }: Props) => {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  return (
    <aside
      style={{ '--accent': color } as CSSProperties}
      className={`settings-panel${open ? ' settings-panel--open' : ''}`}
      aria-hidden={!open}
      inert={!open}
    >
      {children}
    </aside>
  )
}
