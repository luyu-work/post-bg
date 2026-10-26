import { clamp } from './color-utils'
import type { Palette } from './palettes'
import type { Params } from './settings'

// t в 0..1 -> плавный цвет внутри палитры, mix 0..1 смешивает палитры, noise в -0.5..0.5
export const colorAt = (
  [pa, pb]: [Palette, Palette],
  t: number,
  mix: number,
  noise: number,
  p: Params,
  alpha: number,
): string => {
  // шум усиливается к светлому краю, светлые ступени палитры ближе друг к другу
  const pos = clamp(t + noise * p.noise * (1 + p.noiseLight * t), 0, 1) * 4
  const i = Math.min(Math.floor(pos), 3)
  const f = pos - i
  const at = (pal: Palette) => pal[i].map((v, k) => v + (pal[i + 1][k] - v) * f)
  const a = at(pa)
  const b = at(pb)
  const rgb = a.map((v, k) => Math.round(v + (b[k] - v) * mix)).join(',')
  return alpha < 1 ? `rgba(${rgb},${alpha})` : `rgb(${rgb})`
}
