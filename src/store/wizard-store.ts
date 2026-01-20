
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type RequestCategory = 'transport' | 'equipment' | 'certification' | 'other'

interface WizardState {
  step: number
  data: {
    category: RequestCategory | null
    amount: string
    description: string
    date: Date | undefined
  }
  setStep: (step: number) => void
  setData: (data: Partial<WizardState['data']>) => void
  reset: () => void
}

export const useWizardStore = create<WizardState>()(
  persist(
    (set) => ({
      step: 1,
      data: {
        category: null,
        amount: '',
        description: '',
        date: undefined,
      },
      setStep: (step) => set({ step }),
      setData: (newData) => set((state) => ({ data: { ...state.data, ...newData } })),
      reset: () => set({ 
        step: 1, 
        data: { category: null, amount: '', description: '', date: undefined } 
      }),
    }),
    {
      name: 'refund-wizard-storage',
      partialize: (state) => ({
        step: state.step,
        data: state.data
      }),
    }
  )
)

