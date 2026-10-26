import { useEffect, useMemo, useState } from 'react'
import { computeLayout, type GridLayout, type LayoutOptions } from '../../lib/layout'

// раскладка пересчитывается при ресайзе и при движении слайдеров сетки
export const useGridLayout = ({ cellSize, gap, pad }: LayoutOptions): GridLayout => {
  const [viewport, setViewport] = useState(0)

  useEffect(() => {
    let t: number
    const onResize = () => {
      clearTimeout(t)
      t = window.setTimeout(() => setViewport((v) => v + 1), 100)
    }
    addEventListener('resize', onResize)
    return () => {
      clearTimeout(t)
      removeEventListener('resize', onResize)
    }
  }, [])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => computeLayout({ cellSize, gap, pad }), [cellSize, gap, pad, viewport])
}
