import { useEffect, useState } from 'react'
import { computeLayout, type GridLayout } from '../../lib/layout'

// при ресайзе всегда отдается новый объект, поле пятен пересоздается
export const useGridLayout = (): GridLayout => {
  const [layout, setLayout] = useState(computeLayout)

  useEffect(() => {
    let t: number
    const onResize = () => {
      clearTimeout(t)
      t = window.setTimeout(() => setLayout(computeLayout()), 100)
    }
    addEventListener('resize', onResize)
    return () => {
      clearTimeout(t)
      removeEventListener('resize', onResize)
    }
  }, [])

  return layout
}
