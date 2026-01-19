
import { create } from 'zustand'

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

export const useWizardStore = create<WizardState>((set) => ({
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
}))
