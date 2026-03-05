import { useState } from 'react'
import { validateLicenseKey, useLicenseKey as markLicenseKeyUsed } from './licenseUtils'
import type { LicenseKey } from './licenseUtils'
import { useLanguage } from './LanguageContext'
import { useTranslation } from './i18n'
import './SignUp.css'

interface SignUpProps {
  onSignUpSuccess: (username: string, role: string) => void
  onBackToLogin: () => void
}

interface User {
  username: string
  password: string
  role: string
}

const USERS_STORAGE_KEY = 'itemList_users'

export default function SignUp({ onSignUpSuccess, onBackToLogin }: SignUpProps) {
  const { language } = useLanguage()
  const { t } = useTranslation(language)
  const [licenseKey, setLicenseKey] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<'license' | 'details'>('license')
  const [validatedLicense, setValidatedLicense] = useState<LicenseKey | null>(null)

  const handleValidateLicense = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    setTimeout(() => {
      try {
        const licenseTrimmed = licenseKey.toUpperCase().trim()
        
        if (!licenseTrimmed) {
          setError(t('licenseRequired'))
          setIsLoading(false)
          return
        }

        const validLicense = validateLicenseKey(licenseTrimmed)

        if (!validLicense) {
          setError(t('invalidLicense'))
          setIsLoading(false)
          return
        }

        if (validLicense.status === 'used') {
          setError(t('licenseAlreadyUsed'))
          setIsLoading(false)
          return
        }

        setValidatedLicense(validLicense)
        setStep('details')
        setSuccess(t('licenseKeyValidated'))
        setTimeout(() => setSuccess(''), 2000)
      } catch (err) {
        setError('Failed to validate license key')
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }, 500)
  }

  const handleSignUp = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    setTimeout(() => {
      try {
        if (!validatedLicense) {
          setError(t('invalidLicense'))
          setIsLoading(false)
          return
        }

        // Validate inputs
        if (!username.trim()) {
          setError(t('usernameRequired'))
          setIsLoading(false)
          return
        }

        if (username.trim().length < 3) {
          setError(t('usernameMinChars'))
          setIsLoading(false)
          return
        }

        if (!password) {
          setError(t('passwordRequired'))
          setIsLoading(false)
          return
        }

        if (password.length < 6) {
          setError(t('passwordMinChars'))
          setIsLoading(false)
          return
        }

        if (password !== confirmPassword) {
          setError(t('passwordsDoNotMatch'))
          setIsLoading(false)
          return
        }

        // Check if username exists
        const existingUsers = localStorage.getItem(USERS_STORAGE_KEY)
        if (existingUsers) {
          const users = JSON.parse(existingUsers)
          if (users.some((u: User) => u.username.toLowerCase() === username.toLowerCase())) {
            setError(t('usernameAlreadyExists'))
            setIsLoading(false)
            return
          }
        }

        // Determine role from license type
        const userRole = validatedLicense.type === 'admin' ? 'admin' : 'user'

        // Create new user
        const newUser: User = {
          username: username.trim(),
          password,
          role: userRole,
        }

        const allUsers = existingUsers ? JSON.parse(existingUsers) : []
        allUsers.push(newUser)
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(allUsers))

        // Mark license as used
        markLicenseKeyUsed(validatedLicense.key, username.trim())

        // Reset form and proceed
        setLicenseKey('')
        setUsername('')
        setPassword('')
        setConfirmPassword('')
        setStep('license')
        setValidatedLicense(null)

        // Trigger successful signup
        onSignUpSuccess(username.trim(), userRole)
      } catch (err) {
        setError(t('invalidLicense'))
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }, 500)
  }

  return (
    <div className="signup-container">
      <div className="signup-box">
        <div className="signup-header">
          <h1>{t('createAccount')}</h1>
          <p>{t('registerWithLicense')}</p>
        </div>

        {step === 'license' ? (
          <form onSubmit={handleValidateLicense} className="signup-form">
            <div className="form-group">
              <label htmlFor="licenseKey">{t('licenseKey')} *</label>
              <input
                type="text"
                id="licenseKey"
                value={licenseKey}
                onChange={e => setLicenseKey(e.target.value.toUpperCase())}
                placeholder={t('enterLicenseKey')}
                disabled={isLoading}
                className={error ? 'input-error' : ''}
              />
              <p className="help-text">
                {t('providedByAdmin')}
              </p>
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <button type="submit" className="signup-btn" disabled={isLoading}>
              {isLoading ? t('validating') : t('validateLicenseKey')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignUp} className="signup-form">
            <div className="license-info">
              <p className="info-label">{t('licenseType')}:</p>
              <p className="info-value">
                {validatedLicense?.type === 'admin' ? t('adminAccount') : t('userAccount')}
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="username">{t('username')} *</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder={t('chooseUsername')}
                disabled={isLoading}
                className={error && error.includes(t('username')) ? 'input-error' : ''}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">{t('password')} *</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={t('createStrongPassword')}
                disabled={isLoading}
                className={error && error.includes(t('password')) ? 'input-error' : ''}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">{t('confirmPassword')} *</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder={t('confirmYourPassword')}
                disabled={isLoading}
                className={error && error.includes(t('password')) ? 'input-error' : ''}
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <div className="signup-buttons">
              <button
                type="button"
                onClick={() => {
                  setStep('license')
                  setValidatedLicense(null)
                  setError('')
                  setUsername('')
                  setPassword('')
                  setConfirmPassword('')
                }}
                className="btn-back"
                disabled={isLoading}
              >
                {t('backToLogin')}
              </button>
              <button type="submit" className="signup-btn" disabled={isLoading}>
                {isLoading ? t('creatingAccount') : t('createAccount')}
              </button>
            </div>
          </form>
        )}

        <div className="signup-footer">
          <p>{t('dontHaveAccount')} <button onClick={onBackToLogin} className="link-btn">{t('signIn')}</button></p>
        </div>
      </div>
    </div>
  )
}
