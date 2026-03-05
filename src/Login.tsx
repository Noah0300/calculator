import { useState } from 'react'
import { useLanguage } from './LanguageContext'
import { useTranslation } from './i18n'
import './Login.css'

interface LoginProps {
  onLoginSuccess: (username: string, role: string) => void
  onShowSignUp: () => void
}

interface User {
  username: string
  password: string
  role: string
}

const USERS_STORAGE_KEY = 'itemList_users'
const DEFAULT_ADMIN = { username: 'admin', password: 'admin123', role: 'admin' }

export default function Login({ onLoginSuccess, onShowSignUp }: LoginProps) {
  const { language } = useLanguage()
  const { t } = useTranslation(language)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Initialize default admin user if no users exist
  const initializeDefaultUsers = () => {
    const existingUsers = localStorage.getItem(USERS_STORAGE_KEY)
    if (!existingUsers) {
      const defaultUsers = [DEFAULT_ADMIN]
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(defaultUsers))
      return defaultUsers
    }
    return JSON.parse(existingUsers)
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Simulate network delay
    setTimeout(() => {
      try {
        // Validate inputs
        if (!username.trim() || !password.trim()) {
          setError(t('pleaseEnterBoth'))
          setIsLoading(false)
          return
        }

        // Initialize and get users
        const users = initializeDefaultUsers()

        // Find matching user
        const user = users.find(
          (u: User) => u.username.toLowerCase() === username.toLowerCase() && u.password === password
        )

        if (user) {
          // Successful login
          onLoginSuccess(user.username, user.role)
          setUsername('')
          setPassword('')
        } else {
          setError(t('invalidUsernamePassword'))
        }
      } catch (err) {
        setError(t('invalidUsernamePassword'))
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }, 500)
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>{t('itemCostCalculator')}</h1>
          <p>{t('signIn')}</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">{t('username')}</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder={t('enterUsername')}
              disabled={isLoading}
              className={error ? 'input-error' : ''}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t('password')}</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={t('enterPassword')}
              disabled={isLoading}
              className={error ? 'input-error' : ''}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-btn" disabled={isLoading}>
            {isLoading ? t('signingIn') : t('signIn')}
          </button>
        </form>

        <div className="login-footer">
          <p className="demo-text">{t('demoCredentials')}:</p>
          <p className="demo-credentials">
            <strong>Username:</strong> admin<br />
            <strong>Password:</strong> admin123
          </p>
          <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', color: '#666' }}>
            {t('dontHaveAccount')} <button onClick={onShowSignUp} className="link-btn">{t('signUpWithLicense')}</button>
          </p>
        </div>
      </div>
    </div>
  )
}
