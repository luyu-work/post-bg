import { memo, useLayoutEffect, useMemo, useRef, type CSSProperties } from 'react'
import { colorAt } from '../../lib/color'
import { createScene, evaluateField } from '../../lib/field'
import type { Palette } from '../../lib/palettes'
import { SLIDERS, type Params } from '../../lib/settings'
import { useGridLayout } from './useGridLayout'
import './SquaresGrid.css'

type Props = {
  palettes: [Palette, Palette]
  alpha: number
  params: Params
  // меняется, когда нужна новая случайная раскладка пятен и шума
  shuffle: number
}

// memo, чтобы открытие настроек не перерисовывало тысячи клеток
export const SquaresGrid = memo(({ palettes, alpha, params, shuffle }: Props) => {
  const { width, height, gap, cols, rows, offX, offY } = useGridLayout(params)

  // случайная часть живет отдельно от слайдеров, поэтому они двигают картинку без скачков
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const scene = useMemo(() => createScene(cols, rows), [cols, rows, shuffle])

  // params приходит целым объектом настроек, поэтому ключ из чисел слайдеров не дает пересчитывать поле при смене цвета и прозрачности
  const paramsKey = SLIDERS.map((s) => params[s.key]).join(',')

  // тяжелая часть, пятна по клеткам, зависит только от слайдеров и раскладки
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const field = useMemo(() => evaluateField(scene, cols, rows, params), [scene, cols, rows, paramsKey])

  const colors = useMemo(
    () => Array.from(field.vals, (v, i) => colorAt(palettes, v, field.mixes[i], scene.noise[i], params, alpha)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [field, palettes, alpha, scene, paramsKey],
  )

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
