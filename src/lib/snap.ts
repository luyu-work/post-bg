import { useEffect, useState } from 'react'

const BUTTON = 28
const ICON = 16

// размеры в физических пикселях, разница кнопки и иконки четная, иконка встает ровно по центру
const snap = () => {
  const dpr = window.devicePixelRatio || 1
  const button = Math.round(BUTTON * dpr)
  let icon = Math.round(ICON * dpr)
  if ((button - icon) % 2) icon += 1
  return { button: button / dpr, icon: icon / dpr }
}

export const useSnappedSize = () => {
  const [size, setSize] = useState(snap)
  useEffect(() => {
    const onResize = () => setSize(snap())
    addEventListener('resize', onResize)
    return () => removeEventListener('resize', onResize)
  }, [])
  return size
}
