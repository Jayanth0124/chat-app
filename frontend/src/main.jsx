/**
 * Orbit - Secure Real-Time Messaging Platform
 * Developed by Donavalli Jayanth
 * Portfolio: https://djayanth.site
 * GitHub: https://github.com/Jayanth0124
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

// Initialize theme from localStorage
const savedTheme = localStorage.getItem('orbit-theme') || 'deep-space';
document.documentElement.className = `h-full theme-${savedTheme}`;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

