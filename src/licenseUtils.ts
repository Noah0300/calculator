// License Key Management Utilities

export interface LicenseKey {
  id: string
  key: string
  type: 'admin' | 'user'
  createdBy: string
  createdDate: string
  usedBy?: string
  usedDate?: string
  status: 'active' | 'used' | 'expired'
  expiryDate?: string
}

const LICENSES_STORAGE_KEY = 'itemList_licenses'

// Generate a unique license key
export const generateLicenseKey = (): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 16; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  // Format as XXXX-XXXX-XXXX-XXXX
  return `${result.substr(0, 4)}-${result.substr(4, 4)}-${result.substr(8, 4)}-${result.substr(12, 4)}`
}

// Get all licenses from localStorage
export const getLicenses = (): LicenseKey[] => {
  try {
    const stored = localStorage.getItem(LICENSES_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Failed to load licenses:', error)
    return []
  }
}

// Save licenses to localStorage
export const saveLicenses = (licenses: LicenseKey[]): boolean => {
  try {
    localStorage.setItem(LICENSES_STORAGE_KEY, JSON.stringify(licenses))
    return true
  } catch (error) {
    console.error('Failed to save licenses:', error)
    return false
  }
}

// Create a new license key
export const createLicenseKey = (
  type: 'admin' | 'user',
  createdBy: string
): LicenseKey => {
  const now = new Date()
  const expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days expiry
  
  return {
    id: `lic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    key: generateLicenseKey(),
    type,
    createdBy,
    createdDate: now.toISOString(),
    status: 'active',
    expiryDate: expiryDate.toISOString(),
  }
}

// Validate a license key
export const validateLicenseKey = (licenseKey: string): LicenseKey | null => {
  const licenses = getLicenses()
  const license = licenses.find(
    l => l.key === licenseKey.toUpperCase() && l.status === 'active'
  )

  if (!license) {
    return null
  }

  // Check if expired
  if (license.expiryDate) {
    const expiryDate = new Date(license.expiryDate)
    if (new Date() > expiryDate) {
      return null
    }
  }

  return license
}

// Mark a license as used
export const useLicenseKey = (licenseKey: string, usedBy: string): boolean => {
  const licenses = getLicenses()
  const licenseIndex = licenses.findIndex(l => l.key === licenseKey.toUpperCase())

  if (licenseIndex === -1) {
    return false
  }

  licenses[licenseIndex].status = 'used'
  licenses[licenseIndex].usedBy = usedBy
  licenses[licenseIndex].usedDate = new Date().toISOString()

  return saveLicenses(licenses)
}

// Initialize default admin license (optional, for setup)
export const initializeDefaultAdminLicense = (): void => {
  const licenses = getLicenses()
  if (licenses.length === 0) {
    const initialLicense: LicenseKey = {
      id: 'lic_default_admin',
      key: 'ADMIN-DEFAULT-000000',
      type: 'admin',
      createdBy: 'system',
      createdDate: new Date().toISOString(),
      status: 'active',
    }
    saveLicenses([initialLicense])
  }
}
