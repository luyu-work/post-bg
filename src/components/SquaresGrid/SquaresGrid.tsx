import { memo, useLayoutEffect, useMemo, useRef, type CSSProperties } from 'react'
import { colorAt } from '../../lib/color'
import { createScene, evaluateField } from '../../lib/field'
import { getPalettes, type HueName } from '../../lib/palettes'
import type { Params } from '../../lib/settings'
import { useGridLayout } from './useGridLayout'
import './SquaresGrid.css'

type Props = {
  hue: HueName
  params: Params
  // меняется, когда нужна новая случайная раскладка пятен и шума
  shuffle: number
}

// memo, чтобы открытие настроек не перерисовывало тысячи клеток
export const SquaresGrid = memo(({ hue, params, shuffle }: Props) => {
  const { width, height, gap, cols, rows, offX, offY } = useGridLayout(params)

  // случайная часть живет отдельно от слайдеров, поэтому они двигают картинку без скачков
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const scene = useMemo(() => createScene(cols, rows), [cols, rows, shuffle])

  const colors = useMemo(() => {
    const palettes = getPalettes(hue)
    const { vals, mixes } = evaluateField(scene, cols, rows, params)
    return Array.from(vals, (v, i) => colorAt(palettes, v, mixes[i], scene.noise[i], params))
  }, [scene, hue, cols, rows, params])

  // цвета пишутся прямо в DOM, без перерисовки тысяч клеток React, иначе слайдеры тормозят
  const gridRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const cells = gridRef.current?.children
    if (!cells) return
    for (let i = 0; i < colors.length; i++) (cells[i] as HTMLElement).style.background = colors[i]
  }, [colors])

  const style: CSSProperties = {
    '--cell-w': `${width}px`,
    '--cell-h': `${height}px`,
    '--cell-r': `${params.radius}px`,
    gap: `${gap}px`,
    gridTemplateColumns: `repeat(${cols}, ${width}px)`,
    gridTemplateRows: `repeat(${rows}, ${height}px)`,
    padding: `${offY}px 0 0 ${offX}px`,
  } as CSSProperties

  return (
    <div ref={gridRef} className="squares-grid" style={style}>
      {Array.from({ length: cols * rows }, (_, i) => (
        <div key={i} className="squares-grid__cell" />
      ))}
    </div>
  )
})
