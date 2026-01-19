"use client"

import { useWizardStore } from "@/store/wizard-store"
import { StepCategory } from "@/components/student/wizard/step-category"
import { StepDetails } from "@/components/student/wizard/step-details"
import { StepSummary } from "@/components/student/wizard/step-summary"
import { ChevronLeft, FolderOpen, FileText, CheckCircle, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

const steps = [
  { id: 1, label: "Category", icon: FolderOpen },
  { id: 2, label: "Details", icon: FileText },
  { id: 3, label: "Review", icon: CheckCircle },
]

export default function CreateRequestPage() {
  const { step, setStep, reset } = useWizardStore()
  const router = useRouter()

  const handleBack = () => {
    if (step === 1) {
        reset()
        router.push("/student")
    } else {
        setStep(step - 1)
    }
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
          Submitting a request that does not make sense will lead to the proper punishment.
        </p>
      </div>
    </div>
  )

}
