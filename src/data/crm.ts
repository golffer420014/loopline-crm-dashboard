// Demo data for a fictional B2B software company. Every person and company here is made up.
// Dates are day offsets from "today", so the demo never looks stale.

export type Stage = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'
export type ContactStatus = 'customer' | 'lead' | 'at-risk' | 'churned'
export type Segment = 'Enterprise' | 'Mid-market' | 'SMB'
export type Source = 'Referral' | 'Website' | 'Events' | 'Outbound' | 'Partner'

export interface Rep { id: string; name: string; role: string; quota: number }
export interface Contact {
  id: string
  name: string
  title: string
  company: string
  segment: Segment
  status: ContactStatus
  source: Source
  ownerId: string
  email: string
  city: string
  lifetimeValue: number
  lastContactDaysAgo: number
  health: number // 0-100
}
export interface Deal {
  id: string
  title: string
  contactId: string
  ownerId: string
  value: number
  stage: Stage
  closeInDays: number // negative = closed that many days ago
}
export interface Activity {
  id: string
  type: 'call' | 'email' | 'meeting' | 'note'
  contactId: string
  ownerId: string
  minutesAgo: number
  summary: string
}

export const stages: { id: Stage; label: string; probability: number }[] = [
  { id: 'lead', label: 'Lead', probability: 0.1 },
  { id: 'qualified', label: 'Qualified', probability: 0.25 },
  { id: 'proposal', label: 'Proposal', probability: 0.5 },
  { id: 'negotiation', label: 'Negotiation', probability: 0.75 },
  { id: 'won', label: 'Won', probability: 1 },
  { id: 'lost', label: 'Lost', probability: 0 },
]
export const openStages: Stage[] = ['lead', 'qualified', 'proposal', 'negotiation']

export const reps: Rep[] = [
  { id: 'r1', name: 'Mali Srisuk', role: 'Head of Sales', quota: 180000 },
  { id: 'r2', name: 'Theo Marsh', role: 'Account Executive', quota: 120000 },
  { id: 'r3', name: 'Ploy Kanchana', role: 'Account Executive', quota: 120000 },
  { id: 'r4', name: 'Daniel Okafor', role: 'SDR', quota: 60000 },
]
export const me = reps[0]

