import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { deals as seedDeals, type Deal, type Stage } from '@/data/crm'
import { moveDeal } from '@/lib/crm'

interface CrmState {
  deals: Deal[]
  move: (id: string, stage: Stage) => void
  reset: () => void
}

// Deals are the one thing a visitor can change (drag on the board), so they persist in localStorage
export const useCrm = create<CrmState>()(
  persist(
    set => ({
      deals: seedDeals,
      move: (id, stage) => set(s => ({ deals: moveDeal(s.deals, id, stage) })),
      reset: () => set({ deals: seedDeals }),
    }),
    { name: 'loopline-crm', version: 1 },
  ),
)
