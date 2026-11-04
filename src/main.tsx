import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/onest/cyrillic-400.css'
import '@fontsource/onest/cyrillic-500.css'
import '@fontsource/onest/latin-400.css'
import '@fontsource/onest/latin-500.css'
import './index.css'
import { App } from './App'

// масштаб экрана для CSS, чтобы размеры можно было округлять до целых физических пикселей
const syncDpr = () => document.documentElement.style.setProperty('--dpr', String(window.devicePixelRatio || 1))
syncDpr()
window.addEventListener('resize', syncDpr)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
