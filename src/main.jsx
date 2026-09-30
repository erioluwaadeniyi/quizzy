import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App3 from './App3.jsx'
import { trackEvent } from './analytics.js'

trackEvent('page_view')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App3 />
  </StrictMode>,
)
