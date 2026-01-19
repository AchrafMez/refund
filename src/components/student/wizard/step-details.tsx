"use client"

import { useWizardStore } from "@/store/wizard-store"
import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

export function StepDetails() {
  const { data, setData, setStep } = useWizardStore()
  const [errors, setErrors] = useState<{amount?: string, description?: string}>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: typeof errors = {}
    
    if (!data.amount || isNaN(Number(data.amount)) || Number(data.amount) <= 0) {
        newErrors.amount = "Please enter a valid amount"
    }
    if (!data.description || data.description.length < 5) {
        newErrors.description = "Description must be at least 5 characters"
    }

    if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        return
    }

    setStep(3)
  }

  const inputStyle = {
    width: '100%',
    padding: '0.625rem 0.875rem',
    fontSize: '0.875rem',
    border: '1px solid #e4e4e7',
    borderRadius: '0.375rem',
    backgroundColor: 'white',
    color: '#18181b',
    outline: 'none',
    transition: 'border-color 150ms'
  }

  const errorInputStyle = {
    ...inputStyle,
    borderColor: '#ef4444'
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Amount Field */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label 
            htmlFor="amount" 
            style={{ fontSize: '0.875rem', fontWeight: 500, color: '#18181b' }}
          >
            Amount (DH)
          </label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#71717a', fontSize: '0.875rem' }}>
              DH
            </span>
            <input 
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={data.amount}
              onChange={(e) => setData({ amount: e.target.value })}
              style={{
                ...(errors.amount ? errorInputStyle : inputStyle),
                paddingLeft: '2.5rem'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#18181b'}
              onBlur={(e) => e.currentTarget.style.borderColor = errors.amount ? '#ef4444' : '#e4e4e7'}
            />
          </div>
          {errors.amount && (
            <p style={{ fontSize: '0.8125rem', color: '#ef4444' }}>{errors.amount}</p>
          )}
        </div>

        {/* Description Field */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label 
            htmlFor="description" 
            style={{ fontSize: '0.875rem', fontWeight: 500, color: '#18181b' }}
          >
            Description
          </label>
          <textarea
            id="description"
            placeholder="What is this expense for?"
            value={data.description}
            onChange={(e) => setData({ description: e.target.value })}
            rows={3}
            style={{
              ...(errors.description ? errorInputStyle : inputStyle),
              resize: 'vertical',
              minHeight: '5rem'
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#18181b'}
            onBlur={(e) => e.currentTarget.style.borderColor = errors.description ? '#ef4444' : '#e4e4e7'}
          />
          {errors.description && (
            <p style={{ fontSize: '0.8125rem', color: '#ef4444' }}>{errors.description}</p>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem' }}>
        <button 
          type="button" 
          onClick={() => setStep(1)}
          style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.625rem 1rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            backgroundColor: 'white',
            border: '1px solid #e4e4e7',
            borderRadius: '0.375rem',
            color: '#3f3f46',
            cursor: 'pointer',
            transition: 'all 150ms'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fafafa'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
        >
          <ChevronLeft style={{ width: '1rem', height: '1rem' }} />
          Back
        </button>
        <button 
          type="submit"
          style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.625rem 1rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            backgroundColor: '#18181b',
            border: 'none',
            borderRadius: '0.375rem',
            color: 'white',
            cursor: 'pointer',
            transition: 'all 150ms'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#27272a'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#18181b'}
        >
          Continue
          <ChevronRight style={{ width: '1rem', height: '1rem' }} />
        </button>
      </div>
    </form>
  )
}
