import { useState } from 'react'
import { validateLicenseKey, useLicenseKey } from './licenseUtils'
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
  const [licenseKey, setLicenseKey] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<'license' | 'details'>('license')
  const [validatedLicense, setValidatedLicense] = useState<any>(null)

  const handleValidateLicense = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    setTimeout(() => {
      try {
        const licenseTrimmed = licenseKey.toUpperCase().trim()
        
        if (!licenseTrimmed) {
          setError('Please enter a license key')
          setIsLoading(false)
          return
        }

        const validLicense = validateLicenseKey(licenseTrimmed)

        if (!validLicense) {
          setError('Invalid or expired license key. Please check and try again.')
          setIsLoading(false)
          return
        }

        if (validLicense.status === 'used') {
          setError('This license key has already been used')
          setIsLoading(false)
          return
        }

        setValidatedLicense(validLicense)
        setStep('details')
        setSuccess('License key validated! Please create your account.')
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
        // Validate inputs
        if (!username.trim()) {
          setError('Username is required')
          setIsLoading(false)
          return
        }

        if (username.trim().length < 3) {
          setError('Username must be at least 3 characters')
          setIsLoading(false)
          return
        }

        if (!password) {
          setError('Password is required')
          setIsLoading(false)
          return
        }

        if (password.length < 6) {
          setError('Password must be at least 6 characters')
          setIsLoading(false)
          return
        }

        if (password !== confirmPassword) {
          setError('Passwords do not match')
          setIsLoading(false)
          return
        }

        // Check if username exists
        const existingUsers = localStorage.getItem(USERS_STORAGE_KEY)
        if (existingUsers) {
          const users = JSON.parse(existingUsers)
          if (users.some((u: User) => u.username.toLowerCase() === username.toLowerCase())) {
            setError('Username already exists')
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
        useLicenseKey(validatedLicense.key, username.trim())

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
        setError('Failed to create account')
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
          <h1>Create Account</h1>
          <p>Register with your license key</p>
        </div>

        {step === 'license' ? (
          <form onSubmit={handleValidateLicense} className="signup-form">
            <div className="form-group">
              <label htmlFor="licenseKey">License Key *</label>
              <input
                type="text"
                id="licenseKey"
                value={licenseKey}
                onChange={e => setLicenseKey(e.target.value.toUpperCase())}
                placeholder="Enter your license key (e.g., XXXX-XXXX-XXXX-XXXX)"
                disabled={isLoading}
                className={error ? 'input-error' : ''}
              />
              <p className="help-text">
                Enter the license key provided by your administrator
              </p>
            </div>

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <button type="submit" className="signup-btn" disabled={isLoading}>
              {isLoading ? 'Validating...' : 'Validate License Key'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignUp} className="signup-form">
            <div className="license-info">
              <p className="info-label">License Type:</p>
              <p className="info-value">
                {validatedLicense?.type === 'admin' ? '🔑 Admin Account' : '👤 User Account'}
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="username">Username *</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Choose your username"
                disabled={isLoading}
                className={error && error.includes('Username') ? 'input-error' : ''}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Create a strong password (min 6 chars)"
                disabled={isLoading}
                className={error && error.includes('Password') ? 'input-error' : ''}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password *</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                disabled={isLoading}
                className={error && error.includes('match') ? 'input-error' : ''}
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
                Back
              </button>
              <button type="submit" className="signup-btn" disabled={isLoading}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </form>
        )}

        <div className="signup-footer">
          <p>Already have an account? <button onClick={onBackToLogin} className="link-btn">Sign in</button></p>
        </div>
      </div>
    </div>
  )
}
