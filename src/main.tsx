import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import LanguageSwitcher from './LanguageSwitcher'
import { LanguageProvider } from './LanguageContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <LanguageSwitcher />
      <App />
    </LanguageProvider>
  </StrictMode>,
)
