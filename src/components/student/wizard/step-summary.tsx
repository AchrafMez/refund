"use client"

import { useWizardStore } from "@/store/wizard-store"
import { ChevronLeft, CheckCircle2, Loader2, Upload, X, FileText } from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createEstimate } from "@/actions/refunds"
import { getUserRole } from "@/actions/user"
import { useDropzone } from "react-dropzone"


export function StepSummary() {
  const { data, setStep, reset } = useWizardStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [certificates, setCertificates] = useState<any[]>([])
  const router = useRouter()

  // Fetch user role and certificates on mount
  useEffect(() => {
    getUserRole().then(setUserRole)
    if (data.category === 'certification') {
      fetchCertificates()
    }
  }, [data.category])

  const fetchCertificates = async () => {
    try {
      const { getCertificates } = await import('@/actions/refunds')
      const certs = await getCertificates()
      setCertificates(certs)
    } catch (error) {
      console.error('Failed to fetch certificates:', error)
    }
  }

  const selectedCert = certificates.find(c => c.id === data.certificateId)

  const isStaff = userRole === 'STAFF'

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setUploadedFile(acceptedFiles[0])
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    multiple: false
  })

  const UploadToLocal = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      const data = await response.json()
      return data.url
    } catch (error) {
      console.error("Error uploading file:", error)
      return null
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)

    try {
      let receiptUrl: string | undefined

      // Upload file if provided
      if (uploadedFile) {
        setIsUploading(true)
        receiptUrl = (await UploadToLocal(uploadedFile)) || undefined
        setIsUploading(false)
      }

      const categoryMap: Record<string, "EQUIPMENT" | "CERTIFICATION" | "TRAVEL" | "OTHER"> = {
        'transport': 'TRAVEL',
        'equipment': 'EQUIPMENT',
        'certification': 'CERTIFICATION',
        'other': 'OTHER'
      }

      await createEstimate({
        title: data.title,
        description: data.description,
        amount: parseFloat(data.amount) || 0,
        type: categoryMap[data.category!] || 'OTHER',
        receiptUrl,
        // New fields from Step 3
        certificateId: data.certificateId || undefined,
        targetDate: data.targetDate,
        departure: data.departure || undefined,
        destination: data.destination || undefined,
        invoiceAddressedTo: data.invoiceAddressedTo ? 'LEET INITIATIVE' : undefined
      })

      setIsSubmitting(false)
      reset()
      // Redirect staff to staff dashboard, students to student dashboard
      router.push(isStaff ? "/staff" : "/student")
      router.refresh()
    } catch (error: any) {
      console.error("Failed to submit request:", error)
      setIsSubmitting(false)

      // Check if it's an authentication error
      const errorMessage = error?.message || String(error)
      if (errorMessage.includes("Unauthorized") || errorMessage.includes("session") || errorMessage.includes("auth")) {
        router.push("/login?error=auth_required")
      }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Review Card */}
      <div
        style={{
          backgroundColor: '#fafafa',
          border: '1px solid #e4e4e7',
          borderRadius: '0.75rem',
          padding: '1.5rem'
        }}
      >
        <h3 style={{ fontSize: '1rem', fontWeight: 500, color: '#18181b', marginBottom: '1rem' }}>
          Review Request
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.875rem' }}>
          <div style={{ color: '#71717a' }}>Title</div>
          <div style={{ fontWeight: 500, color: '#18181b' }}>{data.title}</div>

          <div style={{ color: '#71717a' }}>Category</div>
          <div style={{ fontWeight: 500, color: '#18181b', textTransform: 'capitalize' }}>{data.category}</div>

          <div style={{ color: '#71717a' }}>Estimate</div>
          <div style={{ fontWeight: 500, color: '#18181b' }}>
            {data.category === 'certification' && selectedCert ? 
              `${selectedCert.fixedCost.toFixed(2)} ${selectedCert.currency}` : 
              `DH ${Number(data.amount).toFixed(2)}`
            }
          </div>
        </div>

        <div style={{ marginTop: '1rem' }}>
          <div style={{ color: '#71717a', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Description</div>
          <div
            style={{
              padding: '0.75rem',
              backgroundColor: 'white',
              border: '1px solid #e4e4e7',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              color: '#3f3f46'
            }}
          >
            {data.description}
          </div>
        </div>
      </div>

      {/* Staff Info Banner */}
      {isStaff && (
        <div
          style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '0.75rem',
            padding: '1rem'
          }}
        >
          <h3 style={{ fontSize: '0.875rem', fontWeight: 500, color: '#166534', marginBottom: '0.25rem' }}>
            Staff Request
          </h3>
          <p style={{ fontSize: '0.8125rem', color: '#15803d' }}>
            Your request will go directly to the Receipts queue for payment.
          </p>
        </div>
      )}

      {/* Attachment Upload - Available for all users */}
      <div
        style={{
          backgroundColor: '#fafafa',
          border: '1px solid #e4e4e7',
          borderRadius: '0.75rem',
          padding: '1.5rem'
        }}
      >
        <div style={{ color: '#18181b', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 500 }}>
          Attachment <span style={{ color: '#71717a', fontWeight: 400 }}>(optional)</span>
        </div>

        {uploadedFile ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem',
              backgroundColor: 'white',
              border: '1px solid #e4e4e7',
              borderRadius: '0.5rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText style={{ width: '1rem', height: '1rem', color: '#18181b' }} />
              <span style={{ fontSize: '0.875rem', color: '#18181b' }}>{uploadedFile.name}</span>
            </div>
            <button
              onClick={() => setUploadedFile(null)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.25rem'
              }}
            >
              <X style={{ width: '1rem', height: '1rem', color: '#dc2626' }} />
            </button>
          </div>
        ) : (
          <div
            {...getRootProps()}
            style={{
              padding: '1.5rem',
              backgroundColor: 'white',
              border: `2px dashed ${isDragActive ? '#18181b' : '#d4d4d8'}`,
              borderRadius: '0.5rem',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'border-color 150ms'
            }}
          >
            <input {...getInputProps()} />
            <Upload style={{ width: '1.5rem', height: '1.5rem', color: '#71717a', margin: '0 auto 0.5rem' }} />
            <p style={{ fontSize: '0.875rem', color: '#3f3f46' }}>
              {isDragActive ? 'Drop the file here' : 'Drag & drop or click to upload'}
            </p>
            <p style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '0.25rem' }}>
              PDF, PNG, JPG up to 10MB
            </p>
          </div>
        )}
      </div>

      {/* Certification Warning */}
      {data.category === 'certification' && (
        <div
          style={{
            backgroundColor: '#fffbeb',
            border: '1px solid #fcd34d',
            borderRadius: '0.75rem',
            padding: '1rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem'
          }}
        >
          <div style={{ fontSize: '0.8125rem', color: '#92400e' }}>
            <p style={{ margin: 0, fontWeight: 600 }}>Important Note:</p>
            <p style={{ margin: 0, marginTop: '0.25rem' }}>
              A refund is only valid and will be processed <strong>after</strong> you have successfully obtained the certificate and uploaded the proof.
            </p>
          </div>
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem' }}>
        <button
          type="button"
          onClick={() => setStep(2)}
          disabled={isSubmitting}
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
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            opacity: isSubmitting ? 0.5 : 1,
            transition: 'all 150ms'
          }}
          onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = '#fafafa')}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
        >
          <ChevronLeft style={{ width: '1rem', height: '1rem' }} />
          Back
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
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
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            transition: 'all 150ms'
          }}
          onMouseEnter={(e) => !isSubmitting && (e.currentTarget.style.backgroundColor = '#27272a')}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#18181b'}
        >
          {isSubmitting ? (
            <>
              <Loader2 style={{ width: '1rem', height: '1rem', animation: 'spin 1s linear infinite' }} />
              {isUploading ? 'Uploading...' : 'Submitting...'}
            </>
          ) : (
            <>
              Confirm & Submit
              <CheckCircle2 style={{ width: '1rem', height: '1rem' }} />
            </>
          )}
        </button>
      </div>
    </div>
  )
}

