import { useCallback, useEffect, useState } from 'react'
import { HUE_OPTIONS, type HueName } from './palettes'

export type SliderKey =
  | 'brightness'
  | 'contrast'
  | 'shift'
  | 'saturation'
  | 'noise'
  | 'noiseLight'
  | 'blobs'
  | 'blobSize'
  | 'edgeSharp'
  | 'wobble'
  | 'base'
  | 'power'
  | 'cellSize'
  | 'gap'
  | 'radius'
  | 'pad'

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
  { key: 'brightness', label: 'Яркость', group: 'Цвет', min: 0.3, max: 1.6, step: 0.01, def: 1 },
  { key: 'contrast', label: 'Контраст', group: 'Цвет', min: 0.5, max: 2, step: 0.01, def: 1 },
  { key: 'shift', label: 'Баланс света', group: 'Цвет', min: -0.3, max: 0.3, step: 0.01, def: 0 },
  { key: 'saturation', label: 'Насыщенность', group: 'Цвет', min: 0, max: 2, step: 0.01, def: 1 },

  { key: 'noise', label: 'Шум', group: 'Шум', min: 0, max: 0.6, step: 0.01, def: 0.14 },
  { key: 'noiseLight', label: 'Шум в светлых', group: 'Шум', min: 0, max: 4, step: 0.1, def: 1.2 },

  { key: 'blobs', label: 'Количество пятен', group: 'Пятна', min: 1, max: 8, step: 1, def: 3 },
  { key: 'blobSize', label: 'Размер пятен', group: 'Пятна', min: 0.3, max: 2, step: 0.01, def: 1 },
  { key: 'edgeSharp', label: 'Резкость края', group: 'Пятна', min: 1, max: 6, step: 0.1, def: 2.6 },
  { key: 'wobble', label: 'Искажение края', group: 'Пятна', min: 0, max: 3, step: 0.05, def: 1 },
  { key: 'base', label: 'Яркость фона', group: 'Пятна', min: 0, max: 0.5, step: 0.01, def: 0.12 },
  { key: 'power', label: 'Сила пятен', group: 'Пятна', min: 0.2, max: 1, step: 0.01, def: 0.78 },

  { key: 'cellSize', label: 'Размер клетки', group: 'Сетка', min: 8, max: 40, step: 1, def: 18 },
  { key: 'gap', label: 'Зазор', group: 'Сетка', min: 1, max: 8, step: 1, def: 2 },
  { key: 'radius', label: 'Скругление', group: 'Сетка', min: 0, max: 9, step: 0.5, def: 2 },
  { key: 'pad', label: 'Отступ от края', group: 'Сетка', min: 0, max: 40, step: 1, def: 2 },
]

export type Params = Record<SliderKey, number>
export type Settings = Params & { hue: HueName }

const DEFAULTS: Settings = {
  hue: 'green',
  ...(Object.fromEntries(SLIDERS.map((s) => [s.key, s.def])) as Params),
}

const KEY = 'post-bg:settings'

const isHue = (v: unknown): v is HueName => HUE_OPTIONS.some((o) => o.value === v)

// битые или устаревшие значения заменяются дефолтом, остальные поля сохраняются
const load = (): Settings => {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Record<string, unknown>
    const next = { ...DEFAULTS }
    if (isHue(raw.hue)) next.hue = raw.hue
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
  // сброс слайдеров, выбранный цвет остается
  const reset = useCallback(() => setSettings((prev) => ({ ...DEFAULTS, hue: prev.hue })), [])

  return { settings, update, reset }
}
