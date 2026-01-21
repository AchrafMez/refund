"use client"

import { useWizardStore } from "@/store/wizard-store"
import { StepCategory } from "@/components/student/wizard/step-category"
import { StepDetails } from "@/components/student/wizard/step-details"
import { StepSummary } from "@/components/student/wizard/step-summary"
import { ChevronLeft, FolderOpen, FileText, CheckCircle, AlertCircle, Info, Shield } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { authClient } from "@/lib/auth-client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

const steps = [
  { id: 1, label: "Category", icon: FolderOpen },
  { id: 2, label: "Details", icon: FileText },
  { id: 3, label: "Review", icon: CheckCircle },
]

export default function CreateRequestPage() {
  const { step, setStep, reset } = useWizardStore()
  const router = useRouter()
  const [showDisclaimer, setShowDisclaimer] = useState(true)
  const [isStaff, setIsStaff] = useState(false)

  // Check if current user is staff
  useEffect(() => {
    const checkStaffRole = async () => {
      const session = await authClient.getSession()
      if (session?.data?.user?.role === 'STAFF' || session?.data?.user?.role === 'ADMIN') {
        setIsStaff(true)
      }
    }
    checkStaffRole()
  }, [])

  const handleBack = () => {
    if (step === 1) {
        reset()
        router.push("/student")
    } else {
        setStep(step - 1)
    }
  }

  // Disclaimer Modal
  if (showDisclaimer) {
    return (
      <>
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from { opacity: 0; transform: translate(-50%, -48%) scale(0.96); }
            to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          }
          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.4);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            z-index: 50;
            animation: fadeIn 0.2s ease-out;
          }
          .modal-container {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 51;
            width: 100%;
            max-width: 28rem;
            padding: 0 1rem;
            animation: slideUp 0.3s ease-out;
          }
          .modal-content {
            background: white;
            border-radius: 1rem;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            overflow: hidden;
          }
          .modal-header {
            padding: 1.5rem 1.5rem 1rem;
            border-bottom: 1px solid #f4f4f5;
          }
          .modal-title {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            font-size: 1.125rem;
            font-weight: 600;
            color: #18181b;
            margin: 0;
          }
          .modal-icon {
            width: 2.5rem;
            height: 2.5rem;
            border-radius: 0.75rem;
            background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .modal-icon svg {
            width: 1.25rem;
            height: 1.25rem;
            color: #d97706;
          }
          .modal-body {
            padding: 1.25rem 1.5rem;
          }
          .modal-intro {
            font-size: 0.875rem;
            color: #71717a;
            margin-bottom: 1rem;
          }
          .modal-list {
            list-style: none;
            padding: 0;
            margin: 0;
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
          }
          .modal-list-item {
            display: flex;
            align-items: flex-start;
            gap: 0.75rem;
            font-size: 0.875rem;
            color: #3f3f46;
            line-height: 1.5;
          }
          .modal-list-bullet {
            width: 1.25rem;
            height: 1.25rem;
            border-radius: 50%;
            background: #f4f4f5;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            margin-top: 0.125rem;
          }
          .modal-list-bullet svg {
            width: 0.75rem;
            height: 0.75rem;
            color: #71717a;
          }
          .modal-highlight {
            font-weight: 600;
            color: #18181b;
          }
          .modal-cap {
            display: inline-flex;
            padding: 0.125rem 0.5rem;
            background: #fee2e2;
            color: #dc2626;
            border-radius: 0.375rem;
            font-size: 0.75rem;
            font-weight: 600;
            margin-left: 0.25rem;
          }
          .modal-footer {
            padding: 1rem 1.5rem 1.5rem;
            display: flex;
            justify-content: flex-end;
          }
          .modal-button {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1.5rem;
            background: #18181b;
            color: white;
            border: none;
            border-radius: 0.625rem;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 150ms ease;
          }
          .modal-button:hover {
            background: #27272a;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }
          .modal-button:active {
            transform: translateY(0);
          }
          .modal-button svg {
            width: 1rem;
            height: 1rem;
          }
        `}</style>
        
        <div className="modal-overlay" />
        <div className="modal-container">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">
                <div className="modal-icon">
                  <Info />
                </div>
                Important Information
              </h2>
            </div>
            
            <div className="modal-body">
              <p className="modal-intro">Before you proceed, please note:</p>
              <ul className="modal-list">
                <li className="modal-list-item">
                  <span className="modal-list-bullet">
                    <CheckCircle />
                  </span>
                  <span>
                    <span className="modal-highlight">The refund amount will match your receipt</span>, 
                    up to a maximum of <span className="modal-cap">$300 CAP</span>
                  </span>
                </li>
                <li className="modal-list-item">
                  <span className="modal-list-bullet">
                    <CheckCircle />
                  </span>
                  <span>
                    Refunds are based on <span className="modal-highlight">actual payment</span>, not estimates.
                  </span>
                </li>
                <li className="modal-list-item">
                  <span className="modal-list-bullet">
                    <CheckCircle />
                  </span>
                  <span>
                    Ensure all receipts are addressed to <span className="modal-highlight">LEET INITIATIVE</span>.
                  </span>
                </li>
              </ul>
            </div>
            
            <div className="modal-footer">
              <button 
                className="modal-button"
                onClick={() => setShowDisclaimer(false)}
              >
                I Understand, Proceed
                <ChevronLeft style={{ transform: 'rotate(180deg)' }} />
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }


  return (
    <div className="wizard-container">
      <style>{`
        .wizard-container {
          max-width: 40rem;
          margin: 0 auto;
          padding: 1.5rem 1rem;
        }
        
        .wizard-header {
          margin-bottom: 2rem;
        }
        
        .wizard-header-top {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-left: -0.5rem;
        }
        
        .wizard-title {
          font-size: 1.875rem;
          font-weight: 600;
          color: #18181b;
          letter-spacing: -0.025em;
          margin: 0;
        }
        
        .wizard-subtitle {
          font-size: 0.875rem;
          color: #71717a;
          margin-top: 0.375rem;
          margin-left: 2.75rem;
        }
        
        .steps-container {
          margin-bottom: 2rem;
          padding: 0 0.5rem;
        }
        
        .steps-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 32rem;
          margin: 0 auto;
        }
        
        .step-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          flex-shrink: 0;
        }
        
        .step-label {
          font-size: 0.75rem;
          font-weight: 500;
          text-align: center;
        }
        
        .wizard-card {
          background-color: white;
          border: 1px solid #e4e4e7;
          border-radius: 0.75rem;
          box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
          padding: 1.5rem;
        }

        @media (max-width: 640px) {
          .wizard-container {
            padding: 1rem;
          }
          
          .wizard-title {
            font-size: 1.5rem;
          }
          
          .wizard-subtitle {
            margin-left: 0;
            margin-top: 0.75rem;
          }

          .wizard-header-top {
            margin-left: 0;
            gap: 1rem;
          }

          .step-label {
            font-size: 0.7rem;
            display: none; /* Hide labels on very small screens */
          }
          
          .wizard-card {
            padding: 1.25rem;
          }
        }
        
        @media (min-width: 480px) {
          .step-label {
            display: block;
          }
        }

        .warning-container {
          margin-top: 2rem;
          padding: 1rem;
          background-color: #fff1f2;
          border: 1px solid #fee2e2;
          border-radius: 0.75rem;
          display: flex;
          gap: 0.75rem;
          align-items: center;
          animation: slideUp 0.4s ease-out;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .warning-icon {
          color: #e11d48;
          flex-shrink: 0;
        }

        .warning-text {
          font-size: 0.8125rem;
          color: #9f1239;
          font-weight: 500;
          line-height: 1.4;
        }
      `}</style>

      {/* Header */}
      <div className="wizard-header">
        <div className="wizard-header-top">
          <button 
            onClick={handleBack}
            style={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '50%',
              backgroundColor: 'transparent',
              border: '1px solid #e4e4e7',
              color: '#71717a',
              cursor: 'pointer',
              transition: 'all 150ms',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#18181b'
              e.currentTarget.style.color = 'white'
              e.currentTarget.style.borderColor = '#18181b'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.color = '#71717a'
              e.currentTarget.style.borderColor = '#e4e4e7'
            }}
          >
            <ChevronLeft style={{ width: '1.25rem', height: '1.25rem' }} />
          </button>
          <h1 className="wizard-title">
            New Refund Request
          </h1>
        </div>
        <p className="wizard-subtitle">
          Follow the steps to submit your expense.
        </p>
      </div>

      {/* Step Indicator */}
      <div className="steps-container">
        <div className="steps-inner">
          {steps.map((s, index) => {
            const Icon = s.icon
            const isActive = step === s.id
            const isCompleted = step > s.id
            
            return (
              <div key={s.id} style={{ display: 'flex', alignItems: 'flex-start', flex: index < steps.length - 1 ? 1 : 'none' }}>
                {/* Step Item */}
                <div className="step-item">
                  <div 
                    style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '2.25rem',
                      height: '2.25rem',
                      borderRadius: '50%',
                      border: '2px solid',
                      borderColor: isCompleted || isActive ? '#18181b' : '#e4e4e7',
                      backgroundColor: isCompleted ? '#18181b' : 'white',
                      color: isCompleted ? 'white' : isActive ? '#18181b' : '#a1a1aa',
                      transition: 'all 200ms',
                      zIndex: 1,
                      flexShrink: 0
                    }}
                  >
                    {isCompleted ? (
                      <CheckCircle style={{ width: '1rem', height: '1rem' }} />
                    ) : (
                      <Icon style={{ width: '0.875rem', height: '0.875rem' }} />
                    )}
                  </div>
                  <span 
                    className="step-label"
                    style={{ 
                      color: isActive || isCompleted ? '#18181b' : '#71717a',
                    }}
                  >
                    {s.label}
                  </span>
                </div>
                
                {/* Connecting Line */}
                {index < steps.length - 1 && (
                  <div 
                    style={{ 
                      flex: 1,
                      height: '2px',
                      margin: '0 0.5rem',
                      marginTop: 'calc(2.25rem / 2 - 1px)',
                      backgroundColor: '#e4e4e7',
                      borderRadius: '1px',
                      overflow: 'hidden'
                    }}
                  >
                    <div 
                      style={{ 
                        height: '100%',
                        backgroundColor: '#18181b',
                        transition: 'width 300ms',
                        width: step > s.id ? '100%' : '0%'
                      }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="wizard-card">
        {step === 1 && <StepCategory />}
        {step === 2 && <StepDetails />}
        {step === 3 && <StepSummary />}
      </div>

      {/* Warning Footer */}
      <div className="warning-container">
        <AlertCircle className="warning-icon" size={18} />
        <p className="warning-text">
          <strong>Important:</strong> Please ensure your submission is valid and accurate. 
          Submitting a request that does not make sense will lead to severe punishment.
        </p>
      </div>
    </div>
  )

}
