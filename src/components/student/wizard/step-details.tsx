import { useWizardStore } from "@/store/wizard-store"
import React, { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Calendar, Plus, X, Loader2, Trash2, RefreshCcw, Pause, Settings } from "lucide-react"
import { getCertificates, createCertificate, deleteCertificate, restoreCertificate } from "@/actions/refunds"
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
  const [showCertModal, setShowCertModal] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [newCertLoading, setNewCertLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const [restoreLoading, setRestoreLoading] = useState<string | null>(null)
  const [newCertData, setNewCertData] = useState({
    name: '',
    provider: '',
    fixedCost: ''
  })

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

  // Auto-fill title for certification
  useEffect(() => {
    if (data.category === 'certification' && data.certificateId) {
      const cert = certificates.find(c => c.id === data.certificateId)
      if (cert) {
        setData({ title: cert.name })
      }
    }
  }, [data.category, data.certificateId, certificates, setData])

  // Also fetch when modal opens to ensure fresh data
  useEffect(() => {
    if (showCertModal) {
      fetchCertificates()
    }
  }, [showCertModal])

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

  const handleCreateCertificate = async () => {
    if (!newCertData.name || !newCertData.provider || !newCertData.fixedCost) return

    setNewCertLoading(true)
    try {
      const newCert = await createCertificate({
        name: newCertData.name,
        provider: newCertData.provider,
        fixedCost: parseFloat(newCertData.fixedCost)
      })

      // Refresh list and select new cert
      await fetchCertificates()
      setData({ certificateId: newCert.id })
      setNewCertData({ name: '', provider: '', fixedCost: '' })
    } catch (error) {
      console.error("Failed to create certificate", error)
    } finally {
      setNewCertLoading(false)
    }
  }

  const handleDeleteCertificate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("Are you sure you want to deactivate this certificate? It will be moved to the Inactive list.")) return

    setDeleteLoading(id)
    try {
      await deleteCertificate(id)
      await fetchCertificates()
      if (data.certificateId === id) {
        setData({ certificateId: null })
      }
    } catch (error) {
      console.error("Failed to deactivate certificate", error)
      alert("Failed to deactivate certificate.")
    } finally {
      setDeleteLoading(null)
    }
  }


  const handleRestoreCertificate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("Are you sure you want to restore this certificate?")) return

    setRestoreLoading(id)
    try {
      const res = await restoreCertificate(id)
      if (res.success) {
        await fetchCertificates()
      }
    } catch (error) {
      console.error("Failed to restore certificate:", error)
      alert("Failed to restore certificate")
    } finally {
      setRestoreLoading(null)
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
                    <button
                      type="button"
                      onClick={() => setShowCertModal(true)}
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
                        border: 'none',
                        transition: 'background-color 150ms'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#27272a'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#18181b'}
                      title="Manage Certificates"
                    >
                      <Settings size={18} />
                    </button>
                  )}
                </div>
                {errors.certificateId && (
                  <p style={{ fontSize: '0.8125rem', color: '#ef4444' }}>{errors.certificateId}</p>
                )}
              </div>

              {selectedCert && (
                <div style={{
                  padding: '0.75rem',
                  backgroundColor: '#f4f4f5',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem'
                }}>
                  <strong>Estimated Refund:</strong> ${selectedCert.fixedCost} {selectedCert.currency}
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

      {/* Manage Certificates Modal */}
      {showCertModal && (
        <>
          <style>{`
            .cert-modal-overlay {
              position: fixed;
              inset: 0;
              background: rgba(0, 0, 0, 0.4);
              backdrop-filter: blur(8px);
              -webkit-backdrop-filter: blur(8px);
              z-index: 50;
            }
            .cert-modal-container {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              z-index: 51;
              width: 100%;
              max-width: 40rem; /* Increased width */
              padding: 0 1rem;
            }
            .cert-modal-content {
              background: white;
              border-radius: 1rem;
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
              overflow: hidden;
              border: 1px solid #e4e4e7;
              max-height: 85vh;
              display: flex;
              flex-direction: column;
            }
            .cert-modal-header {
              padding: 1.25rem 1.5rem;
              border-bottom: 1px solid #f4f4f5;
              display: flex;
              align-items: center;
              justify-content: space-between;
              background: #fafafa;
              flex-shrink: 0;
            }
            .cert-modal-title {
              font-size: 1rem;
              font-weight: 600;
              color: #18181b;
              margin: 0;
            }
            .cert-modal-close {
              display: flex;
              align-items: center;
              justify-content: center;
              width: 2rem;
              height: 2rem;
              border-radius: 0.375rem;
              color: #71717a;
              background: transparent;
              border: none;
              cursor: pointer;
              transition: all 150ms;
            }
            .cert-modal-close:hover {
              background: #f4f4f5;
              color: #18181b;
            }
            .cert-modal-body {
              padding: 1.5rem;
              display: flex;
              flex-direction: column;
              gap: 1.5rem;
              overflow-y: auto;
            }
            .cert-section-title {
              font-size: 0.875rem;
              font-weight: 600;
              color: #18181b;
              margin-bottom: 0.75rem;
            }
            .cert-form-grid {
              display: grid;
              grid-template-columns: 2fr 2fr 1fr auto;
              gap: 0.75rem;
              align-items: end;
            }
            .cert-input-group {
              display: flex;
              flex-direction: column;
              gap: 0.375rem;
            }
            .cert-label {
              font-size: 0.75rem;
              font-weight: 500;
              color: #52525b;
            }
            .cert-input {
              width: 100%;
              padding: 0.5rem 0.75rem;
              font-size: 0.875rem;
              border: 1px solid #e4e4e7;
              border-radius: 0.375rem;
              color: #18181b;
              outline: none;
              transition: all 150ms;
              background: white;
            }
            .cert-input:focus {
              border-color: #18181b;
              box-shadow: 0 0 0 1px #18181b;
            }
            .cert-btn-add {
              padding: 0.5rem 1rem;
              height: 38px;
              color: white;
              background: #18181b;
              border: 1px solid #18181b;
              border-radius: 0.375rem;
              cursor: pointer;
              transition: all 150ms;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .cert-btn-add:hover {
              background: #3f3f46;
              border-color: #3f3f46;
            }
            .cert-btn-add:disabled {
              opacity: 0.5;
              cursor: not-allowed;
            }
            
            /* List Styles */
            .cert-list {
              display: flex;
              flex-direction: column;
              border: 1px solid #e4e4e7;
              border-radius: 0.5rem;
              overflow: hidden;
            }
            .cert-list-header {
              display: grid;
              grid-template-columns: 2fr 2fr 1fr auto;
              gap: 0.75rem;
              padding: 0.75rem 1rem;
              background: #fafafa;
              border-bottom: 1px solid #e4e4e7;
              font-size: 0.75rem;
              font-weight: 500;
              color: #71717a;
            }
            .cert-list-item {
              display: grid;
              grid-template-columns: 2fr 2fr 1fr auto;
              gap: 0.75rem;
              padding: 0.75rem 1rem;
              border-bottom: 1px solid #f4f4f5;
              align-items: center;
              font-size: 0.875rem;
              color: #18181b;
            }
            .cert-list-item:last-child {
              border-bottom: none;
            }
            .cert-list-item:hover {
              background: #fafafa;
            }
            .cert-btn-delete {
              width: 2rem;
              height: 2rem;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #ef4444;
              background: transparent;
              border: none;
              border-radius: 0.375rem;
              cursor: pointer;
              transition: all 150ms;
            }
            .cert-btn-delete:hover {
              background: #fee2e2;
            }
            .cert-btn-delete:disabled {
              opacity: 0.5;
              cursor: not-allowed;
            }

            @media (max-width: 640px) {
              .cert-form-grid {
                grid-template-columns: 1fr;
              }
              .cert-list-header {
                display: none;
              }
              .cert-list-item {
                grid-template-columns: 1fr auto;
                gap: 0.25rem;
              }
              .cert-list-item > div:nth-child(2) { /* Provider */
                grid-column: 1;
                font-size: 0.75rem;
                color: #71717a;
              }
              .cert-list-item > div:nth-child(3) { /* Cost */
                grid-column: 1;
                font-weight: 500;
              }
              .cert-list-item > button {
                grid-row: 1 / span 3;
                grid-column: 2;
              }
            }
          `}</style>

          <div className="cert-modal-overlay" onClick={() => setShowCertModal(false)} />
          <div className="cert-modal-container">
            <div className="cert-modal-content">
              <div className="cert-modal-header">
                <h3 className="cert-modal-title">Manage Certificates</h3>
                <button
                  className="cert-modal-close"
                  onClick={() => setShowCertModal(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="cert-modal-body">
                {/* Add New Section */}
                <div>
                  <h4 className="cert-section-title">Add New Certificate</h4>
                  <div className="cert-form-grid">
                    <div className="cert-input-group">
                      <label className="cert-label">Name</label>
                      <input
                        type="text"
                        className="cert-input"
                        placeholder="Certificate Name"
                        value={newCertData.name}
                        onChange={(e) => setNewCertData(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div className="cert-input-group">
                      <label className="cert-label">Provider</label>
                      <input
                        type="text"
                        className="cert-input"
                        placeholder="Provider"
                        value={newCertData.provider}
                        onChange={(e) => setNewCertData(prev => ({ ...prev, provider: e.target.value }))}
                      />
                    </div>
                    <div className="cert-input-group">
                      <label className="cert-label">Cost ($)</label>
                      <input
                        type="number"
                        className="cert-input"
                        placeholder="0.00"
                        value={newCertData.fixedCost}
                        onChange={(e) => setNewCertData(prev => ({ ...prev, fixedCost: e.target.value }))}
                      />
                    </div>
                    <div className="cert-input-group">
                      <label className="cert-label" style={{ visibility: 'hidden' }}>&nbsp;</label>
                      <button
                        className="cert-btn-add"
                        onClick={handleCreateCertificate}
                        disabled={newCertLoading || !newCertData.name || !newCertData.provider || !newCertData.fixedCost}
                      >
                        {newCertLoading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Existing List Section */}
                <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: '2rem', overflowY: 'auto', paddingRight: '0.5rem' }}>

                  {/* Active Certificates */}
                  <div>
                    <h4 className="cert-section-title">Active Certificates ({certificates.filter(c => c.active !== false).length})</h4>
                    <div className="cert-list">
                      <div className="cert-list-header">
                        <div>Name</div>
                        <div>Provider</div>
                        <div>Cost</div>
                        <div style={{ width: '2rem' }}></div>
                      </div>
                      <div style={{ overflowY: 'auto', maxHeight: '15rem' }}>
                        {certificates.filter(c => c.active !== false).map((cert) => (
                          <div key={cert.id} className="cert-list-item">
                            <div style={{ fontWeight: 500 }}>{cert.name}</div>
                            <div style={{ color: '#52525b' }}>{cert.provider}</div>
                            <div>${cert.fixedCost}</div>
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                              <button
                                type="button"
                                className="cert-btn-delete"
                                onClick={(e) => handleDeleteCertificate(cert.id, e)}
                                disabled={deleteLoading === cert.id}
                                title="Deactivate Certificate"
                              >
                                {deleteLoading === cert.id ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <Pause size={14} />
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                        {certificates.filter(c => c.active !== false).length === 0 && (
                          <div style={{ padding: '2rem', textAlign: 'center', color: '#a1a1aa', fontSize: '0.875rem' }}>
                            No active certificates.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Inactive Certificates */}
                  <div style={{ opacity: 0.75 }}>
                    <h4 className="cert-section-title">Inactive Certificates ({certificates.filter(c => c.active === false).length})</h4>
                    <div className="cert-list">
                      <div className="cert-list-header">
                        <div>Name</div>
                        <div>Provider</div>
                        <div>Cost</div>
                        <div style={{ width: '2rem' }}></div>
                      </div>
                      <div style={{ overflowY: 'auto', maxHeight: '12rem' }}>
                        {certificates.filter(c => c.active === false).map((cert) => (
                          <div key={cert.id} className="cert-list-item" style={{ backgroundColor: '#f9fafb' }}>
                            <div style={{ fontWeight: 500, color: '#71717a' }}>{cert.name}</div>
                            <div style={{ color: '#a1a1aa' }}>{cert.provider}</div>
                            <div style={{ color: '#a1a1aa' }}>${cert.fixedCost}</div>
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                              <button
                                type="button"
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: '#10b981',
                                  padding: '0.25rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                                onClick={(e) => handleRestoreCertificate(cert.id, e)}
                                disabled={restoreLoading === cert.id}
                                title="Restore Certificate"
                              >
                                {restoreLoading === cert.id ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <RefreshCcw size={14} />
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                        {certificates.filter(c => c.active === false).length === 0 && (
                          <div style={{ padding: '2rem', textAlign: 'center', color: '#a1a1aa', fontSize: '0.875rem' }}>
                            No inactive certificates.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
