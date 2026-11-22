import type { ContactStatus, Presence } from '@/data/crm'
import { initials } from '@/lib/crm'
import { cn } from '@/lib/utils'

// a stable hue per name, so the same person always gets the same avatar colour
const hueOf = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7)

const ringTone = { ok: 'ring-ok', warn: 'ring-warn', bad: 'ring-bad', primary: 'ring-primary', none: 'ring-transparent' }
const dotTone = { ok: 'bg-ok', warn: 'bg-warn', bad: 'bg-bad', primary: 'bg-primary', none: 'hidden' }
export type Tone = keyof typeof ringTone

/** Initials on a soft two-stop gradient; optional status ring and dot. */
export function Initials({ name, className, ring = 'none' }: { name: string; className?: string; ring?: Tone }) {
  const h = hueOf(name)
  return (
    <span aria-hidden className={cn('relative grid size-10 shrink-0 place-items-center rounded-full', ring !== 'none' && 'ring-2 ring-offset-2 ring-offset-card', ringTone[ring], className)}>
      <span
        className="grid size-full place-items-center rounded-full text-[0.82em] font-semibold tracking-tight"
        style={{ background: `linear-gradient(140deg, oklch(93% 0.05 ${h}), oklch(82% 0.09 ${(h + 40) % 360}))`, color: `oklch(32% 0.09 ${h})` }}
      >
        {initials(name)}
      </span>
      {ring !== 'none' && <span className={cn('absolute bottom-0 right-0 size-[26%] min-w-2.5 min-h-2.5 rounded-full border-2 border-card', dotTone[ring])} />}
    </span>
  )
}

const statusStyle: Record<ContactStatus, { label: string; tone: Tone; text: string }> = {
  customer: { label: 'Customer', tone: 'ok', text: 'text-ok-text' },
  lead: { label: 'Lead', tone: 'primary', text: 'text-primary' },
  'at-risk': { label: 'At risk', tone: 'warn', text: 'text-warn-text' },
  churned: { label: 'Churned', tone: 'bad', text: 'text-bad-text' },
}
export const statusLabel = (s: ContactStatus) => statusStyle[s].label
export const statusTone = (s: ContactStatus) => statusStyle[s].tone

/** White pill with a coloured dot: the status label used on cards and lists. */
export function Pill({ tone, children, className }: { tone: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('pill inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', className)}>
      <span aria-hidden className={cn('size-1.5 rounded-full', dotTone[tone])} />
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: ContactStatus }) {
  const s = statusStyle[status]
  return <Pill tone={s.tone} className={s.text}>{s.label}</Pill>
}

const presence: Record<Presence, { label: string; tone: Tone }> = {
  available: { label: 'Available', tone: 'ok' },
  'on-call': { label: 'On a call', tone: 'primary' },
  away: { label: 'Away', tone: 'warn' },
}
export const presenceOf = (p: Presence) => presence[p]

/** Page heading: one weight, one colour; `accent` goes on its own line when `stacked`. */
export function PageTitle({ lead, accent, sub, stacked, chip }: { lead: string; accent: string; sub?: React.ReactNode; stacked?: boolean; chip?: React.ReactNode }) {
  return (
    <div className="min-w-0">
      {chip && <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">{chip}</div>}
      <h1 className={cn('font-semibold tracking-[-0.035em] text-foreground', stacked ? 'text-5xl leading-[1.02] md:text-[4.25rem]' : 'text-4xl leading-tight md:text-5xl')}>
        {lead}
        {stacked ? <br /> : ' '}
        {accent}
      </h1>
      {sub && <p className="mt-3 text-muted-foreground">{sub}</p>}
    </div>
  )
}

/** Icon in a small white disc, used at the top of KPI cards. */
export function IconDisc({ icon: Icon }: { icon: React.ElementType }) {
  return (
    <span className="grid size-9 place-items-center rounded-full border bg-card text-foreground/70 shadow-sm">
      <Icon aria-hidden className="size-4" />
    </span>
  )
}
