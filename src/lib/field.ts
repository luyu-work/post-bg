type Blob = {
  x: number
  y: number
  rx: number
  ry: number
  rot: number
  p1: number
  p2: number
  p3: number
  a: number
  pal: number
}

export type Field = { vals: Float32Array; mixes: Float32Array }

// 2-3 крупных пятна, края волнообразно изогнуты
export const createField = (cols: number, rows: number): Field => {
  const m = Math.min(cols, rows)
  const blobs: Blob[] = Array.from({ length: 2 + ((Math.random() * 2) | 0) }, () => ({
    x: Math.random() * cols,
    y: Math.random() * rows,
    rx: m * (0.35 + Math.random() * 0.35),
    ry: m * (0.25 + Math.random() * 0.3),
    rot: Math.random() * Math.PI,
    p1: Math.random() * 6.28,
    p2: Math.random() * 6.28,
    p3: Math.random() * 6.28,
    a: 0.75 + Math.random() * 0.25,
    pal: 0,
  }))
  // палитры чередуются по пятнам, у первого случайная
  const first = Math.random() < 0.5 ? 0 : 1
  blobs.forEach((b, k) => (b.pal = (first + k) % 2))

  const vals = new Float32Array(cols * rows)
  const mixes = new Float32Array(cols * rows)
  for (let i = 0; i < vals.length; i++) {
    const x = i % cols
    const y = (i / cols) | 0
    let rest = 1
    let wsum = 0.05
    let wpal = 0.05 * first
    for (const b of blobs) {
      const dx = x - b.x
      const dy = y - b.y
      const c = Math.cos(b.rot)
      const s = Math.sin(b.rot)
      const u = (dx * c + dy * s) / b.rx
      const v = (-dx * s + dy * c) / b.ry
      const th = Math.atan2(v, u)
      const wob =
        1 + 0.22 * Math.sin(2 * th + b.p1) + 0.14 * Math.sin(3 * th + b.p2) + 0.06 * Math.sin(5 * th + b.p3)
      const r = Math.hypot(u, v) / wob
      const g = b.a * Math.exp(-Math.pow(r, 2.6) * 1.5)
      rest *= 1 - g
      wsum += g
      wpal += g * b.pal
    }
    mixes[i] = wpal / wsum
    vals[i] = 0.12 + 0.78 * (1 - rest) + (Math.random() - 0.5) * 0.14
  }
  return { vals, mixes }
}
