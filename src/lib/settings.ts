import { useCallback, useEffect, useState } from 'react'
import { HUE_OPTIONS, type HueName } from './palettes'

// все настройки лежат в одном объекте, новая настройка = новое поле здесь и в DEFAULTS
export type Settings = {
  hue: HueName
}

const DEFAULTS: Settings = {
  hue: 'green',
}

const KEY = 'post-bg:settings'

const isHue = (v: unknown): v is HueName => HUE_OPTIONS.some((o) => o.value === v)

// битые или устаревшие значения заменяются дефолтом, остальные поля сохраняются
const load = (): Settings => {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Record<keyof Settings, unknown>>
    return { hue: isHue(raw.hue) ? raw.hue : DEFAULTS.hue }
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

  return [settings, update] as const
}