export const contacts: Contact[] = [
  { id: 'c1', name: 'Hannah Lindqvist', title: 'VP Operations', company: 'Northfold Logistics', segment: 'Enterprise', status: 'customer', source: 'Referral', ownerId: 'r1', email: 'hannah@northfold.example', city: 'Stockholm', lifetimeValue: 184000, lastContactDaysAgo: 2, health: 92 },
  { id: 'c2', name: 'Arjun Mehta', title: 'CTO', company: 'Brightwell Health', segment: 'Enterprise', status: 'customer', source: 'Events', ownerId: 'r2', email: 'arjun@brightwell.example', city: 'Bengaluru', lifetimeValue: 152000, lastContactDaysAgo: 5, health: 81 },
  { id: 'c3', name: 'Sofia Romero', title: 'Head of Finance', company: 'Calde Studio', segment: 'SMB', status: 'lead', source: 'Website', ownerId: 'r4', email: 'sofia@calde.example', city: 'Madrid', lifetimeValue: 0, lastContactDaysAgo: 1, health: 64 },
  { id: 'c4', name: 'Kenji Watanabe', title: 'Procurement Lead', company: 'Sorano Foods', segment: 'Mid-market', status: 'at-risk', source: 'Outbound', ownerId: 'r3', email: 'kenji@sorano.example', city: 'Osaka', lifetimeValue: 46000, lastContactDaysAgo: 34, health: 38 },
  { id: 'c5', name: 'Amelia Grant', title: 'COO', company: 'Harbor & Vine', segment: 'Mid-market', status: 'customer', source: 'Partner', ownerId: 'r2', email: 'amelia@harborvine.example', city: 'Melbourne', lifetimeValue: 72000, lastContactDaysAgo: 9, health: 77 },
  { id: 'c6', name: 'Nattapong Chai', title: 'IT Director', company: 'Siam Freight Co.', segment: 'Enterprise', status: 'lead', source: 'Events', ownerId: 'r3', email: 'nattapong@siamfreight.example', city: 'Bangkok', lifetimeValue: 0, lastContactDaysAgo: 3, health: 70 },
  { id: 'c7', name: 'Lucas Ferreira', title: 'Founder', company: 'Pique Coffee', segment: 'SMB', status: 'customer', source: 'Website', ownerId: 'r4', email: 'lucas@pique.example', city: 'Lisbon', lifetimeValue: 12400, lastContactDaysAgo: 14, health: 85 },
  { id: 'c8', name: 'Grace Whitfield', title: 'Head of RevOps', company: 'Ledgerline', segment: 'Mid-market', status: 'at-risk', source: 'Referral', ownerId: 'r1', email: 'grace@ledgerline.example', city: 'London', lifetimeValue: 58000, lastContactDaysAgo: 41, health: 31 },
  { id: 'c9', name: 'Omar Haddad', title: 'Operations Manager', company: 'Dune Retail', segment: 'Mid-market', status: 'lead', source: 'Outbound', ownerId: 'r4', email: 'omar@dune.example', city: 'Dubai', lifetimeValue: 0, lastContactDaysAgo: 6, health: 55 },
  { id: 'c10', name: 'Elise Moreau', title: 'CMO', company: 'Atelier Nord', segment: 'SMB', status: 'churned', source: 'Website', ownerId: 'r2', email: 'elise@ateliernord.example', city: 'Lyon', lifetimeValue: 9800, lastContactDaysAgo: 96, health: 12 },
  { id: 'c11', name: 'Ben Carter', title: 'VP Engineering', company: 'Quarry Labs', segment: 'Enterprise', status: 'customer', source: 'Partner', ownerId: 'r1', email: 'ben@quarry.example', city: 'Austin', lifetimeValue: 231000, lastContactDaysAgo: 4, health: 88 },
  { id: 'c12', name: 'Mei Lin', title: 'Product Director', company: 'Tidewater Apps', segment: 'Mid-market', status: 'lead', source: 'Referral', ownerId: 'r3', email: 'mei@tidewater.example', city: 'Singapore', lifetimeValue: 0, lastContactDaysAgo: 2, health: 73 },
  { id: 'c13', name: 'Felix Bauer', title: 'Head of Sales', company: 'Kettle & Co.', segment: 'SMB', status: 'customer', source: 'Events', ownerId: 'r4', email: 'felix@kettle.example', city: 'Berlin', lifetimeValue: 18600, lastContactDaysAgo: 21, health: 69 },
  { id: 'c14', name: 'Isabela Costa', title: 'CFO', company: 'Verde Energy', segment: 'Enterprise', status: 'at-risk', source: 'Outbound', ownerId: 'r2', email: 'isabela@verde.example', city: 'São Paulo', lifetimeValue: 97000, lastContactDaysAgo: 28, health: 42 },
  { id: 'c15', name: 'Ryan Choi', title: 'Ops Lead', company: 'Parcelwise', segment: 'SMB', status: 'lead', source: 'Website', ownerId: 'r4', email: 'ryan@parcelwise.example', city: 'Seoul', lifetimeValue: 0, lastContactDaysAgo: 0, health: 60 },
  { id: 'c16', name: 'Priya Nair', title: 'Director of IT', company: 'Meridian Schools', segment: 'Mid-market', status: 'customer', source: 'Partner', ownerId: 'r3', email: 'priya@meridian.example', city: 'Toronto', lifetimeValue: 64000, lastContactDaysAgo: 7, health: 83 },
]

