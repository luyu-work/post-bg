import { memo, useEffect, useLayoutEffect, useMemo, useRef, type RefObject, type CSSProperties } from 'react'
import type { ExportSource } from '../../lib/export'
import { colorAt } from '../../lib/color'
import { createScene, evaluateField, shimmerNoise, type Field } from '../../lib/field'
import { createWorld, stepWorld, syncCount } from '../../lib/physics'
import type { Palette } from '../../lib/palettes'
import { SLIDERS, type Params } from '../../lib/settings'
import { useGridLayout } from './useGridLayout'
import './SquaresGrid.css'

type Props = {
  exportRef: RefObject<ExportSource | null>
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
// во сколько раз пауза между кадрами длиннее самого кадра, остальное время остается интерфейсу
const LOAD_RATIO = 2

// memo, чтобы открытие настроек не перерисовывало тысячи клеток
export const SquaresGrid = memo(({ palettes, alpha, params, shuffle, animate, exportRef }: Props) => {
  const { width, height, gap, cols, rows, offX, offY } = useGridLayout(params)

  // случайная часть живет отдельно от слайдеров, поэтому они двигают картинку без скачков
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const scene = useMemo(() => createScene(cols, rows), [cols, rows, shuffle])

  // пятна как тела с физикой, раскладка из сцены, дальше их двигает только анимация
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const world = useMemo(() => createWorld(scene, cols, rows, params.blobs), [scene])

  // params приходит целым объектом настроек, поэтому ключ из чисел слайдеров не дает пересчитывать поле при смене цвета и прозрачности
  const paramsKey = SLIDERS.map((s) => params[s.key]).join(',')

  // время анимации в секундах, при выключении картинка замирает на текущем кадре
  const timeRef = useRef(0)

  // цвета клеток для готового поля, shimmer мерцает по времени
  const colorsOf = (field: Field, time: number) =>
    Array.from(field.vals, (v, i) =>
      colorAt(palettes, v, field.mixes[i], shimmerNoise(scene.noise[i], params.shimmer, time), params, alpha),
    )

  // поле считается заново от текущего положения пятен, поэтому смена цвета при работающей анимации не откатывает кадр назад
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const colors = useMemo(() => {
    syncCount(world, scene, params.blobs)
    return colorsOf(evaluateField(world, cols, rows, params, timeRef.current), timeRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [world, scene, cols, rows, paramsKey, animate, palettes, alpha])

  // цвета пишутся прямо в DOM, без перерисовки тысяч клеток React, иначе слайдеры тормозят,
  // трогаются только клетки, чей цвет изменился с прошлого кадра
  const gridRef = useRef<HTMLDivElement>(null)
  const painted = useRef<string[]>([])
  const paint = (list: string[]) => {
    const cells = gridRef.current?.children
    if (!cells) return
    const prev = painted.current
    for (let i = 0; i < list.length; i++) {
      if (prev[i] !== list[i]) (cells[i] as HTMLElement).style.background = list[i]
    }
    painted.current = list
  }
  // клетки пересоздались, прошлые цвета больше не на них, красить нужно все
  useLayoutEffect(() => {
    painted.current = []
  }, [cols, rows])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => paint(colors), [colors])

  // цикл читает свежие значения из ref, поэтому перетаскивание цвета и слайдеров не перезапускает его и не останавливает кадры
  const latest = useRef({ params, colorsOf })
  latest.current = { params, colorsOf }

  useEffect(() => {
    if (!animate) return
    // время копится по кадрам с учетом скорости, поэтому смена скорости и пауза не дают скачка
    let raf = 0
    let last = performance.now()
    // на больших сетках кадр считается дольше, интервал растет вслед за ним, чтобы страница не зависала
    let interval = 1000 / FPS
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      if (now - last < interval) return
      const { params, colorsOf } = latest.current
      const dt = Math.min((now - last) / 1000, MAX_STEP) * params.speed
      timeRef.current += dt
      last = now
      stepWorld(world, scene, dt, params)
      paint(colorsOf(evaluateField(world, cols, rows, params, timeRef.current), timeRef.current))
      interval = Math.max(1000 / FPS, (performance.now() - now) * LOAD_RATIO)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animate, world, scene, cols, rows])

  useLayoutEffect(() => {
    exportRef.current = { snapshot: () => structuredClone({ scene, world, time: timeRef.current, params, alpha, palettes, layout: { width, height, gap, cols, rows, offX, offY }, viewport: { width: innerWidth, height: innerHeight } }) }
    return () => { exportRef.current = null }
  })

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
