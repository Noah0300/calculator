import { useState, useEffect } from 'react'
import { createLicenseKey, getLicenses, saveLicenses } from './licenseUtils'
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

export default function AdminDashboard({ currentUser, onLogout }: AdminDashboardProps) {
  const [users, setUsers] = useState<User[]>([])
  const [licenses, setLicenses] = useState<LicenseKey[]>([])
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState('user')
  const [licenseType, setLicenseType] = useState<'user' | 'admin'>('user')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showUserForm, setShowUserForm] = useState(false)
  const [showLicenseForm, setShowLicenseForm] = useState(false)
  const [copiedLicenseKey, setCopiedLicenseKey] = useState<string | null>(null)

  // Load users from localStorage
  useEffect(() => {
    try {
      const savedUsers = localStorage.getItem(USERS_STORAGE_KEY)
      if (savedUsers) {
        setUsers(JSON.parse(savedUsers))
      }
    } catch (err) {
      console.error('Failed to load users:', err)
    }
  }, [])

  // Load licenses from localStorage
  useEffect(() => {
    try {
      const allLicenses = getLicenses()
      setLicenses(allLicenses)
    } catch (err) {
      console.error('Failed to load licenses:', err)
    }
  }, [])

  const validateNewUser = (): boolean => {
    setError('')
    setSuccess('')

    if (!newUsername.trim()) {
      setError('Username is required')
      return false
    }

    if (newUsername.trim().length < 3) {
      setError('Username must be at least 3 characters')
      return false
    }

    if (!newPassword.trim()) {
      setError('Password is required')
      return false
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return false
    }

    if (users.some(u => u.username.toLowerCase() === newUsername.toLowerCase())) {
      setError('Username already exists')
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
      setSuccess(`User "${newUsername}" created successfully!`)
      setTimeout(() => {
        setSuccess('')
        setShowUserForm(false)
      }, 2000)
    } catch (err) {
      setError('Failed to create user')
      console.error(err)
    }
  }

  const handleDeleteUser = (username: string) => {
    if (username === 'admin') {
      setError('Cannot delete the default admin account')
      return
    }

    if (window.confirm(`Are you sure you want to delete user "${username}"?`)) {
      try {
        const updatedUsers = users.filter(u => u.username !== username)
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers))
        setUsers(updatedUsers)
        setSuccess(`User "${username}" deleted successfully`)
        setTimeout(() => setSuccess(''), 2000)
      } catch (err) {
        setError('Failed to delete user')
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
        setError('Only the main admin can generate admin license keys')
        return
      }

      const newLicense = createLicenseKey(licenseType, currentUser)
      const updatedLicenses = [...licenses, newLicense]
      saveLicenses(updatedLicenses)
      setLicenses(updatedLicenses)

      setSuccess(
        `${licenseType === 'admin' ? 'Admin' : 'User'} license key created successfully! ` +
        `Share this key: ${newLicense.key}`
      )
      setTimeout(() => {
        setSuccess('')
        setShowLicenseForm(false)
      }, 3000)
    } catch (err) {
      setError('Failed to create license key')
      console.error(err)
    }
  }

  const handleCopyLicense = (licenseKey: string) => {
    navigator.clipboard.writeText(licenseKey)
    setCopiedLicenseKey(licenseKey)
    setTimeout(() => setCopiedLicenseKey(null), 2000)
  }

  const handleDeleteLicense = (licenseId: string) => {
    if (window.confirm('Are you sure you want to revoke this license key?')) {
      try {
        const updatedLicenses = licenses.filter(l => l.id !== licenseId)
        saveLicenses(updatedLicenses)
        setLicenses(updatedLicenses)
        setSuccess('License key revoked successfully')
        setTimeout(() => setSuccess(''), 2000)
      } catch (err) {
        setError('Failed to revoke license key')
        console.error(err)
      }
    }
  }

  return (
    <div className="admin-dashboard-container">
      <div className="admin-header">
        <div className="admin-title">
          <h1>Admin Dashboard</h1>
          <p>Manage user accounts</p>
        </div>
        <div className="admin-user-info">
          <span className="current-user">Logged in as: <strong>{currentUser}</strong></span>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
      </div>

      <div className="admin-content">
        <div className="section-header">
          <h2>License Key Management</h2>
          <button
            onClick={() => setShowLicenseForm(!showLicenseForm)}
            className="create-user-btn"
          >
            {showLicenseForm ? '✕ Cancel' : '+ Generate License Key'}
          </button>
        </div>

        {showLicenseForm && (
          <div className="create-user-form">
            <h3>Generate License Key</h3>
            <form onSubmit={handleCreateLicense}>
              <div className="form-group">
                <label htmlFor="licenseType">License Type</label>
                <select
                  id="licenseType"
                  value={licenseType}
                  onChange={e => setLicenseType(e.target.value as 'admin' | 'user')}
                >
                  <option value="user">User License</option>
                  {currentUser === 'admin' && <option value="admin">Admin License</option>}
                </select>
                {licenseType === 'admin' && currentUser !== 'admin' && (
                  <p style={{ color: '#e74c3c', fontSize: '12px', margin: '8px 0 0 0' }}>
                    ⚠️ Only the main admin can generate admin licenses
                  </p>
                )}
              </div>

              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}

              <button type="submit" className="submit-btn">Generate License Key</button>
            </form>
          </div>
        )}

        <div className="users-list">
          <h3>Active License Keys ({licenses.filter(l => l.status === 'active').length})</h3>
          {licenses.filter(l => l.status === 'active').length === 0 ? (
            <p className="no-users">No active licenses found</p>
          ) : (
            <table className="users-table">
              <thead>
                <tr>
                  <th>License Key</th>
                  <th>Type</th>
                  <th>Created By</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
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
                        {copiedLicenseKey === license.key ? '✓ Copied' : 'Copy'}
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
                        ACTIVE
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleDeleteLicense(license.id)}
                        className="delete-btn"
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="section-header" style={{ marginTop: '40px' }}>
          <h2>User Management</h2>
          <button
            onClick={() => setShowUserForm(!showUserForm)}
            className="create-user-btn"
          >
            {showUserForm ? '✕ Cancel' : '+ Create New User'}
          </button>
        </div>

        {showUserForm && (
          <div className="create-user-form">
            <h3>Create New User Account</h3>
            <form onSubmit={handleCreateUser}>
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  placeholder="Enter username (min 3 characters)"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Enter password (min 6 characters)"
                />
              </div>

              <div className="form-group">
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {error && <div className="error-message">{error}</div>}
              {error && !error.includes('admin') && <div className="error-message">{error}</div>}
              {success && <div className="success-message">{success}</div>}

              <button type="submit" className="submit-btn">Create User</button>
            </form>
          </div>
        )}

        <div className="users-list">
          <h3>Registered Users ({users.length})</h3>
          {users.length === 0 ? (
            <p className="no-users">No users found</p>
          ) : (
            <table className="users-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.username}>
                    <td>
                      <strong>{user.username}</strong>
                      {user.username === 'admin' && <span className="admin-badge">Default Admin</span>}
                      {user.username === currentUser && <span className="current-badge">Current User</span>}
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
                        Delete
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
