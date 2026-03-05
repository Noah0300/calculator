import { useState, useEffect } from 'react'
import Login from './Login'
import SignUp from './SignUp'
import AdminDashboard from './AdminDashboard'
import ItemForm from './ItemForm'
import ItemList from './ItemList'
import ModuleTakeoffWizard from './ModuleTakeoffWizard'
import ConfirmDialog from './ConfirmDialog'
import { initializeDefaultAdminLicense } from './licenseUtils'
import { useLanguage } from './LanguageContext'
import { useTranslation } from './i18n'
import {
  DEFAULT_PROJECT_SETTINGS,
  legacyItemToQuoteLine,
} from './domain'
import type { ProjectSettings, QuoteLineInput } from './domain'
import './App.css'

interface LegacyItem {
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

const isQuoteLineArray = (value: unknown): value is QuoteLineInput[] =>
  Array.isArray(value) &&
  value.every(
    item =>
      typeof item === 'object' &&
      item !== null &&
      'description' in item &&
      'quantity' in item &&
      'baseRateExVat' in item
  )

const isLegacyItemArray = (value: unknown): value is LegacyItem[] =>
  Array.isArray(value) &&
  value.every(
    item =>
      typeof item === 'object' &&
      item !== null &&
      'itemName' in item &&
      'unitPrice' in item &&
      'laborPercent' in item &&
      'overheadPercent' in item
  )

// Helper function to get user-specific storage key
const getUserStorageKey = (username: string): string => {
  return `itemList_items_${username}`
}

function App() {
  const { language } = useLanguage()
  const { t } = useTranslation(language)
  const [auth, setAuth] = useState<AuthState>({ isLoggedIn: false, username: '', role: '' })
  const [quoteLines, setQuoteLines] = useState<QuoteLineInput[]>([])
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)
  const [isLoadingItems, setIsLoadingItems] = useState(true)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showSignUp, setShowSignUp] = useState(false)
  const [entryMode, setEntryMode] = useState<'legacy' | 'module'>('legacy')
  const projectSettings: ProjectSettings = DEFAULT_PROJECT_SETTINGS
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
          const parsedItems: unknown = JSON.parse(savedItems)

          if (isQuoteLineArray(parsedItems)) {
            setQuoteLines(parsedItems)
          } else if (isLegacyItemArray(parsedItems)) {
            setQuoteLines(
              parsedItems.map(item => legacyItemToQuoteLine(item, projectSettings))
            )
          } else {
            setQuoteLines([])
          }
        } else {
          setQuoteLines([])
        }
      } else {
        setQuoteLines([])
      }
    } catch (error) {
      console.error('Failed to load items from localStorage:', error)
    } finally {
      setIsLoadingItems(false)
    }
  }, [auth.username, auth.isLoggedIn, auth.role, isLoadingAuth, projectSettings])

  // Save user-specific items to localStorage whenever they change
  useEffect(() => {
    if (!isLoadingItems && auth.isLoggedIn && auth.username) {
      try {
        const userKey = getUserStorageKey(auth.username)
        localStorage.setItem(userKey, JSON.stringify(quoteLines))
      } catch (error) {
        console.error('Failed to save items to localStorage:', error)
      }
    }
  }, [quoteLines, isLoadingItems, auth.username, auth.isLoggedIn])

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
    setQuoteLines([])
    setAuth({ isLoggedIn: false, username: '', role: '' })
    localStorage.removeItem(AUTH_STORAGE_KEY)
  }

  const handleAddItem = (newItem: LegacyItem) => {
    const quoteLine = legacyItemToQuoteLine(newItem, projectSettings)
    setQuoteLines(prev => [...prev, quoteLine])
  }

  const handleAddQuoteLines = (newLines: QuoteLineInput[]) => {
    setQuoteLines(prev => [...prev, ...newLines])
  }

  const handleProjectDetailsChange = (field: keyof ProjectDetails, value: string) => {
    setProjectDetails(prev => ({ ...prev, [field]: value }))
  }

  const handleClearAllClick = () => {
    setShowClearConfirm(true)
  }

  const handleConfirmClear = () => {
    setQuoteLines([])
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

        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            onClick={() => setEntryMode('legacy')}
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid #c9d4e0',
              background: entryMode === 'legacy' ? '#102a43' : '#fff',
              color: entryMode === 'legacy' ? '#fff' : '#1f2937',
              cursor: 'pointer',
            }}
          >
            Snelle item invoer
          </button>
          <button
            type="button"
            data-testid="open-module-wizard"
            onClick={() => setEntryMode('module')}
            style={{
              padding: '0.5rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid #c9d4e0',
              background: entryMode === 'module' ? '#102a43' : '#fff',
              color: entryMode === 'module' ? '#fff' : '#1f2937',
              cursor: 'pointer',
            }}
          >
            Nieuwe Module Berekening
          </button>
        </div>

        {entryMode === 'legacy' ? (
          <ItemForm onAddItem={handleAddItem} />
        ) : (
          <ModuleTakeoffWizard
            currentUser={auth.username}
            projectSettings={projectSettings}
            onAddQuoteLines={handleAddQuoteLines}
          />
        )}
        
        {quoteLines.length > 0 && (
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
        
        <ItemList
          quoteLines={quoteLines}
          projectDetails={projectDetails}
          projectSettings={projectSettings}
        />
      </div>
    </div>
  )
}

export default App
