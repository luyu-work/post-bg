import { useCallback, useEffect, useState } from 'react'
import { parseHex } from './color-utils'
import { getAccent, HUE_OPTIONS, type HueName } from './palettes'

export type SliderKey =
  | 'noise'
  | 'noiseLight'
  | 'blobs'
  | 'blobSize'
  | 'edgeSharp'
  | 'wobble'
  | 'power'
  | 'cellSize'
  | 'gap'
  | 'radius'
  | 'pad'
  | 'speed'
  | 'chaos'
  | 'drift'
  | 'spin'
  | 'breathe'
  | 'shimmer'

// раздел с общим свитчем анимации, форма ставит его первым в этом разделе
export const GROUP_ANIMATION = 'Анимация'

export type SliderDef = {
  key: SliderKey
  label: string
  group: string
  min: number
  max: number
  step: number
  def: number
}

// новая настройка = новая строка здесь, форма, хранение и проверка подхватят ее сами
export const SLIDERS: SliderDef[] = [
  { key: 'noise', label: 'Шум', group: 'Шум', min: 0, max: 0.6, step: 0.01, def: 0.14 },
  { key: 'noiseLight', label: 'Шум в светлых', group: 'Шум', min: 0, max: 4, step: 0.1, def: 1.2 },

  { key: 'blobs', label: 'Количество пятен', group: 'Пятна', min: 1, max: 8, step: 1, def: 3 },
  { key: 'blobSize', label: 'Размер пятен', group: 'Пятна', min: 0.3, max: 2, step: 0.01, def: 1 },
  { key: 'edgeSharp', label: 'Резкость края', group: 'Пятна', min: 1, max: 6, step: 0.1, def: 2.6 },
  { key: 'wobble', label: 'Искажение края', group: 'Пятна', min: 0, max: 3, step: 0.05, def: 1 },
  { key: 'power', label: 'Сила пятен', group: 'Пятна', min: 0.2, max: 1, step: 0.01, def: 0.78 },

  { key: 'cellSize', label: 'Размер клетки', group: 'Сетка', min: 8, max: 40, step: 1, def: 18 },
  { key: 'gap', label: 'Зазор', group: 'Сетка', min: 1, max: 8, step: 1, def: 2 },
  { key: 'radius', label: 'Скругление', group: 'Сетка', min: 0, max: 9, step: 0.5, def: 2 },
  { key: 'pad', label: 'Отступ от края', group: 'Сетка', min: 0, max: 40, step: 1, def: 2 },

  { key: 'speed', label: 'Скорость', group: GROUP_ANIMATION, min: 0.1, max: 3, step: 0.1, def: 1 },
  { key: 'chaos', label: 'Хаотичность', group: GROUP_ANIMATION, min: 0, max: 2, step: 0.05, def: 1 },
  { key: 'drift', label: 'Смещение пятен', group: GROUP_ANIMATION, min: 0, max: 0.4, step: 0.01, def: 0.14 },
  { key: 'spin', label: 'Поворот пятен', group: GROUP_ANIMATION, min: 0, max: 1.5, step: 0.05, def: 0.45 },
  { key: 'breathe', label: 'Дыхание пятен', group: GROUP_ANIMATION, min: 0, max: 0.3, step: 0.01, def: 0.06 },
  { key: 'shimmer', label: 'Мерцание клеток', group: GROUP_ANIMATION, min: 0, max: 1, step: 0.05, def: 0 },
]

export type Params = Record<SliderKey, number>
// цвет это готовый пресет или свой цвет из color-picker, color всегда хранит выбранный цвет, alpha прозрачность клеток
export type Preset = HueName | 'custom'
export type Settings = Params & { preset: Preset; color: string; alpha: number; animate: boolean }

const DEFAULTS: Settings = {
  preset: 'green',
  color: getAccent('green'),
  alpha: 1,
  animate: false,
  ...(Object.fromEntries(SLIDERS.map((s) => [s.key, s.def])) as Params),
}

const KEY = 'post-bg:settings'

const isPreset = (v: unknown): v is Preset => v === 'custom' || HUE_OPTIONS.some((o) => o.value === v)

// битые или устаревшие значения заменяются дефолтом, остальные поля сохраняются
const load = (): Settings => {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, unknown>
    const next = { ...DEFAULTS }
    if (isPreset(raw.preset)) next.preset = raw.preset
    if (typeof raw.color === 'string') next.color = parseHex(raw.color) ?? next.color
    if (typeof raw.alpha === 'number' && Number.isFinite(raw.alpha)) next.alpha = Math.min(Math.max(raw.alpha, 0), 1)
    if (typeof raw.animate === 'boolean') next.animate = raw.animate
    for (const s of SLIDERS) {
      const v = raw[s.key]
      if (typeof v === 'number' && Number.isFinite(v)) next[s.key] = Math.min(Math.max(v, s.min), s.max)
    }
    return next
  } catch {
    return DEFAULTS
  }
}

const save = (s: Settings) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(s))
  } catch {
    // приватный режим или переполнение, настройки живут до перезагрузки
  }
}

export const useSettings = () => {
  const [settings, setSettings] = useState(load)

  useEffect(() => save(settings), [settings])

  const update = useCallback((patch: Partial<Settings>) => setSettings((prev) => ({ ...prev, ...patch })), [])
  // сброс всего, включая выбранный цвет
  const reset = useCallback(() => setSettings(DEFAULTS), [])

  return { settings, update, reset }
}
