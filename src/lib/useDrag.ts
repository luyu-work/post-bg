import { useRef, type PointerEvent } from 'react'
import { clamp } from './color-utils'

// перетаскивание внутри блока, отдает положение в долях 0..1, inset это отступ дорожки от краев в пикселях
export const useDrag = (onMove: (x: number, y: number) => void, inset = 0) => {
  const ref = useRef<HTMLDivElement>(null)

  const move = (e: PointerEvent) => {
    const r = ref.current!.getBoundingClientRect()
    onMove(
      clamp((e.clientX - r.left - inset) / (r.width - inset * 2), 0, 1),
      clamp((e.clientY - r.top) / r.height, 0, 1),
    )
  }

  return {
    ref,
    onPointerDown: (e: PointerEvent) => {
      e.currentTarget.setPointerCapture(e.pointerId)
      move(e)
    },
    onPointerMove: (e: PointerEvent) => {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) move(e)
    },
  }
}
