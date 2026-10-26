import { useEffect, type ReactNode } from 'react'
import './SettingsPanel.css'

type Props = {
  open: boolean
  onClose: () => void
  children?: ReactNode
}

export const SettingsPanel = ({ open, onClose, children }: Props) => {
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
      className={`settings-panel${open ? ' settings-panel--open' : ''}`}
      aria-hidden={!open}
      inert={!open}
    >
      {children}
    </aside>
  )
}
