import type { Snapshot } from './export'
import { stepWorld } from './physics'

// Косинусная развёртка: вперёд и обратно с нулевой скоростью на разворотах.
// Храним только состояния физики половины цикла, а не растровые кадры.
export function createLoop(s: Snapshot, seconds: number, fps: number) {
  const count = Math.round(seconds * fps)
  const half = count / 2
  const frames: Snapshot[] = []
  const state = structuredClone(s)
  const startTime = state.time
  let previous = 0
  for (let i = 0; i <= half; i++) {
    const target = seconds * s.params.speed / Math.PI * (1 - Math.cos(2 * Math.PI * i / count)) / 2
    let remaining = target - previous
    while (remaining > 1e-9) {
      const dt = Math.min(remaining, 1 / 120)
      stepWorld(state.world, state.scene, dt, state.params)
      remaining -= dt
    }
    state.time = startTime + target
    frames.push({ ...s, world: structuredClone(state.world), time: state.time })
    previous = target
  }
  return {
    count,
    at: (index: number) => {
      const phase = ((index % count) + count) % count
      return frames[phase <= half ? phase : count - phase]
    },
  }
}
