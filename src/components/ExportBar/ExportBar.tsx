import { useState } from 'react'
import { Select } from '../Select/Select'
import { Slider } from '../Slider'
import type { BackgroundExport } from '../../lib/useBackgroundExport'
import './ExportBar.css'

export function ExportBar({ controls: c }: { controls: BackgroundExport }) {
  return <section className="export-bar" aria-label="Экспорт PNG">
    <ExportSize controls={c} />
    <button className="export-bar__download" disabled={!c.valid || !!c.busy} onClick={() => void c.start('png')}>
      <span>{c.busy === 'png' ? 'Подготовка…' : 'Скачать PNG'}</span>
    </button>
    {(!c.valid || c.errors.png) && <p className="export-bar__note" role="alert">{c.errors.png || 'Целые размеры: 1–8192 px, до 16 Мп.'}</p>}
  </section>
}

function ExportSize({ controls: c, animation = false }: { controls: BackgroundExport; animation?: boolean }) {
  return (
    <div className="export-bar__size export-size" role="group" aria-label={animation ? 'Размер анимации' : 'Размер PNG'}>
      <label className="export-bar__field">W<input aria-label={animation ? 'Ширина анимации' : 'Ширина'} type="number" min="1" max="8192" step="1" value={c.w} disabled={!!c.busy} onChange={e => c.change('w', e.target.value)} aria-invalid={!c.valid} /></label>
      <button className="export-bar__link" type="button" aria-label={animation ? 'Связать размеры анимации' : 'Связать ширину и высоту'} aria-pressed={c.linked} disabled={!!c.busy} title="Одинаковые ширина и высота" onClick={c.toggleLink}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m9 15 6-6M8 16l-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m2 10a4 4 0 0 0 6 0l4-4a4 4 0 0 0-6-6l-1 1" transform="translate(1 0) scale(.9)" /></svg>
      </button>
      <label className="export-bar__field">H<input aria-label={animation ? 'Высота анимации' : 'Высота'} type="number" min="1" max="8192" step="1" value={c.h} disabled={!!c.busy} onChange={e => c.change('h', e.target.value)} aria-invalid={!c.valid} /></label>
    </div>
  )
}

export function AnimationExport({ controls }: { controls: BackgroundExport }) {
  const c = { ...controls, ...controls.animation }
  const [format, setFormat] = useState<'video' | 'gif'>('video')
  return <div className="animation-export">
    <Slider disabled={!!c.busy} label="Длительность, сек" value={c.seconds} min={1} max={10} step={1} onChange={v => { if (!c.busy) c.setSeconds(v) }} />
    <div className="animation-export__format"><span>Формат</span>
      <Select label="Формат анимации" value={format} options={[{ value: 'video', label: 'Видео' }, { value: 'gif', label: 'GIF' }]} disabled={!!c.busy} onChange={v => setFormat(v as 'video' | 'gif')} />
    </div>
    <div className="animation-export__size">
      <span className="slider__label">Размер, px</span>
      <ExportSize controls={c} animation />
    </div>
    <button className="export-bar__download" disabled={!c.motionValid || !!c.busy} onClick={() => void c.start(format)}>{c.busy && c.busy !== 'png' ? `Создание: ${c.progress}%` : format === 'video' ? 'Скачать видео' : 'Скачать GIF'}</button>
    {c.busy && c.busy !== 'png' && <button className="animation-export__cancel" onClick={c.cancel}>Отменить экспорт</button>}
    <p className="export-bar__note" role="status">{c.errors[format] || (!c.motionValid ? 'Для анимации — до 2 Мп, включая 1920 × 1080.' : `${c.w} × ${c.h} · ${c.seconds} с · бесшовный цикл · ${format === 'video' ? '60 кадров/с · WebM.' : '20 кадров/с · GIF.'}`)}</p>
  </div>
}
