import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Auto-reload on chunk load failure (stale SW after deploy)
window.addEventListener('vite:preloadError', () => window.location.reload())

// La rueda del mouse sobre un <input type="number"> enfocado le cambia el valor en silencio:
// al scrollear se desenfoca, así ningún importe se altera solo
document.addEventListener('wheel', () => {
  const el = document.activeElement
  if (el instanceof HTMLInputElement && el.type === 'number') el.blur()
}, { passive: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
