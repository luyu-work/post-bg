import { useRef } from 'react'

const DURATION = 300

// полный оборот, direction 1 по часовой, -1 против
export const spinFrames = (direction: 1 | -1 = 1): Keyframe[] => [
  { rotate: '0deg' },
  { rotate: `${360 * direction}deg` },
]

// тряска по диагонали туда сюда, в середине иконка чуть увеличивается, смещение в процентах от размера иконки
export const shakeFrames: Keyframe[] = [
  { translate: '0 0', scale: 1 },
  { translate: '-10% -10%', scale: 1.1 },
  { translate: '10% 10%', scale: 1.2 },
  { translate: '-5% -5%', scale: 1.1 },
  { translate: '0 0', scale: 1 },
]

export const useIconAnimation = <T extends Element>(frames: Keyframe[]) => {
  const ref = useRef<T>(null)
  const play = () => {
    ref.current?.animate(frames, { duration: DURATION, easing: 'ease' })
  }
  return { ref, play }
}
