import { useRef, type CSSProperties } from 'react'
import { useSnappedSize } from '../../lib/snap'
import './ResetButton.css'

type Props = {
  visible: boolean
  onClick: () => void
}

export const ResetButton = ({ visible, onClick }: Props) => {
  const { button, icon } = useSnappedSize()
  const style = { '--button': `${button}px`, '--icon': `${icon}px` } as CSSProperties
  const iconRef = useRef<SVGSVGElement>(null)

  // иконка делает полный оборот против часовой за 300ms, стрелка на ней тоже смотрит против часовой
  const handleClick = () => {
    iconRef.current?.animate([{ rotate: '0deg' }, { rotate: '-360deg' }], { duration: 300, easing: 'ease' })
    onClick()
  }

  return (
    <button
      type="button"
      className={`reset-button${visible ? ' reset-button--visible' : ''}`}
      style={style}
      aria-label="Сбросить настройки"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      onClick={handleClick}
    >
      <svg
        ref={iconRef}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M1 4v6h6" />
        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
      </svg>
    </button>
  )
}
