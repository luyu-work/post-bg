import { useRef } from 'react'
import { iconSvgProps } from '../../lib/icon'
import { IconButton } from '../IconButton'
import './ResetButton.css'

type Props = {
  visible: boolean
  onClick: () => void
}

export const ResetButton = ({ visible, onClick }: Props) => {
  const iconRef = useRef<SVGSVGElement>(null)

  // иконка делает полный оборот против часовой за 300ms, стрелка на ней тоже смотрит против часовой
  const handleClick = () => {
    iconRef.current?.animate([{ rotate: '0deg' }, { rotate: '-360deg' }], { duration: 300, easing: 'ease' })
    onClick()
  }

  return (
    <IconButton
      className={`reset-button${visible ? ' reset-button--visible' : ''}`}
      aria-label="Сбросить настройки"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      onClick={handleClick}
    >
      <svg ref={iconRef} {...iconSvgProps}>
        {/* глиф сжат до размера крестика, обводка увеличена, чтобы толщина осталась прежней */}
        <g transform="translate(12.5 12) scale(0.8) translate(-12 -12)" strokeWidth={2.5}>
          <path d="M1 4v6h6" />
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
        </g>
      </svg>
    </IconButton>
  )
}
