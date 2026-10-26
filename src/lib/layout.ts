export type LayoutOptions = {
  cellSize: number
  gap: number
  pad: number
}

export type GridLayout = {
  width: number
  height: number
  gap: number
  cols: number
  rows: number
  offX: number
  offY: number
}

// все размеры считаются в физических пикселях, иначе при дробном масштабе экрана зазоры плывут
export const computeLayout = (o: LayoutOptions): GridLayout => {
  const dpr = window.devicePixelRatio || 1
  const gap = Math.max(1, Math.round(o.gap * dpr))
  const pad = Math.round(o.pad * dpr)
  const w = Math.floor(innerWidth * dpr) - pad * 2
  const h = Math.floor(innerHeight * dpr) - pad * 2

  // сколько клеток помещается при размере sz и сколько пикселей остается
  const fit = (total: number, sz: number) => {
    const n = Math.max(1, Math.floor((total + gap) / (sz + gap)))
    return { n, left: total + gap - n * (sz + gap) }
  }

  // размер клетки подбирается рядом с заданным, чтобы остаток по обеим осям был минимальным,
  // ширина и высота могут отличаться на 1 физический пиксель, это на глаз незаметно
  const min = Math.max(2, Math.round((o.cellSize - 4) * dpr))
  const max = Math.round((o.cellSize + 4) * dpr)
  let best: { sx: number; sy: number; cols: number; rows: number; leftX: number; leftY: number; cost: number } | null = null
  for (let sx = min; sx <= max; sx++) {
    for (let sy = sx - 1; sy <= sx + 1; sy++) {
      if (sy < min || sy > max) continue
      const fx = fit(w, sx)
      const fy = fit(h, sy)
      const cost = fx.left + fy.left + (sx === sy ? 0 : 0.5)
      if (!best || cost < best.cost) {
        best = { sx, sy, cols: fx.n, rows: fy.n, leftX: fx.left, leftY: fy.left, cost }
      }
    }
  }
  const { sx, sy, cols, rows, leftX, leftY } = best!

  const px = (v: number) => v / dpr
  return {
    width: px(sx),
    height: px(sy),
    gap: px(gap),
    cols,
    rows,
    offX: px(pad + Math.floor(leftX / 2)),
    offY: px(pad + Math.floor(leftY / 2)),
  }
}
