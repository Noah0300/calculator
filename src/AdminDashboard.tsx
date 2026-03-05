import { useState } from 'react'
import { createLicenseKey, getLicenses, saveLicenses } from './licenseUtils'
import { useLanguage } from './LanguageContext'
import { useTranslation } from './i18n'
import type { LicenseKey } from './licenseUtils'
import './AdminDashboard.css'

interface AdminDashboardProps {
  currentUser: string
  onLogout: () => void
}

interface User {
  username: string
  password: string
  role: string
}

const USERS_STORAGE_KEY = 'itemList_users'

const loadUsersFromStorage = (): User[] => {
  try {
    const savedUsers = localStorage.getItem(USERS_STORAGE_KEY)
    return savedUsers ? JSON.parse(savedUsers) : []
  } catch (err) {
    console.error('Failed to load users:', err)
    return []
  }
}

const loadLicensesFromStorage = (): LicenseKey[] => {
  try {
    return getLicenses()
  } catch (err) {
    console.error('Failed to load licenses:', err)
    return []
  }
}

export default function AdminDashboard({ currentUser, onLogout }: AdminDashboardProps) {
  const { language } = useLanguage()
  const { t } = useTranslation(language)
  const [users, setUsers] = useState<User[]>(loadUsersFromStorage)
  const [licenses, setLicenses] = useState<LicenseKey[]>(loadLicensesFromStorage)
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState('user')
  const [licenseType, setLicenseType] = useState<'user' | 'admin'>('user')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showUserForm, setShowUserForm] = useState(false)
  const [showLicenseForm, setShowLicenseForm] = useState(false)
  const [copiedLicenseKey, setCopiedLicenseKey] = useState<string | null>(null)

  const validateNewUser = (): boolean => {
    setError('')
    setSuccess('')

    if (!newUsername.trim()) {
      setError(t('usernameRequired'))
      return false
    }

    if (newUsername.trim().length < 3) {
      setError(t('usernameMinChars'))
      return false
    }

    if (!newPassword.trim()) {
      setError(t('passwordRequired'))
      return false
    }

    if (newPassword.length < 6) {
      setError(t('passwordMinChars'))
      return false
    }

    if (users.some(u => u.username.toLowerCase() === newUsername.toLowerCase())) {
      setError(t('usernameAlreadyExists'))
      return false
    }

    return true
  }

  const handleCreateUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!validateNewUser()) {
      return
    }

    const newUser: User = {
      username: newUsername,
      password: newPassword,
      role: newRole,
    }

    try {
      const updatedUsers = [...users, newUser]
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers))
      setUsers(updatedUsers)
      setNewUsername('')
      setNewPassword('')
      setNewRole('user')
      setSuccess(`${t('userAccount')} "${newUsername}" ${t('userCreatedSuccessfully')}`)
      setTimeout(() => {
        setSuccess('')
        setShowUserForm(false)
      }, 2000)
    } catch (err) {
      setError(t('failedToCreateUser'))
      console.error(err)
    }
  }

  const handleDeleteUser = (username: string) => {
    if (username === 'admin') {
      setError(t('cannotDeleteDefault'))
      return
    }

    if (window.confirm(`${t('dontHaveAccount')} "${username}"?`)) {
      try {
        const updatedUsers = users.filter(u => u.username !== username)
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers))
        setUsers(updatedUsers)
        setSuccess(`${t('userDeletedSuccessfully')}`)
        setTimeout(() => setSuccess(''), 2000)
      } catch (err) {
        setError(t('failedToCreateUser'))
        console.error(err)
      }
    }
  }

  const handleCreateLicense = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')

    try {
      // Only main admin can create admin licenses
      if (licenseType === 'admin' && currentUser !== 'admin') {
        setError(t('onlyMainAdminCanGenerate'))
        return
      }

      const newLicense = createLicenseKey(licenseType, currentUser)
      const updatedLicenses = [...licenses, newLicense]
      saveLicenses(updatedLicenses)
      setLicenses(updatedLicenses)

      setSuccess(`${t('licenseKeyCreated')} ${newLicense.key}`)
      setTimeout(() => {
        setSuccess('')
        setShowLicenseForm(false)
      }, 3000)
    } catch (err) {
      setError(t('failedToCreateLicense'))
      console.error(err)
    }
  }

  const handleCopyLicense = (licenseKey: string) => {
    navigator.clipboard.writeText(licenseKey)
    setCopiedLicenseKey(licenseKey)
    setTimeout(() => setCopiedLicenseKey(null), 2000)
  }

  const handleDeleteLicense = (licenseId: string) => {
    if (window.confirm(t('clearAllMessage'))) {
      try {
        const updatedLicenses = licenses.filter(l => l.id !== licenseId)
        saveLicenses(updatedLicenses)
        setLicenses(updatedLicenses)
        setSuccess(t('licenseKeyRevoked'))
        setTimeout(() => setSuccess(''), 2000)
      } catch (err) {
        setError(t('failedToCreateLicense'))
        console.error(err)
      }
    }
  }

  return (
    <div className="admin-dashboard-container">
      <div className="admin-header">
        <div className="admin-title">
          <h1>{t('adminDashboard')}</h1>
          <p>{t('manageUserAccounts')}</p>
        </div>
        <div className="admin-user-info" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div>
            <span className="current-user">{t('loggedInAs')} <strong>{currentUser}</strong></span>
            <button onClick={onLogout} className="logout-btn">{t('logout')}</button>
          </div>
        </div>
      </div>

      <div className="admin-content">
        <div className="section-header">
          <h2>{t('licenseKeyManagement')}</h2>
          <button
            onClick={() => setShowLicenseForm(!showLicenseForm)}
            className="create-user-btn"
          >
            {showLicenseForm ? `✕ ${t('cancel')}` : '+ ' + t('generateLicenseKey')}
          </button>
        </div>

        {showLicenseForm && (
          <div className="create-user-form">
            <h3>{t('generateLicenseKey')}</h3>
            <form onSubmit={handleCreateLicense}>
              <div className="form-group">
                <label htmlFor="licenseType">{t('licenseType')}</label>
                <select
                  id="licenseType"
                  value={licenseType}
                  onChange={e => setLicenseType(e.target.value as 'admin' | 'user')}
                >
                  <option value="user">{t('userAccount')}</option>
                  {currentUser === 'admin' && <option value="admin">{t('adminAccount')}</option>}
                </select>
                {licenseType === 'admin' && currentUser !== 'admin' && (
                  <p style={{ color: '#e74c3c', fontSize: '12px', margin: '8px 0 0 0' }}>
                    ⚠️ {t('onlyMainAdminCanGenerate')}
                  </p>
                )}
              </div>

              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}

              <button type="submit" className="submit-btn">{t('generateLicenseKey')}</button>
            </form>
          </div>
        )}

        <div className="users-list">
          <h3>{t('activeLicenseKeys')} ({licenses.filter(l => l.status === 'active').length})</h3>
          {licenses.filter(l => l.status === 'active').length === 0 ? (
            <p className="no-users">{t('noActiveLicenses')}</p>
          ) : (
            <table className="users-table">
              <thead>
                <tr>
                  <th>{t('licenseKey')}</th>
                  <th>{t('role')}</th>
                  <th>{t('createdBy')}</th>
                  <th>{t('status')}</th>
                  <th>{t('actions')}</th>\n                </tr>
              </thead>
              <tbody>
                {licenses.filter(l => l.status === 'active').map(license => (
                  <tr key={license.id}>
                    <td>
                      <code style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                        {license.key}
                      </code>
                      <button
                        onClick={() => handleCopyLicense(license.key)}
                        style={{
                          marginLeft: '8px',
                          padding: '4px 8px',
                          fontSize: '11px',
                          backgroundColor: copiedLicenseKey === license.key ? '#27ae60' : '#3498db',
                          color: 'white',
                          border: 'none',
                          borderRadius: '3px',
                          cursor: 'pointer',
                        }}
                      >
                        {copiedLicenseKey === license.key ? '✓ ' + t('copied') : t('copy')}
                      </button>
                    </td>
                    <td>
                      <span className={`role-badge ${license.type}`}>
                        {license.type.toUpperCase()}
                      </span>
                    </td>
                    <td>{license.createdBy}</td>
                    <td>
                      <span className="role-badge user" style={{ backgroundColor: '#d5f4e6', color: '#27ae60' }}>
                        {t('active')}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleDeleteLicense(license.id)}
                        className="delete-btn"
                      >
                        {t('revoke')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="section-header" style={{ marginTop: '40px' }}>
          <h2>{t('userManagement')}</h2>
          <button
            onClick={() => setShowUserForm(!showUserForm)}
            className="create-user-btn"
          >
            {showUserForm ? `✕ ${t('cancel')}` : '+ ' + t('createNewUser')}
          </button>
        </div>

        {showUserForm && (
          <div className="create-user-form">
            <h3>{t('createNewUser')}</h3>
            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label htmlFor="username">{t('username')}</label>
                <input
                  type="text"
                  id="username"
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  placeholder={t('enterUsername')}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">{t('password')}</label>
                <input
                  type="password"
                  id="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder={t('enterPassword')}
                />
              </div>

              <div className="form-group">
                <label htmlFor="role">{t('role')}</label>
                <select
                  id="role"
                  value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                >
                  <option value="user">{t('userAccount')}</option>
                  <option value="admin">{t('adminAccount')}</option>
                </select>
              </div>

              {error && <div className="error-message">{error}</div>}
              {error && !error.includes('admin') && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}

              <button type="submit" className="submit-btn">{t('createAccount')}</button>
            </form>
          </div>
        )}

        <div className="users-list">
          <h3>{t('registeredUsers')} ({users.length})</h3>
          {users.length === 0 ? (
            <p className="no-users">{t('noUsersFound')}</p>
          ) : (
            <table className="users-table">
              <thead>
                <tr>
                  <th>{t('username')}</th>
                  <th>{t('role')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.username}>
                    <td>
                      <strong>{user.username}</strong>
                      {user.username === 'admin' && <span className="admin-badge">{t('defaultAdmin')}</span>}
                      {user.username === currentUser && <span className="current-badge">{t('currentUser')}</span>}
                    </td>
                    <td>
                      <span className={`role-badge ${user.role}`}>
                        {user.role.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleDeleteUser(user.username)}
                        className="delete-btn"
                        disabled={user.username === 'admin'}
                      >
                        {t('delete')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
