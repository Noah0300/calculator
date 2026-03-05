import { useState } from 'react'
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
      newErrors.itemName = 'Item name is required'
    }

    // Validate quantity
    if (!formData.quantity) {
      newErrors.quantity = 'Quantity is required'
    } else if (isNaN(Number(formData.quantity)) || Number(formData.quantity) <= 0) {
      newErrors.quantity = 'Quantity must be a positive number'
    }

    // Validate unit price
    if (!formData.unitPrice) {
      newErrors.unitPrice = 'Unit price is required'
    } else if (isNaN(Number(formData.unitPrice)) || Number(formData.unitPrice) < 0) {
      newErrors.unitPrice = 'Unit price must be a non-negative number'
    }

    // Validate labor percent
    if (!formData.laborPercent) {
      newErrors.laborPercent = 'Labor % is required'
    } else if (isNaN(Number(formData.laborPercent)) || Number(formData.laborPercent) < 0 || Number(formData.laborPercent) > 100) {
      newErrors.laborPercent = 'Labor % must be between 0 and 100'
    }

    // Validate overhead percent
    if (!formData.overheadPercent) {
      newErrors.overheadPercent = 'Overhead % is required'
    } else if (isNaN(Number(formData.overheadPercent)) || Number(formData.overheadPercent) < 0 || Number(formData.overheadPercent) > 100) {
      newErrors.overheadPercent = 'Overhead % must be between 0 and 100'
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
      setSuccessMessage('Item added successfully!')
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
      <h1>Item Cost Calculator</h1>

      <form onSubmit={handleSubmit} className="item-form">
        <div className="form-group">
          <label htmlFor="itemName">Item Name *</label>
          <input
            type="text"
            id="itemName"
            name="itemName"
            value={formData.itemName}
            onChange={handleInputChange}
            placeholder="Enter item name"
            className={errors.itemName ? 'input-error' : ''}
          />
          {errors.itemName && <span className="error-message">{errors.itemName}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="quantity">Quantity *</label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            value={formData.quantity}
            onChange={handleInputChange}
            placeholder="Enter quantity"
            step="0.01"
            className={errors.quantity ? 'input-error' : ''}
          />
          {errors.quantity && <span className="error-message">{errors.quantity}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="unitPrice">Unit Price ($) *</label>
          <input
            type="number"
            id="unitPrice"
            name="unitPrice"
            value={formData.unitPrice}
            onChange={handleInputChange}
            placeholder="Enter unit price"
            step="0.01"
            className={errors.unitPrice ? 'input-error' : ''}
          />
          {errors.unitPrice && <span className="error-message">{errors.unitPrice}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="laborPercent">Labor (%) *</label>
          <input
            type="number"
            id="laborPercent"
            name="laborPercent"
            value={formData.laborPercent}
            onChange={handleInputChange}
            placeholder="Enter labor cost percentage"
            step="0.01"
            min="0"
            max="100"
            className={errors.laborPercent ? 'input-error' : ''}
          />
          {errors.laborPercent && <span className="error-message">{errors.laborPercent}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="overheadPercent">Overhead (%) *</label>
          <input
            type="number"
            id="overheadPercent"
            name="overheadPercent"
            value={formData.overheadPercent}
            onChange={handleInputChange}
            placeholder="Enter overhead cost percentage"
            step="0.01"
            min="0"
            max="100"
            className={errors.overheadPercent ? 'input-error' : ''}
          />
          {errors.overheadPercent && <span className="error-message">{errors.overheadPercent}</span>}
        </div>

        {successMessage && <div className="success-message">{successMessage}</div>}

        <div className="form-buttons">
          <button type="submit" className="btn-submit">Add Item</button>
          <button type="button" onClick={handleReset} className="btn-reset">Reset</button>
        </div>
      </form>
    </div>
  )
}
