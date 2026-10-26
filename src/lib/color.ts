import type { Palette } from './palettes'
import type { Params } from './settings'

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi)

// t в 0..1 -> плавный цвет внутри палитры, mix 0..1 смешивает палитры, noise в -0.5..0.5
export const colorAt = ([pa, pb]: [Palette, Palette], t: number, mix: number, noise: number, p: Params): string => {
  // контраст и баланс света двигают яркость вокруг середины
  const tone = (t - 0.5) * p.contrast + 0.5 + p.shift
  // шум усиливается к светлому краю, светлые ступени палитры ближе друг к другу
  const pos = clamp(tone + noise * p.noise * (1 + p.noiseLight * tone), 0, 1) * 4
  const i = Math.min(Math.floor(pos), 3)
  const f = pos - i
  const at = (pal: Palette) => pal[i].map((v, k) => v + (pal[i + 1][k] - v) * f)
  const a = at(pa)
  const b = at(pb)
  const rgb = a.map((v, k) => (v + (b[k] - v) * mix) * p.brightness)
  const lum = 0.3 * rgb[0] + 0.59 * rgb[1] + 0.11 * rgb[2]
  return `rgb(${rgb.map((v) => Math.round(clamp(lum + (v - lum) * p.saturation, 0, 255))).join(',')})`
}
