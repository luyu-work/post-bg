import { colorAt } from './color'
import { evaluateField, shimmerNoise, type Scene } from './field'
import type { GridLayout } from './layout'
import type { Palette } from './palettes'
import type { World } from './physics'
import type { Params } from './settings'

export type Snapshot = {
  scene: Scene; world: World; time: number; params: Params; alpha: number
  palettes: [Palette, Palette]; layout: GridLayout; viewport: { width: number; height: number }
}
export type ExportSource = { snapshot: () => Snapshot }

// Целые клетки заполняют кадр без обрезки. Остаток распределяется по пикселям.
export function fitExportAxis(total: number, cell: number, requestedGap: number) {
  const preferred = Math.max(1, Math.round(cell))
  const gap = Math.min(Math.max(0, Math.round(requestedGap)), Math.max(0, total - 1))
  const capacity = Math.floor((total + gap) / (1 + gap))
  const count = Math.max(1, Math.min(capacity, Math.round((total + gap) / (preferred + gap))))
  const available = total - gap * (count - 1)
  return {
    count,
    start: (index: number) => Math.floor(index * available / count) + index * gap,
    size: (index: number) => Math.floor((index + 1) * available / count) - Math.floor(index * available / count),
  }
}

export function drawFrame(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, s: Snapshot, width: number, height: number) {
  const l = s.layout
  const x = fitExportAxis(width, l.width, l.gap)
  const y = fitExportAxis(height, l.height, l.gap)
  ctx.fillStyle = '#080808'
  ctx.fillRect(0, 0, width, height)
  const field = evaluateField(s.world, l.cols, l.rows, s.params, s.time)
  for (let row = 0; row < y.count; row++) {
    for (let col = 0; col < x.count; col++) {
      const sourceCol = Math.min(l.cols - 1, Math.floor((col + .5) * l.cols / x.count))
      const sourceRow = Math.min(l.rows - 1, Math.floor((row + .5) * l.rows / y.count))
      const i = sourceRow * l.cols + sourceCol
      const w = x.size(col), h = y.size(row)
      ctx.fillStyle = colorAt(s.palettes, field.vals[i], field.mixes[i], shimmerNoise(s.scene.noise[i], s.params.shimmer, s.time), s.params, s.alpha)
      ctx.beginPath()
      ctx.roundRect(x.start(col), y.start(row), w, h, Math.min(s.params.radius, w / 2, h / 2))
      ctx.fill()
    }
  }
}
export async function png(s: Snapshot, width: number, height: number): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = width; canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas недоступен')
  drawFrame(ctx, s, width, height)
  return new Promise((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('Не удалось создать PNG')), 'image/png'))
}

export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url; link.download = name
  document.body.append(link); link.click(); link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}
