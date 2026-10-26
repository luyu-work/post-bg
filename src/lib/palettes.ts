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
    ['#1a2e06', '#3d6b0a', '#6fb411', '#a8ee1c', '#e0ff7a'],
    ['#2e2606', '#6b5a0a', '#b49411', '#eec81c', '#fff07a'],
  ],
} as const

export type HueName = keyof typeof HUES

export const HUE_OPTIONS: { value: HueName; label: string }[] = [
  { value: 'green', label: 'Зеленый' },
  { value: 'blue', label: 'Синий' },
  { value: 'orange', label: 'Оранжевый' },
  { value: 'crimson', label: 'Малиновый' },
  { value: 'purple', label: 'Фиолетовый' },
  { value: 'yellow', label: 'Желтый' },
]

const DIM = 1 // яркость цвета, 1 = исходная палитра

const parse = (hex: readonly string[]): Palette =>
  hex.map((h) => [1, 3, 5].map((i) => Math.round(parseInt(h.slice(i, i + 2), 16) * DIM)) as Rgb)

// у однотонных оттенков обе палитры совпадают
export const getPalettes = (hue: HueName): [Palette, Palette] => {
  const list = HUES[hue]
  return [parse(list[0]), parse(list[list.length - 1])]
}
