import type { Palette } from './palettes'

const NOISE = 0.14 // амплитуда шума в темных местах
const NOISE_LIGHT_BOOST = 1.2 // во сколько раз шум усиливается к светлому краю, светлые ступени ближе друг к другу

// t в 0..1 -> плавный цвет внутри палитры, mix 0..1 смешивает палитры
export const colorAt = ([pa, pb]: [Palette, Palette], t: number, mix: number, noise: number): string => {
  const p = Math.min(Math.max(t + noise * NOISE * (1 + NOISE_LIGHT_BOOST * t), 0), 1) * 4
  const i = Math.min(Math.floor(p), 3)
  const f = p - i
  const at = (pal: Palette) => pal[i].map((v, k) => v + (pal[i + 1][k] - v) * f)
  const a = at(pa)
  const b = at(pb)
  return `rgb(${a.map((v, k) => Math.round(v + (b[k] - v) * mix)).join(',')})`
}
