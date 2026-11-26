// Браузерная регрессия: npm run dev → /tests/video-playback.html.
// Проверяет реальный HTMLVideoElement, а не только декодирование через WebCodecs.
import { Input, BufferSource, ALL_FORMATS } from 'mediabunny'
import { createScene } from '../src/lib/field'
import { createWorld } from '../src/lib/physics'
import { SLIDERS, type Params } from '../src/lib/settings'
import { getPalettes } from '../src/lib/palettes'
import type { Snapshot } from '../src/lib/export'

const button = document.querySelector<HTMLButtonElement>('#run')!
const result = document.querySelector<HTMLPreElement>('#result')!
const video = document.querySelector<HTMLVideoElement>('#video')!

async function encode(): Promise<Blob> {
  const scene = createScene(96, 54)
  const snapshot: Snapshot = {
    scene, world: createWorld(scene, 96, 54, 3), time: 0,
    params: Object.fromEntries(SLIDERS.map(s => [s.key, s.def])) as Params,
    alpha: 1, palettes: getPalettes('green'),
    layout: { width: 18, height: 18, gap: 2, cols: 96, rows: 54, offX: 0, offY: 0 },
    viewport: { width: 1920, height: 1080 },
  }
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('../src/lib/video.worker.ts', import.meta.url), { type: 'module' })
    const finish = (error?: Error, blob?: Blob) => {
      clearTimeout(timeout)
      worker.terminate()
      if (error) reject(error)
      else resolve(blob!)
    }
    const timeout = setTimeout(() => finish(new Error('Encoding timeout')), 120_000)
    worker.onmessage = ({ data }) => {
      if (data.error) finish(new Error(data.error))
      else if (data.blob) finish(undefined, data.blob)
    }
    worker.onerror = e => finish(new Error(e.message))
    worker.postMessage({ snapshot, width: 1920, height: 1080, seconds: 1 })
  })
}

function ended(): Promise<void> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timeout)
      video.removeEventListener('ended', success)
      video.removeEventListener('error', failure)
    }
    const success = () => { cleanup(); resolve() }
    const failure = () => { cleanup(); reject(new Error(video.error?.message || 'Playback failed')) }
    const timeout = setTimeout(() => { cleanup(); reject(new Error('Playback timeout')) }, 15_000)
    video.addEventListener('ended', success)
    video.addEventListener('error', failure)
  })
}

button.addEventListener('click', async () => {
  button.disabled = true
  result.textContent = 'Кодирование…'
  let url: string | undefined
  try {
    const blob = await encode()
    const input = new Input({ source: new BufferSource(await blob.arrayBuffer()), formats: ALL_FORMATS })
    try {
      const track = await input.getPrimaryVideoTrack()
      if (!track) throw new Error('Missing video track')
      const config = await track.getDecoderConfig()
      if (config?.codec.startsWith('vp09.') && !config.codec.startsWith('vp09.00.')) throw new Error('Incompatible VP9 profile')
      const stats = await track.computePacketStats()
      if (stats.packetCount !== 60 || stats.averagePacketRate !== 60) throw new Error('Expected 60 FPS')
      result.textContent = `PASS: ${config?.codec}, 60 FPS\nПроверка воспроизведения…`
    } finally { input.dispose() }
    url = URL.createObjectURL(blob)
    video.src = url
    const playback = ended()
    // Обрабатываем оба promise, даже если play() отклонён раньше ended().
    await Promise.all([video.play(), playback])
    if (video.videoWidth !== 1920 || video.videoHeight !== 1080 || video.currentTime < .9) throw new Error('Incomplete playback')
    result.textContent += '\nPASS: HTMLVideoElement воспроизвёл 1920 × 1080 до конца без ошибок'
  } catch (error) {
    result.textContent += `\nFAIL: ${String(error)}`
  } finally {
    if (url) URL.revokeObjectURL(url)
    button.disabled = false
  }
})
