import type { ButtonHTMLAttributes, CSSProperties } from 'react'
import { Hint } from '../Hint'
import { useSnappedSize } from '../../lib/snap'
import './IconButton.css'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  // задан, значит кнопка появляется и исчезает вместе с панелью настроек
  reveal?: boolean
  // порядок появления под крестиком, 1 первая, каждая следующая стартует после предыдущей
  revealIndex?: number
  // подсказка слева от кнопки при наведении
  hint?: string
}

// квадратная кнопка 32px со скруглением, размеры подогнаны под физические пиксели, поведение и анимацию задают потребители
export const IconButton = ({ className = '', style, reveal, revealIndex = 1, hint, children, ...rest }: Props) => {
  const { button, icon } = useSnappedSize()
  const vars = { '--button': `${button}px`, '--icon': `${icon}px`, '--reveal-index': revealIndex, ...style } as CSSProperties
  const revealProps =
    reveal === undefined
      ? {}
      : { 'aria-hidden': !reveal, tabIndex: reveal ? 0 : -1, className: `icon-button icon-button--reveal${reveal ? ' is-visible' : ''} ${className}` }
  return (
    <button type="button" className={`icon-button ${className}`} style={vars} {...rest} {...revealProps}>
      {children}
      {hint && (
        <span className="icon-button__hint" aria-hidden>
          <Hint>{hint}</Hint>
        </span>
      )}
    </button>
  )
}
