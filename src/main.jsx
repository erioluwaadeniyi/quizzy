import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import SimpleApp from './SimpleApp.jsx'
import LandingPage from './LandingPage.jsx'
import { trackEvent } from './analytics.js'

trackEvent('page_view')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {location.pathname === '/' ? <LandingPage /> : <SimpleApp />}
  </StrictMode>,
)
