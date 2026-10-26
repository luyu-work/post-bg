import { iconSvgProps } from '../../lib/icon'
import { shakeFrames, useIconAnimation } from '../../lib/iconAnimation'
import { IconButton } from '../IconButton'

type Props = {
  visible: boolean
  onClick: () => void
}

export const DiceButton = ({ visible, onClick }: Props) => {
  const { ref, play } = useIconAnimation<SVGSVGElement>(shakeFrames)

  return (
    <IconButton
      reveal={visible}
      revealIndex={2}
      aria-label="Случайная картинка"
      onClick={() => {
        play()
        onClick()
      }}
    >
      <svg ref={ref} {...iconSvgProps}>
        <rect x="4" y="4" width="16" height="16" rx="3" />
        <path d="M8.5 8.5h.01M15.5 8.5h.01M12 12h.01M8.5 15.5h.01M15.5 15.5h.01" />
      </svg>
    </IconButton>
  )
}
