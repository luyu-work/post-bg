const GAP = 2
const PAD = 8

export type GridLayout = {
  size: number
  gap: number
  cols: number
  rows: number
  offX: number
  offY: number
}

// все размеры считаются в физических пикселях, иначе при дробном масштабе экрана зазоры плывут
export const computeLayout = (): GridLayout => {
  const dpr = window.devicePixelRatio || 1
  const gap = Math.max(1, Math.round(GAP * dpr))
  const pad = Math.round(PAD * dpr)
  const w = Math.floor(innerWidth * dpr) - pad * 2
  const h = Math.floor(innerHeight * dpr) - pad * 2

  let best: { sz: number; c: number; r: number; left: number } | null = null
  for (let sz = Math.round(10 * dpr); sz <= Math.round(18 * dpr); sz++) {
    const c = Math.max(1, Math.floor((w + gap) / (sz + gap)))
    const r = Math.max(1, Math.floor((h + gap) / (sz + gap)))
    const left = w + gap - c * (sz + gap) + (h + gap - r * (sz + gap))
    if (!best || left < best.left) best = { sz, c, r, left }
  }
  const { sz, c: cols, r: rows } = best!

  const px = (v: number) => v / dpr
  return {
    size: px(sz),
    gap: px(gap),
    cols,
    rows,
    offX: px(pad + Math.floor((w + gap - cols * (sz + gap)) / 2)),
    offY: px(pad + Math.floor((h + gap - rows * (sz + gap)) / 2)),
  }
}
