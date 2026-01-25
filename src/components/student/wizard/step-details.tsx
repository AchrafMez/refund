import { useWizardStore } from "@/store/wizard-store"
import React, { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Calendar, Settings } from "lucide-react"
import { getCertificates } from "@/actions/refunds"
import { authClient } from "@/lib/auth-client"
import { CustomCalendar } from "@/components/ui/custom-calendar"

type Certificate = {
  id: string
  name: string
  provider: string
  fixedCost: number
  currency: string
  active?: boolean
}

export function StepDetails() {
  const { data, setData, setStep } = useWizardStore()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(false)
  const [isStaff, setIsStaff] = useState(false)

  // Modal State
  const [showCalendar, setShowCalendar] = useState(false)

  // Check Staff Role
  useEffect(() => {
    const checkStaffRole = async () => {
      const session = await authClient.getSession()
      if ((session?.data?.user as any)?.role === 'STAFF') {
        setIsStaff(true)
      }
    }
    checkStaffRole()
  }, [])

  // Fetch certificates on mount if category is certification
  useEffect(() => {
    if (data.category === 'certification') {
      fetchCertificates()
    }
  }, [data.category])

  // Auto-fill title and amount for certification
  useEffect(() => {
    if (data.category === 'certification' && data.certificateId) {
      const cert = certificates.find(c => c.id === data.certificateId)
      if (cert) {
        setData({ 
          title: cert.name,
          amount: cert.fixedCost.toString()
        })
      }
    }
  }, [data.category, data.certificateId, certificates, setData])

  const fetchCertificates = async () => {
    setLoading(true)
    try {
      const certs = await getCertificates()
      setCertificates(certs)
    } catch (error) {
      console.error("Failed to fetch certificates:", error)
    } finally {
      setLoading(false)
    }
  }

  const selectedCert = certificates.find(c => c.id === data.certificateId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}

    // Enforce title for certification
    let effectiveTitle = data.title
    if (data.category === 'certification' && selectedCert) {
      effectiveTitle = selectedCert.name
      if (data.title !== effectiveTitle) {
        setData({ title: effectiveTitle })
      }
    }

    // Common validations
    if (!effectiveTitle || effectiveTitle.length < 3) {
      newErrors.title = "Title must be at least 3 characters"
    }
    if (!data.description || data.description.length < 5) {
      newErrors.description = "Description must be at least 5 characters"
    }
    if (data.description && data.description.length > 500) {
      newErrors.description = "Description must be 500 characters or less"
    }

    // Category-specific validations
    if (data.category === 'certification') {
      if (!data.certificateId) {
        newErrors.certificateId = "Please select a certificate"
      }
      if (!data.targetDate) {
        newErrors.targetDate = "Please select a target date"
      }
    } else if (data.category === 'transport') {
      if (!data.departure) {
        newErrors.departure = "Please enter departure location"
      }
      if (!data.destination) {
        newErrors.destination = "Please enter destination"
      }
      if (!data.amount || isNaN(Number(data.amount)) || Number(data.amount) <= 0) {
        newErrors.amount = "Please enter a valid amount"
      }
    } else {
      // equipment / other
      if (!data.amount || isNaN(Number(data.amount)) || Number(data.amount) <= 0) {
        newErrors.amount = "Please enter a valid amount"
      }
      if (!data.invoiceAddressedTo) {
        newErrors.invoiceAddressedTo = "You must confirm the invoice is addressed to LEET INITIATIVE"
      }
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

  const labelStyle = { fontSize: '0.875rem', fontWeight: 500, color: '#18181b' }

  return (
    <>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Title Field - Only show if NOT certification */}
          {data.category !== 'certification' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label htmlFor="title" style={labelStyle}>
                Title
              </label>
              <input
                id="title"
                type="text"
                placeholder="e.g., Conference Registration, equipment purchase..."
                value={data.title}
                onChange={(e) => setData({ title: e.target.value })}
                style={errors.title ? errorInputStyle : inputStyle}
                autoFocus
              />
              {errors.title && (
                <p style={{ fontSize: '0.8125rem', color: '#ef4444' }}>{errors.title}</p>
              )}
            </div>
          )}

          {/* Certificate-specific fields */}
          {data.category === 'certification' && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label htmlFor="certificate" style={labelStyle}>
                  Select Certificate
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <select
                    id="certificate"
                    value={data.certificateId || ''}
                    onChange={(e) => setData({ certificateId: e.target.value || null })}
                    style={{ ...(errors.certificateId ? errorInputStyle : inputStyle), flex: 1 }}
                    disabled={loading}
                  >
                    <option value="">-- Select a Certificate --</option>
                    {certificates.filter(c => c.active !== false).map((cert) => (
                      <option key={cert.id} value={cert.id}>
                        {cert.name} ({cert.provider}) - ${cert.fixedCost}
                      </option>
                    ))}
                  </select>
                  {isStaff && (
                    <a
                      href="/staff/certificates"
                      style={{
                        width: '2.75rem',
                        flexShrink: 0,
                        backgroundColor: '#18181b',
                        borderRadius: '0.375rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        cursor: 'pointer',
                        textDecoration: 'none',
                        transition: 'background-color 150ms'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#27272a'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#18181b'}
                      title="Manage Certificates"
                    >
                      <Settings size={18} />
                    </a>
                  )}
                </div>
                {errors.certificateId && (
                  <p style={{ fontSize: '0.8125rem', color: '#ef4444' }}>{errors.certificateId}</p>
                )}
              </div>

              {selectedCert && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{
                    padding: '0.75rem',
                    backgroundColor: '#f4f4f5',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}>
                    <strong>Estimated Refund:</strong> ${selectedCert.fixedCost} {selectedCert.currency}
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    backgroundColor: '#fffbeb',
                    border: '1px solid #fcd34d',
                    borderRadius: '0.5rem'
                  }}>
                    <div style={{ fontSize: '0.8125rem', color: '#92400e' }}>
                      <strong>Note:</strong> You will only get refunded <strong>after</strong> you have successfully obtained the certificate if a staff member approved your request.
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label htmlFor="targetDate" style={labelStyle}>
                  Target Completion Date
                </label>
                <div style={{ position: 'relative' }}>
                  <Calendar style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#71717a', width: '1rem', height: '1rem', zIndex: 1 }} />
                  <button
                    type="button"
                    onClick={() => setShowCalendar(!showCalendar)}
                    style={{
                      ...(errors.targetDate ? errorInputStyle : inputStyle),
                      paddingLeft: '2.5rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      height: '42px'
                    }}
                  >
                    {data.targetDate ? new Date(data.targetDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : <span style={{ color: '#9ca3af' }}>mm / dd / yyyy</span>}
                  </button>

                  {showCalendar && (
                    <>
                      <div
                        style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                        onClick={() => setShowCalendar(false)}
                      />
                      <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '0.5rem', zIndex: 50 }}>
                        <CustomCalendar
                          mode="single"
                          value={data.targetDate ? new Date(data.targetDate) : null}
                          onChange={(date: any) => {
                            setData({ targetDate: date })
                            setShowCalendar(false)
                          }}
                          onClose={() => setShowCalendar(false)}
                        />
                      </div>
                    </>
                  )}
                </div>
                {errors.targetDate && (
                  <p style={{ fontSize: '0.8125rem', color: '#ef4444' }}>{errors.targetDate}</p>
                )}
              </div>
            </>
          )}

          {/* Transport-specific fields */}
          {data.category === 'transport' && (
            <>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label htmlFor="departure" style={labelStyle}>Departure</label>
                  <input
                    id="departure"
                    type="text"
                    placeholder="e.g., Ben Guerir"
                    value={data.departure}
                    onChange={(e) => setData({ departure: e.target.value })}
                    style={errors.departure ? errorInputStyle : inputStyle}
                  />
                  {errors.departure && (
                    <p style={{ fontSize: '0.8125rem', color: '#ef4444' }}>{errors.departure}</p>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label htmlFor="destination" style={labelStyle}>Destination</label>
                  <input
                    id="destination"
                    type="text"
                    placeholder="e.g., Casablanca (CTM station)"
                    value={data.destination}
                    onChange={(e) => setData({ destination: e.target.value })}
                    style={errors.destination ? errorInputStyle : inputStyle}
                  />
                  {errors.destination && (
                    <p style={{ fontSize: '0.8125rem', color: '#ef4444' }}>{errors.destination}</p>
                  )}
                </div>
              </div>
              {/* Amount for Transport */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label htmlFor="amount" style={labelStyle}>Estimate (DH)</label>
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
                  />
                </div>
                {errors.amount && (
                  <p style={{ fontSize: '0.8125rem', color: '#ef4444' }}>{errors.amount}</p>
                )}
              </div>
            </>
          )}

          {/* Equipment / Other fields */}
          {(data.category === 'equipment' || data.category === 'other') && (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label htmlFor="amount" style={labelStyle}>Estimate (DH)</label>
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
                  />
                </div>
                {errors.amount && (
                  <p style={{ fontSize: '0.8125rem', color: '#ef4444' }}>{errors.amount}</p>
                )}
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                padding: '0.75rem',
                backgroundColor: '#fffbeb',
                border: '1px solid #fcd34d',
                borderRadius: '0.5rem'
              }}>
                <input
                  type="checkbox"
                  id="invoiceCheck"
                  checked={data.invoiceAddressedTo}
                  onChange={(e) => setData({ invoiceAddressedTo: e.target.checked })}
                  style={{ marginTop: '0.25rem', accentColor: '#18181b' }}
                />
                <label htmlFor="invoiceCheck" style={{ fontSize: '0.8125rem', color: '#92400e', cursor: 'pointer' }}>
                  I confirm the invoice is addressed to <strong>LEET INITIATIVE</strong> (not 1337).
                </label>
              </div>
              {errors.invoiceAddressedTo && (
                <p style={{ fontSize: '0.8125rem', color: '#ef4444' }}>{errors.invoiceAddressedTo}</p>
              )}
            </>
          )}

          {/* Description Field (Common) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label htmlFor="description" style={labelStyle}>
              Description <span style={{ color: '#71717a', fontWeight: 400 }}>({data.description.length}/500)</span>
            </label>
            <textarea
              id="description"
              placeholder="Describe the event duration, context, and purpose of this expense..."
              value={data.description}
              onChange={(e) => setData({ description: e.target.value.slice(0, 500) })}
              rows={3}
              style={{
                ...(errors.description ? errorInputStyle : inputStyle),
                resize: 'vertical',
                minHeight: '5rem'
              }}
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
    </>
  )
}
