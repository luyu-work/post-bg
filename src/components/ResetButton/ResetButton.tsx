import { iconSvgProps } from '../../lib/icon'
import { spinFrames, useIconAnimation } from '../../lib/iconAnimation'
import { IconButton } from '../IconButton'

type Props = {
  visible: boolean
  onClick: () => void
}

export const ResetButton = ({ visible, onClick }: Props) => {
  // стрелка на иконке смотрит против часовой, оборот в ту же сторону
  const { ref, play } = useIconAnimation<SVGSVGElement>(spinFrames(-1))

  return (
    <IconButton
      reveal={visible}
      revealIndex={1}
      aria-label="Сбросить настройки"
      onClick={() => {
        play()
        onClick()
      }}
    >
      <svg ref={ref} {...iconSvgProps}>
        {/* глиф сжат до размера крестика, обводка увеличена, чтобы толщина осталась прежней */}
        <g transform="translate(12.5 12) scale(0.8) translate(-12 -12)" strokeWidth={2.5}>
          <path d="M1 4v6h6" />
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
        </g>
      </svg>
    </IconButton>
  )
}
