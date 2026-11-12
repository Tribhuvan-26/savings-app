import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Bundled fonts: the app works offline, no Google Fonts request.
import '@fontsource/anton/400.css'
import '@fontsource/caveat/600.css'
import '@fontsource/space-grotesk/400.css'
import '@fontsource/space-grotesk/500.css'
import '@fontsource/space-grotesk/600.css'
import '@fontsource/jetbrains-mono/500.css'
import '@fontsource/jetbrains-mono/700.css'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
