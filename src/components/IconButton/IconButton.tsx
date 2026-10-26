import type { ButtonHTMLAttributes, CSSProperties } from 'react'
import { useSnappedSize } from '../../lib/snap'
import './IconButton.css'

// круглая кнопка 28px, размеры подогнаны под физические пиксели, поведение и анимацию задают потребители
export const IconButton = ({ className = '', style, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) => {
  const { button, icon } = useSnappedSize()
  const vars = { '--button': `${button}px`, '--icon': `${icon}px`, ...style } as CSSProperties
  return <button type="button" className={`icon-button ${className}`} style={vars} {...rest} />
}
