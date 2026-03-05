import { useLanguage } from './LanguageContext'
import './LanguageSwitcher.css'

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage()

  return (
    <div className="language-switcher">
      <button
        className={`lang-btn ${language === 'en' ? 'active' : ''}`}
        onClick={() => setLanguage('en')}
        title="Switch to English"
      >
        EN
      </button>
      <button
        className={`lang-btn ${language === 'nl' ? 'active' : ''}`}
        onClick={() => setLanguage('nl')}
        title="Overschakelen naar Nederlands"
      >
        NL
      </button>
    </div>
  )
}
