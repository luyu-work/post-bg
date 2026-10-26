import type { World } from './physics'
import type { Params } from './settings'

// яркость фона вне пятен, отдельной настройки нет, ее задает цвет
const BASE = 0.12

const MAX_BLOBS = 8

// угловые частоты движения в радианах в секунду, периоды от 15 до 60 секунд, размах задают слайдеры
const MOTION = {
  spinSpeed: 0.1,
  breatheSpeed: 0.17,
  wobbleSpeed: [0.3, -0.23, 0.37],
  shimmerSpeed: 1.1,
} as const

// мерцание клетки, фаза берется из самого шума, поэтому соседи мерцают вразнобой
export const shimmerNoise = (noise: number, amount: number, time: number) =>
  amount ? noise * (1 - amount) + amount * 0.5 * Math.sin(time * MOTION.shimmerSpeed + noise * 50) : noise

// случайная часть пятна, размеры и позиция нормированы, чтобы слайдеры не требовали новой случайности
type BlobSeed = {
  x: number
  y: number
  kx: number
  ky: number
  rot: number
  p1: number
  p2: number
  p3: number
  a: number
}

// вся случайность сцены, пересоздается только при смене раскладки, цвета или по кнопке
export type Scene = {
  blobs: BlobSeed[]
  first: 0 | 1
  // в -0.5..0.5, амплитуду задает colorAt
  noise: Float32Array
}

export const createScene = (cols: number, rows: number): Scene => {
  const blobs = Array.from({ length: MAX_BLOBS }, () => ({
    x: Math.random(),
    y: Math.random(),
    kx: 0.35 + Math.random() * 0.35,
    ky: 0.25 + Math.random() * 0.3,
    rot: Math.random() * Math.PI,
    p1: Math.random() * 6.28,
    p2: Math.random() * 6.28,
    p3: Math.random() * 6.28,
    a: 0.75 + Math.random() * 0.25,
  }))
  const noise = Float32Array.from({ length: cols * rows }, () => Math.random() - 0.5)
  // палитры чередуются по пятнам, у первого случайная
  return { blobs, first: Math.random() < 0.5 ? 0 : 1, noise }
}

export type Field = { vals: Float32Array; mixes: Float32Array }

// пятна с волнообразно изогнутыми краями, считается заново при любом движении слайдера,
// положение и форма пятен берутся из мира физики, time в секундах двигает края
export const evaluateField = (world: World, cols: number, rows: number, p: Params, time = 0): Field => {
  const m = Math.min(cols, rows)
  const { first } = world
  const blobs = world.bodies.map((b) => {
    // у каждого пятна свой темп из его случайных параметров, хаотичность растягивает разброс, при 0 пятна идут в унисон
    const pace = 1 + p.chaos * (b.r - 0.52) * 2
    const rot = b.rot + p.spin * Math.sin(time * MOTION.spinSpeed * pace + b.p2)
    const size = p.blobSize * (1 + p.breathe * Math.sin(time * MOTION.breatheSpeed * pace + b.p3))
    // вытягивание вдоль движения сохраняет площадь пятна
    // упругость слайдера усиливает или гасит покачивание формы
    const stretch = b.stretch * p.jelly
    const rx = m * b.r * size * (1 + stretch)
    const ry = (m * b.r * b.aspect * size) / Math.sqrt(1 + stretch)
    return {
      x: b.x * m,
      y: b.y * m,
      rx,
      ry,
      c: Math.cos(rot),
      s: Math.sin(rot),
      p1: b.p1 + time * MOTION.wobbleSpeed[0] * p.chaos,
      p2: b.p2 + time * MOTION.wobbleSpeed[1] * p.chaos,
      p3: b.p3 + time * MOTION.wobbleSpeed[2] * p.chaos,
      a: b.a,
      pal: b.pal,
    }
  })

  // дальше этого расстояния пятно меньше 0.1% вклада, такие клетки пропускаются без тригонометрии
  const maxWob = 1 + p.wobble * 0.42
  const reach = Math.pow(7 / 1.5, 1 / p.edgeSharp) * maxWob
  const reach2 = reach * reach

  const vals = new Float32Array(cols * rows)
  const mixes = new Float32Array(cols * rows)
  for (let i = 0; i < vals.length; i++) {
    const x = i % cols
    const y = (i / cols) | 0
    let rest = 1
    let wsum = 0.05
    let wpal = 0.05 * first
    for (const b of blobs) {
      const dx = x - b.x
      const dy = y - b.y
      const u = (dx * b.c + dy * b.s) / b.rx
      const v = (-dx * b.s + dy * b.c) / b.ry
      if (u * u + v * v > reach2) continue
      const th = Math.atan2(v, u)
      const wob =
        1 +
        p.wobble *
          (0.22 * Math.sin(2 * th + b.p1) + 0.14 * Math.sin(3 * th + b.p2) + 0.06 * Math.sin(5 * th + b.p3))
      const r = Math.hypot(u, v) / Math.max(wob, 0.05)
      const g = b.a * Math.exp(-Math.pow(r, p.edgeSharp) * 1.5)
      rest *= 1 - g
      wsum += g
      wpal += g * b.pal
    }
    mixes[i] = wpal / wsum
    vals[i] = BASE + p.power * (1 - rest)
  }
  return { vals, mixes }
}
