import { memo, useEffect, useLayoutEffect, useMemo, useRef, type CSSProperties } from 'react'
import { colorAt } from '../../lib/color'
import { createScene, evaluateField, shimmerNoise } from '../../lib/field'
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
  animate: boolean
}

// кадров в секунду у анимации, при медленном движении глазу хватает, а нагрузка вдвое меньше
const FPS = 30
// самый большой шаг времени за кадр в секундах, после паузы вкладки движение не перескакивает
const MAX_STEP = 0.1

// memo, чтобы открытие настроек не перерисовывало тысячи клеток
export const SquaresGrid = memo(({ palettes, alpha, params, shuffle, animate }: Props) => {
  const { width, height, gap, cols, rows, offX, offY } = useGridLayout(params)

  // случайная часть живет отдельно от слайдеров, поэтому они двигают картинку без скачков
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const scene = useMemo(() => createScene(cols, rows), [cols, rows, shuffle])

  // params приходит целым объектом настроек, поэтому ключ из чисел слайдеров не дает пересчитывать поле при смене цвета и прозрачности
  const paramsKey = SLIDERS.map((s) => params[s.key]).join(',')

  // время анимации в секундах, при выключении картинка замирает на текущем кадре
  const timeRef = useRef(0)

  const colorsAt = (time: number) => {
    const { vals, mixes } = evaluateField(scene, cols, rows, params, time)
    return Array.from(vals, (v, i) =>
      colorAt(palettes, v, mixes[i], shimmerNoise(scene.noise[i], params.shimmer, time), params, alpha),
    )
  }

  // неподвижная картинка считается только от слайдеров и раскладки, прозрачность и палитра поле не трогают
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const field = useMemo(() => evaluateField(scene, cols, rows, params, timeRef.current), [scene, cols, rows, paramsKey, animate])

  const colors = useMemo(
    () =>
      Array.from(field.vals, (v, i) =>
        colorAt(palettes, v, field.mixes[i], shimmerNoise(scene.noise[i], params.shimmer, timeRef.current), params, alpha),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [field, palettes, alpha, scene, paramsKey],
  )

  // цвета пишутся прямо в DOM, без перерисовки тысяч клеток React, иначе слайдеры тормозят
  const gridRef = useRef<HTMLDivElement>(null)
  const paint = (list: string[]) => {
    const cells = gridRef.current?.children
    if (!cells) return
    for (let i = 0; i < list.length; i++) (cells[i] as HTMLElement).style.background = list[i]
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => paint(colors), [colors])

  useEffect(() => {
    if (!animate) return
    // время копится по кадрам с учетом скорости, поэтому смена скорости и пауза не дают скачка
    let raf = 0
    let last = performance.now()
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      if (now - last < 1000 / FPS) return
      timeRef.current += Math.min((now - last) / 1000, MAX_STEP) * params.speed
      last = now
      paint(colorsAt(timeRef.current))
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animate, scene, palettes, alpha, cols, rows, paramsKey])

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
