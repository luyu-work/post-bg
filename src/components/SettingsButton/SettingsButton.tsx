import type { CSSProperties } from 'react'
import { useSnappedSize } from '../../lib/snap'
import './SettingsButton.css'

type Props = { onClick?: () => void; expanded?: boolean }

const svgProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.4, // 1.6px при иконке 16px
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const

export const SettingsButton = ({ onClick, expanded = false }: Props) => {
  const { button, icon } = useSnappedSize()
  const style = { '--button': `${button}px`, '--icon': `${icon}px` } as CSSProperties

  return (
    <button
      type="button"
      className={`settings-button${expanded ? ' settings-button--open' : ''}`}
      style={style}
      aria-label={expanded ? 'Закрыть настройки' : 'Настройки'}
      aria-expanded={expanded}
      onClick={onClick}
    >
      <span className="settings-button__icon settings-button__gear">
        <svg {...svgProps}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </span>
      <span className="settings-button__icon settings-button__close">
        <svg {...svgProps}>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </span>
    </button>
  )
}
