import { clamp } from './color-utils'
import type { Palette } from './palettes'
import type { Params } from './settings'

// канал k между ступенями i и i+1 внутри каждой палитры, затем между палитрами
const channel = (pa: Palette, pb: Palette, i: number, k: number, f: number, mix: number) => {
  const a = pa[i][k] + (pa[i + 1][k] - pa[i][k]) * f
  const b = pb[i][k] + (pb[i + 1][k] - pb[i][k]) * f
  return Math.round(a + (b - a) * mix)
}

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
  // считается для каждой клетки на каждом кадре анимации, поэтому без промежуточных массивов
  const rgb = `${channel(pa, pb, i, 0, f, mix)},${channel(pa, pb, i, 1, f, mix)},${channel(pa, pb, i, 2, f, mix)}`
  return alpha < 1 ? `rgba(${rgb},${alpha})` : `rgb(${rgb})`
}