export const deals: Deal[] = [
  { id: 'd1', title: 'Fleet tracking rollout', contactId: 'c6', ownerId: 'r3', value: 86000, stage: 'negotiation', closeInDays: 9 },
  { id: 'd2', title: 'Clinic scheduling suite', contactId: 'c2', ownerId: 'r2', value: 54000, stage: 'proposal', closeInDays: 18 },
  { id: 'd3', title: 'Warehouse analytics', contactId: 'c1', ownerId: 'r1', value: 42000, stage: 'won', closeInDays: -6 },
  { id: 'd4', title: 'Starter plan', contactId: 'c3', ownerId: 'r4', value: 4800, stage: 'qualified', closeInDays: 21 },
  { id: 'd5', title: 'Renewal + 40 seats', contactId: 'c4', ownerId: 'r3', value: 31000, stage: 'negotiation', closeInDays: 5 },
  { id: 'd6', title: 'Multi-store POS sync', contactId: 'c9', ownerId: 'r4', value: 22000, stage: 'lead', closeInDays: 40 },
  { id: 'd7', title: 'Finance workspace', contactId: 'c8', ownerId: 'r1', value: 26000, stage: 'proposal', closeInDays: 12 },
  { id: 'd8', title: 'Mobile app analytics', contactId: 'c12', ownerId: 'r3', value: 38000, stage: 'qualified', closeInDays: 30 },
  { id: 'd9', title: 'Engineering seats', contactId: 'c11', ownerId: 'r1', value: 64000, stage: 'won', closeInDays: -14 },
  { id: 'd10', title: 'Courier dashboard', contactId: 'c15', ownerId: 'r4', value: 7600, stage: 'lead', closeInDays: 35 },
  { id: 'd11', title: 'Energy reporting', contactId: 'c14', ownerId: 'r2', value: 48000, stage: 'lost', closeInDays: -20 },
  { id: 'd12', title: 'District-wide licence', contactId: 'c16', ownerId: 'r3', value: 29000, stage: 'won', closeInDays: -3 },
  { id: 'd13', title: 'Wine club CRM', contactId: 'c5', ownerId: 'r2', value: 15000, stage: 'proposal', closeInDays: 15 },
  { id: 'd14', title: 'Café loyalty add-on', contactId: 'c7', ownerId: 'r4', value: 3200, stage: 'won', closeInDays: -10 },
  { id: 'd15', title: 'Sales team expansion', contactId: 'c13', ownerId: 'r4', value: 9400, stage: 'qualified', closeInDays: 26 },
  { id: 'd16', title: 'Brand refresh portal', contactId: 'c10', ownerId: 'r2', value: 6000, stage: 'lost', closeInDays: -45 },
]

export const activities: Activity[] = [
  { id: 'a1', type: 'call', contactId: 'c6', ownerId: 'r3', minutesAgo: 25, summary: 'Agreed pricing for 120 vehicles; legal review next' },
  { id: 'a2', type: 'email', contactId: 'c3', ownerId: 'r4', minutesAgo: 70, summary: 'Sent the starter plan comparison' },
  { id: 'a3', type: 'meeting', contactId: 'c2', ownerId: 'r2', minutesAgo: 190, summary: 'Demo for the clinic operations team' },
  { id: 'a4', type: 'note', contactId: 'c8', ownerId: 'r1', minutesAgo: 340, summary: 'Usage dropped 30%; offer an onboarding session' },
  { id: 'a5', type: 'call', contactId: 'c4', ownerId: 'r3', minutesAgo: 1440, summary: 'Renewal blocked on budget; follow up Friday' },
  { id: 'a6', type: 'email', contactId: 'c12', ownerId: 'r3', minutesAgo: 2600, summary: 'Shared the security questionnaire' },
]

// Monthly closed revenue for the last 12 months (demo figures), oldest first
export const revenueByMonth = [62, 58, 71, 69, 78, 74, 83, 88, 81, 94, 102, 97].map(k => k * 1000)

// New leads per day for the last 24 days, oldest first
export const leadsByDay = [1, 2, 1, 3, 2, 2, 4, 1, 3, 2, 5, 3, 2, 4, 3, 6, 2, 4, 5, 3, 6, 4, 7, 5]

// Sales activity: calls and meetings, plus proposals sent (drawn as the soft area)
export const activityMonthly = [
  { label: 'Jun', calls: 180, meetings: 96, proposals: 120 },
  { label: 'Jul', calls: 210, meetings: 120, proposals: 150 },
  { label: 'Aug', calls: 196, meetings: 104, proposals: 170 },
  { label: 'Sep', calls: 248, meetings: 140, proposals: 210 },
  { label: 'Oct', calls: 300, meetings: 168, proposals: 260 },
  { label: 'Nov', calls: 262, meetings: 210, proposals: 240 },
]
export const activityWeekly = [
  { label: 'W1', calls: 58, meetings: 30, proposals: 40 },
  { label: 'W2', calls: 66, meetings: 42, proposals: 55 },
  { label: 'W3', calls: 61, meetings: 48, proposals: 62 },
  { label: 'W4', calls: 77, meetings: 51, proposals: 70 },
  { label: 'W5', calls: 70, meetings: 58, proposals: 66 },
  { label: 'W6', calls: 84, meetings: 61, proposals: 78 },
]

export type Presence = 'available' | 'on-call' | 'away'
export const repPresence: Record<string, Presence> = { r1: 'available', r2: 'on-call', r3: 'available', r4: 'away' }
