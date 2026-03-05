import { useState } from 'react'
import { useLanguage } from './LanguageContext'
import { useTranslation } from './i18n'
import './ItemForm.css'

interface FormData {
  itemName: string
  quantity: string
  unitPrice: string
  laborPercent: string
  overheadPercent: string
}

interface FormErrors {
  itemName?: string
  quantity?: string
  unitPrice?: string
  laborPercent?: string
  overheadPercent?: string
}

interface Item extends FormData {}

interface ItemFormProps {
  onAddItem: (item: Item) => void
}

export default function ItemForm({ onAddItem }: ItemFormProps) {
  const { language } = useLanguage()
  const { t } = useTranslation(language)
  const [formData, setFormData] = useState<FormData>({
    itemName: '',
    quantity: '',
    unitPrice: '',
    laborPercent: '',
    overheadPercent: '',
  })

  const [errors, setErrors] = useState<FormErrors>({})
  const [successMessage, setSuccessMessage] = useState('')

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Validate item name
    if (!formData.itemName.trim()) {
      newErrors.itemName = t('itemNameRequired')
    }

    // Validate quantity
    if (!formData.quantity) {
      newErrors.quantity = t('quantityRequired')
    } else if (isNaN(Number(formData.quantity)) || Number(formData.quantity) <= 0) {
      newErrors.quantity = t('quantityMustBePositive')
    }

    // Validate unit price
    if (!formData.unitPrice) {
      newErrors.unitPrice = t('unitPriceRequired')
    } else if (isNaN(Number(formData.unitPrice)) || Number(formData.unitPrice) < 0) {
      newErrors.unitPrice = t('unitPriceMustBeNonNegative')
    }

    // Validate labor percent
    if (!formData.laborPercent) {
      newErrors.laborPercent = t('laborPercentRequired')
    } else if (isNaN(Number(formData.laborPercent)) || Number(formData.laborPercent) < 0 || Number(formData.laborPercent) > 100) {
      newErrors.laborPercent = t('laborPercentBetween')
    }

    // Validate overhead percent
    if (!formData.overheadPercent) {
      newErrors.overheadPercent = t('overheadPercentRequired')
    } else if (isNaN(Number(formData.overheadPercent)) || Number(formData.overheadPercent) < 0 || Number(formData.overheadPercent) > 100) {
      newErrors.overheadPercent = t('overheadPercentBetween')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }))
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSuccessMessage('')

    if (validateForm()) {
      const newItem: Item = {
        itemName: formData.itemName,
        quantity: formData.quantity,
        unitPrice: formData.unitPrice,
        laborPercent: formData.laborPercent,
        overheadPercent: formData.overheadPercent,
      }

      onAddItem(newItem)
      setFormData({
        itemName: '',
        quantity: '',
        unitPrice: '',
        laborPercent: '',
        overheadPercent: '',
      })
      setSuccessMessage(t('itemAddedSuccessfully'))
      setTimeout(() => setSuccessMessage(''), 3000)
    }
  }

  const handleReset = () => {
    setFormData({
      itemName: '',
      quantity: '',
      unitPrice: '',
      laborPercent: '',
      overheadPercent: '',
    })
    setErrors({})
    setSuccessMessage('')
  }

  return (
    <div className="item-form-container">
      <h1>{t('itemCostCalculator')}</h1>

      <form onSubmit={handleSubmit} className="item-form">
        <div className="form-group">
          <label htmlFor="itemName">{t('itemName')} *</label>
          <input
            type="text"
            id="itemName"
            name="itemName"
            value={formData.itemName}
            onChange={handleInputChange}
            placeholder={t('enterItemName')}
            className={errors.itemName ? 'input-error' : ''}
          />
          {errors.itemName && <span className="error-message">{errors.itemName}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="quantity">{t('quantity')} *</label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            value={formData.quantity}
            onChange={handleInputChange}
            placeholder={t('enterQuantity')}
            step="0.01"
            className={errors.quantity ? 'input-error' : ''}
          />
          {errors.quantity && <span className="error-message">{errors.quantity}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="unitPrice">{t('unitPrice')} *</label>
          <input
            type="number"
            id="unitPrice"
            name="unitPrice"
            value={formData.unitPrice}
            onChange={handleInputChange}
            placeholder={t('enterUnitPrice')}
            step="0.01"
            className={errors.unitPrice ? 'input-error' : ''}
          />
          {errors.unitPrice && <span className="error-message">{errors.unitPrice}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="laborPercent">{t('labor')} *</label>
          <input
            type="number"
            id="laborPercent"
            name="laborPercent"
            value={formData.laborPercent}
            onChange={handleInputChange}
            placeholder={t('enterLaborPercentage')}
            step="0.01"
            min="0"
            max="100"
            className={errors.laborPercent ? 'input-error' : ''}
          />
          {errors.laborPercent && <span className="error-message">{errors.laborPercent}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="overheadPercent">{t('overhead')} *</label>
          <input
            type="number"
            id="overheadPercent"
            name="overheadPercent"
            value={formData.overheadPercent}
            onChange={handleInputChange}
            placeholder={t('enterOverheadPercentage')}
            step="0.01"
            min="0"
            max="100"
            className={errors.overheadPercent ? 'input-error' : ''}
          />
          {errors.overheadPercent && <span className="error-message">{errors.overheadPercent}</span>}
        </div>

        {successMessage && <div className="success-message">{successMessage}</div>}

        <div className="form-buttons">
          <button type="submit" className="btn-submit">{t('addItem')}</button>
          <button type="button" onClick={handleReset} className="btn-reset">{t('reset')}</button>
        </div>
      </form>
    </div>
  )
}
