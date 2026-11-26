import { GIFEncoder, quantize, applyPalette } from 'gifenc'
import { drawFrame, type Snapshot } from './export'
import { createLoop } from './loop'

self.onmessage = (event: MessageEvent<{ snapshot: Snapshot; width: number; height: number; seconds: number }>) => {
  try {
    const { snapshot: s, width, height, seconds } = event.data
    const canvas = new OffscreenCanvas(width, height)
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) throw new Error('Canvas недоступен')
    const gif = GIFEncoder()
    const loop = createLoop(s, seconds, 20)
    for (let i = 0; i < loop.count; i++) {
      drawFrame(ctx, loop.at(i), width, height)
      const rgba = ctx.getImageData(0, 0, width, height).data
      const palette = quantize(rgba, 256)
      gif.writeFrame(applyPalette(rgba, palette), width, height, { palette, delay: 50, repeat: 0 })
      self.postMessage({ progress: Math.round((i + 1) / loop.count * 100) })

    }
    gif.finish()
    self.postMessage({ blob: new Blob([gif.bytes()], { type: 'image/gif' }) })
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : 'Не удалось создать GIF' })
  }
}
