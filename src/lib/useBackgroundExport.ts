import { useEffect, useRef, useState, type RefObject } from 'react'
import { download, png, type ExportSource } from './export'
import { emptyExportErrors, updateExportError, clearExportErrors, type ExportFormat } from './exportErrors'

// Размеры и связь каждой группы живут независимо, даже при закрытии меню.
function useExportDimensions(maxPixels: number) {
  const [w, setW] = useState('1920'), [h, setH] = useState('1080')
  const [linked, setLinked] = useState(false)
  const width = Number(w), height = Number(h)
  const valid = /^\d+$/.test(w) && /^\d+$/.test(h) && width > 0 && height > 0 && width <= 8192 && height <= 8192 && width * height <= maxPixels
  const change = (axis: 'w' | 'h', value: string) => {
    if (axis === 'w' || linked) setW(value)
    if (axis === 'h' || linked) setH(value)
  }
  const toggleLink = () => { setLinked(!linked); if (!linked) setH(w) }
  return { w, h, linked, valid, change, toggleLink }
}

export function useBackgroundExport(source: RefObject<ExportSource | null>) {
  const image = useExportDimensions(16_777_216)
  const animation = useExportDimensions(2_097_152)
  const [seconds, updateSeconds] = useState(4)
  const [busy, setBusy] = useState<'png' | 'gif' | 'video' | null>(null)
  const [progress, setProgress] = useState(0)
  const [errors, setErrors] = useState(emptyExportErrors)
  const setError = (format: ExportFormat, message: string) => setErrors(prev => updateExportError(prev, format, message))
  const clearErrors = (formats: ExportFormat[]) => setErrors(prev => clearExportErrors(prev, formats))
  const imageControls = { ...image, change: (axis: 'w' | 'h', value: string) => { image.change(axis, value); clearErrors(['png']) }, toggleLink: () => { image.toggleLink(); clearErrors(['png']) } }
  const animationControls = { ...animation, change: (axis: 'w' | 'h', value: string) => { animation.change(axis, value); clearErrors(['gif', 'video']) }, toggleLink: () => { animation.toggleLink(); clearErrors(['gif', 'video']) } }
  const setSeconds = (value: number) => { updateSeconds(value); clearErrors(['gif', 'video']) }
  const worker = useRef<Worker | null>(null)
  const active = useRef(false)
  useEffect(() => () => { worker.current?.terminate() }, [])
  const finish = () => { worker.current?.terminate(); worker.current = null; active.current = false; setBusy(null) }
  const cancel = finish
  const start = async (format: 'png' | 'gif' | 'video') => {
    const dimensions = format === 'png' ? image : animation
    if (active.current || !dimensions.valid) return
    const width = Number(dimensions.w), height = Number(dimensions.h)
    active.current = true; setBusy(format); setError(format, ''); setProgress(0)
    try {
      if (!source.current) throw new Error('Фон ещё не готов')
      const snapshot = source.current.snapshot()
      if (format === 'png') {
        download(await png(snapshot, width, height), `post-bg-${width}x${height}.png`)
        setError(format, '')
        finish()
      } else {
        const task = format === 'video'
          ? new Worker(new URL('./video.worker.ts', import.meta.url), { type: 'module' })
          : new Worker(new URL('./export.worker.ts', import.meta.url), { type: 'module' })
        worker.current = task
        task.onmessage = ({ data }) => {
          if (data.error) { setError(format, data.error); finish() }
          else if (data.blob) { setError(format, ''); download(data.blob, `post-bg-${width}x${height}.${format === 'video' ? 'webm' : 'gif'}`); finish() }
          else setProgress(data.progress)
        }
        task.onerror = () => { setError(format, 'Не удалось завершить экспорт. Попробуйте ещё раз.'); finish() }
        task.postMessage({ snapshot, width, height, seconds })
      }
    } catch (e) {
      if (!(e instanceof DOMException && e.name === 'AbortError')) setError(format, e instanceof Error ? e.message : 'Ошибка экспорта')
      finish()
    }
  }
  return { ...imageControls, animation: animationControls, seconds, setSeconds, busy, progress, errors, motionValid: animation.valid, start, cancel }
}
export type BackgroundExport = ReturnType<typeof useBackgroundExport>
