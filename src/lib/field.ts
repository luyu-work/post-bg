import type { Params } from './settings'

const MAX_BLOBS = 8

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

// пятна с волнообразно изогнутыми краями, считается заново при любом движении слайдера
export const evaluateField = (scene: Scene, cols: number, rows: number, p: Params): Field => {
  const m = Math.min(cols, rows)
  const { first } = scene
  const blobs = scene.blobs.slice(0, Math.round(p.blobs)).map((b, k) => ({
    x: b.x * cols,
    y: b.y * rows,
    rx: m * b.kx * p.blobSize,
    ry: m * b.ky * p.blobSize,
    c: Math.cos(b.rot),
    s: Math.sin(b.rot),
    p1: b.p1,
    p2: b.p2,
    p3: b.p3,
    a: b.a,
    pal: (first + k) % 2,
  }))

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
    vals[i] = p.base + p.power * (1 - rest)
  }
  return { vals, mixes }
}
