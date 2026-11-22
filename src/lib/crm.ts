import { contacts, openStages, stages, type Contact, type ContactStatus, type Deal, type Segment, type Source, type Stage } from '../data/crm.ts'

export const stageOf = (id: Stage) => stages.find(s => s.id === id)!

export const money = (n: number) => '$' + Math.round(n).toLocaleString('en-US')
export const moneyShort = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `$${(n / 1000).toFixed(n >= 100_000 ? 0 : 1)}k` : `$${n}`

export function pipelineSummary(deals: Deal[]) {
  const byStage = stages.map(s => {
    const list = deals.filter(d => d.stage === s.id)
    return { ...s, count: list.length, value: list.reduce((t, d) => t + d.value, 0) }
  })
  const open = deals.filter(d => openStages.includes(d.stage))
  const openValue = open.reduce((t, d) => t + d.value, 0)
  const weighted = open.reduce((t, d) => t + d.value * stageOf(d.stage).probability, 0)
  const won = deals.filter(d => d.stage === 'won')
  const lost = deals.filter(d => d.stage === 'lost')
  const closed = won.length + lost.length
  return {
    byStage,
    openCount: open.length,
    openValue,
    weighted,
    wonValue: won.reduce((t, d) => t + d.value, 0),
    winRate: closed ? won.length / closed : 0, // share of closed deals that were won
  }
}

/** Move a deal to another stage; closing it pins the close date to today. */
export function moveDeal(deals: Deal[], id: string, stage: Stage): Deal[] {
  return deals.map(d => {
    if (d.id !== id || d.stage === stage) return d
    const closing = stage === 'won' || stage === 'lost'
    return { ...d, stage, closeInDays: closing ? 0 : Math.max(d.closeInDays, 1) }
  })
}

export interface ContactFilter { q?: string; status?: ContactStatus | 'all'; segment?: Segment | 'all' }

export function filterContacts(list: Contact[], f: ContactFilter) {
  const q = f.q?.trim().toLowerCase()
  return list.filter(c =>
    (!q || `${c.name} ${c.company} ${c.title} ${c.email} ${c.city}`.toLowerCase().includes(q)) &&
    (!f.status || f.status === 'all' || c.status === f.status) &&
    (!f.segment || f.segment === 'all' || c.segment === f.segment),
  )
}

export function sourceBreakdown(list: Contact[] = contacts) {
  const counts = new Map<Source, number>()
  for (const c of list) counts.set(c.source, (counts.get(c.source) ?? 0) + 1)
  return [...counts].map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count)
}

/** Percent change between the last value and the one before it. */
export const changePct = (series: number[]) => {
  const [prev, last] = series.slice(-2)
  return prev ? ((last - prev) / prev) * 100 : 0
}

export const relativeDays = (days: number) =>
  days === 0 ? 'today' : days === 1 ? 'yesterday' : days < 30 ? `${days}d ago` : `${Math.round(days / 30)}mo ago`

export const relativeMinutes = (m: number) => (m < 60 ? `${m}m ago` : m < 1440 ? `${Math.round(m / 60)}h ago` : relativeDays(Math.round(m / 1440)))

export const initials = (name: string) => name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
