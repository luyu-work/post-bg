import { Output, BufferTarget, WebMOutputFormat, CanvasSource, Quality, canEncodeVideo } from 'mediabunny'
import { drawFrame, type Snapshot } from './export'
import { createLoop } from './loop'

self.onmessage = async (event: MessageEvent<{ snapshot: Snapshot; width: number; height: number; seconds: number }>) => {
  let output: Output | undefined
  try {
    const { snapshot, width, height, seconds } = event.data
    if (typeof VideoEncoder === 'undefined') throw new Error('Для видео 60 FPS нужен браузер с WebCodecs. Попробуйте актуальный Chrome или Edge.')
    const quality = new Quality({ quantizer: 0, bitrate: 48_000_000 })
    // Стандартный Profile 0: поддержка кодировщиком Profile 1 ещё не означает,
    // что скачанный файл воспроизведётся в обычном видеоплеере.
    const codec = await canEncodeVideo('vp9', { width, height, frameRate: 60, quality }) ? 'vp9' : 'vp8'
    if (codec === 'vp8' && !await canEncodeVideo('vp8', { width, height, frameRate: 60, quality })) {
      throw new Error('Браузер не поддерживает экспорт видео с выбранными размерами')
    }
    const canvas = new OffscreenCanvas(width, height)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas недоступен')
    const target = new BufferTarget()
    output = new Output({ format: new WebMOutputFormat(), target })
    // Сохраняем резкие границы клеток: минимальное квантование для VP9,
    // с повышенным битрейтом для кодировщиков без управления квантованием.
    const source = new CanvasSource(canvas, {
      codec,
      quality,
      latencyMode: 'quality',
      contentHint: 'detail',
      keyFrameInterval: 1,
    })
    output.addVideoTrack(source, { frameRate: 60 })
    await output.start()
    const loop = createLoop(snapshot, seconds, 60)
    for (let i = 0; i < loop.count; i++) {
      drawFrame(ctx, loop.at(i), width, height)
      await source.add(i / 60, 1 / 60)
      self.postMessage({ progress: Math.round((i + 1) / loop.count * 99) })
    }
    await output.finalize()
    if (!target.buffer) throw new Error('Не удалось создать видео')
    self.postMessage({ blob: new Blob([target.buffer], { type: 'video/webm' }) })
  } catch (error) {
    await output?.cancel().catch(() => {})
    self.postMessage({ error: error instanceof Error ? error.message : 'Не удалось создать видео' })
  }
}
