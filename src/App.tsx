import { useState, useEffect } from 'react'
import Login from './Login'
import SignUp from './SignUp'
import AdminDashboard from './AdminDashboard'
import ItemForm from './ItemForm'
import ItemList from './ItemList'
import ConfirmDialog from './ConfirmDialog'
import { initializeDefaultAdminLicense } from './licenseUtils'
import { useLanguage } from './LanguageContext'
import { useTranslation } from './i18n'
import './App.css'

interface Item {
  itemName: string
  quantity: string
  unitPrice: string
  laborPercent: string
  overheadPercent: string
}

const AUTH_STORAGE_KEY = 'itemList_auth'

interface AuthState {
  isLoggedIn: boolean
  username: string
  role: string
}

interface ProjectDetails {
  projectName: string
  customerName: string
  preparedBy: string
  quoteNumber: string
}

// Helper function to get user-specific storage key
const getUserStorageKey = (username: string): string => {
  return `itemList_items_${username}`
}

function App() {
  const { language } = useLanguage()
  const { t } = useTranslation(language)
  const [auth, setAuth] = useState<AuthState>({ isLoggedIn: false, username: '', role: '' })
  const [items, setItems] = useState<Item[]>([])
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)
  const [isLoadingItems, setIsLoadingItems] = useState(true)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showSignUp, setShowSignUp] = useState(false)
  const [projectDetails, setProjectDetails] = useState<ProjectDetails>({
    projectName: '',
    customerName: '',
    preparedBy: '',
    quoteNumber: '',
  })

  // Initialize default admin license on app load
  useEffect(() => {
    initializeDefaultAdminLicense()
  }, [])

  // Load auth state from localStorage on app mount
  useEffect(() => {
    try {
      const savedAuth = localStorage.getItem(AUTH_STORAGE_KEY)
      if (savedAuth) {
        const parsedAuth = JSON.parse(savedAuth)
        setAuth(parsedAuth)
      }
    } catch (error) {
      console.error('Failed to load auth state:', error)
    } finally {
      setIsLoadingAuth(false)
    }
  }, [])

  // Load user-specific items when auth state changes
  useEffect(() => {
    if (isLoadingAuth) {
      return
    }

    try {
      if (auth.isLoggedIn && auth.username && (auth.role === 'user' || auth.role === 'admin')) {
        const userKey = getUserStorageKey(auth.username)
        const savedItems = localStorage.getItem(userKey)
        if (savedItems) {
          const parsedItems = JSON.parse(savedItems)
          setItems(parsedItems)
        } else {
          setItems([])
        }
      } else {
        setItems([])
      }
    } catch (error) {
      console.error('Failed to load items from localStorage:', error)
    } finally {
      setIsLoadingItems(false)
    }
  }, [auth.username, auth.isLoggedIn, isLoadingAuth])

  // Save user-specific items to localStorage whenever they change
  useEffect(() => {
    if (!isLoadingItems && auth.isLoggedIn && auth.username) {
      try {
        const userKey = getUserStorageKey(auth.username)
        localStorage.setItem(userKey, JSON.stringify(items))
      } catch (error) {
        console.error('Failed to save items to localStorage:', error)
      }
    }
  }, [items, isLoadingItems, auth.username, auth.isLoggedIn])

  // Save auth state to localStorage whenever it changes
  useEffect(() => {
    if (!isLoadingAuth) {
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth))
      } catch (error) {
        console.error('Failed to save auth state:', error)
      }
    }
  }, [auth, isLoadingAuth])

  const handleLoginSuccess = (username: string, role: string) => {
    setAuth({ isLoggedIn: true, username, role })
  }

  const handleLogout = () => {
    // Clear items before logging out
    setItems([])
    setAuth({ isLoggedIn: false, username: '', role: '' })
    localStorage.removeItem(AUTH_STORAGE_KEY)
  }

  const handleAddItem = (newItem: Item) => {
    setItems(prev => [...prev, newItem])
  }

  const handleProjectDetailsChange = (field: keyof ProjectDetails, value: string) => {
    setProjectDetails(prev => ({ ...prev, [field]: value }))
  }

  const handleClearAllClick = () => {
    setShowClearConfirm(true)
  }

  const handleConfirmClear = () => {
    setItems([])
    // Clear user-specific items from localStorage
    if (auth.username) {
      const userKey = getUserStorageKey(auth.username)
      localStorage.removeItem(userKey)
    }
    setShowClearConfirm(false)
  }

  const handleCancelClear = () => {
    setShowClearConfirm(false)
  }

  // Loading state
  if (isLoadingAuth || isLoadingItems) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h2>Loading...</h2>
        </div>
      </div>
    )
  }

  // Show login/signup if not authenticated
  if (!auth.isLoggedIn) {
    if (showSignUp) {
      return (
        <SignUp 
          onSignUpSuccess={handleLoginSuccess} 
          onBackToLogin={() => setShowSignUp(false)}
        />
      )
    }
    return (
      <Login 
        onLoginSuccess={handleLoginSuccess}
        onShowSignUp={() => setShowSignUp(true)}
      />
    )
  }

  // Show admin dashboard if user is admin
  if (auth.role === 'admin') {
    return <AdminDashboard currentUser={auth.username} onLogout={handleLogout} />
  }

  // Show main app for regular users
  return (
    <div className="app-container">
      <ConfirmDialog
        isOpen={showClearConfirm}
        title={t('clearAllConfirm')}
        message={t('clearAllMessage')}
        onConfirm={handleConfirmClear}
        onCancel={handleCancelClear}
        confirmText={t('deleteAll')}
        cancelText={t('keepItems')}
        isDangerous={true}
      />
      
      <div className="app-header">
        <div style={{ flex: 1 }}>
          <h1>{t('itemCostCalculator')}</h1>
          <p>{t('manageItems')}</p>
        </div>
        <div style={{ textAlign: 'right', display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <p style={{ marginTop: 0, marginBottom: '8px', fontSize: '14px', color: '#666' }}>
              {t('loggedInAs')} <strong>{auth.username}</strong>
            </p>
            <button 
              onClick={handleLogout}
              style={{
                padding: '8px 16px',
                backgroundColor: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: '600',
                textTransform: 'uppercase',
              }}
            >
              {t('logout')}
            </button>
          </div>
        </div>
      </div>

      <div className="app-content">
        <div className="project-details-card">
          <h2>{t('quotationDetails')}</h2>
          <div className="project-details-grid">
            <label>
              {t('projectName')}
              <input
                type="text"
                value={projectDetails.projectName}
                onChange={e => handleProjectDetailsChange('projectName', e.target.value)}
                placeholder={t('officeRenovation')}
              />
            </label>
            <label>
              {t('customerName')}
              <input
                type="text"
                value={projectDetails.customerName}
                onChange={e => handleProjectDetailsChange('customerName', e.target.value)}
                placeholder={t('acmeIndustries')}
              />
            </label>
            <label>
              {t('preparedBy')}
              <input
                type="text"
                value={projectDetails.preparedBy}
                onChange={e => handleProjectDetailsChange('preparedBy', e.target.value)}
                placeholder={t('yourCompanyName')}
              />
            </label>
            <label>
              {t('quoteNumber')}
              <input
                type="text"
                value={projectDetails.quoteNumber}
                onChange={e => handleProjectDetailsChange('quoteNumber', e.target.value)}
                placeholder="Q-2026-001"
              />
            </label>
          </div>
        </div>

        <ItemForm onAddItem={handleAddItem} />
        
        {items.length > 0 && (
          <div className="clear-all-container">
            <button 
              onClick={handleClearAllClick}
              className="clear-all-btn"
              title={t('clearAllMessage')}
            >
              {t('clearAllItems')}
            </button>
          </div>
        )}
        
        <ItemList items={items} projectDetails={projectDetails} />
      </div>
    </div>
  )
}

export default App
