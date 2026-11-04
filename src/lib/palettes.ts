import { hexToRgb } from './color-utils'

export type Rgb = [number, number, number]
export type Palette = Rgb[]

// палитры в виде 5 ступеней от темной к светлой, пятна красятся в две палитры вперемешку
const HUES = {
  green: [['#06301a', '#0f6e34', '#22a84e', '#3fc562', '#6fd986']],
  blue: [['#061a38', '#0a4a86', '#1478c8', '#2f9ee8', '#58b4f6']],
  orange: [['#2a1204', '#6e3008', '#c05a10', '#f08020', '#ffaa4a']],
  crimson: [['#2e0618', '#6e0f40', '#c0245e', '#e0467e', '#f87aa6']],
  purple: [['#1e0a38', '#4e1c92', '#8a3ee0', '#a95cf2', '#cf92ff']],
  yellow: [
    ['#2e2606', '#6b5a0a', '#b49411', '#eec81c', '#fff07a'],
  ],
} as const

export type HueName = keyof typeof HUES

export const HUE_OPTIONS: { value: HueName; label: string; hint: string }[] = [
  { value: 'green', label: 'Зеленый', hint: 'О нас' },
  { value: 'blue', label: 'Синий', hint: 'Скрин' },
  { value: 'orange', label: 'Оранжевый', hint: 'Анимация' },
  { value: 'crimson', label: 'Малиновый', hint: 'Новости' },
  { value: 'purple', label: 'Фиолетовый', hint: 'Мнение' },
  { value: 'yellow', label: 'Желтый', hint: 'Мемы' },
]

const parse = (hex: readonly string[]): Palette =>
  hex.map((h) => [1, 3, 5].map((i) => Math.round(parseInt(h.slice(i, i + 2), 16))) as Rgb)

// у однотонных оттенков обе палитры совпадают
export const getPalettes = (hue: HueName): [Palette, Palette] => {
  const list = HUES[hue]
  return [parse(list[0]), parse(list[list.length - 1])]
}

// цвет акцентов интерфейса, яркая ступень выбранного оттенка
export const getAccent = (hue: HueName): string => {
  const list = HUES[hue]
  return list[list.length - 1][3]
}

// палитра из выбранного цвета: он стоит на яркой ступени, темные ступени это его затемнение, последняя светлее
export const customPalettes = (hex: string): [Palette, Palette] => {
  const base = hexToRgb(hex)
  const dim = (k: number) => base.map((v) => Math.round(v * k)) as Rgb
  const light = base.map((v) => Math.round(v + (255 - v) * 0.4)) as Rgb
  const palette: Palette = [dim(0.18), dim(0.4), dim(0.7), base, light]
  return [palette, palette]
}
