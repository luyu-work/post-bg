import { memo, useMemo, type CSSProperties } from 'react'
import { colorAt } from '../../lib/color'
import { createField } from '../../lib/field'
import { getPalettes, type HueName } from '../../lib/palettes'
import { useGridLayout } from './useGridLayout'
import './SquaresGrid.css'

type Props = { hue: HueName }

// memo, чтобы открытие настроек не перерисовывало тысячи клеток
export const SquaresGrid = memo(({ hue }: Props) => {
  const layout = useGridLayout()
  const { width, height, gap, cols, rows, offX, offY } = layout

  // поле пятен случайное, пересоздается при смене цвета и ресайзе
  const colors = useMemo(() => {
    const palettes = getPalettes(hue)
    const { vals, mixes, noise } = createField(layout.cols, layout.rows)
    return Array.from(vals, (v, i) => colorAt(palettes, v, mixes[i], noise[i]))
  }, [hue, layout])

  const style: CSSProperties = {
    '--cell-w': `${width}px`,
    '--cell-h': `${height}px`,
    gap: `${gap}px`,
    gridTemplateColumns: `repeat(${cols}, ${width}px)`,
    gridTemplateRows: `repeat(${rows}, ${height}px)`,
    padding: `${offY}px 0 0 ${offX}px`,
  } as CSSProperties

  return (
    <div className="squares-grid" style={style}>
      {colors.map((background, i) => (
        <div key={i} className="squares-grid__cell" style={{ background }} />
      ))}
    </div>
  )
})
