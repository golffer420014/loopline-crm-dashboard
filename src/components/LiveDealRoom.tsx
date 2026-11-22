import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ClipboardCopy, Trophy } from 'lucide-react'
import { toast } from 'sonner'
import { Initials } from '@/components/bits'
import { contacts, openStages, reps, type Deal } from '@/data/crm'
import { money, stageOf } from '@/lib/crm'
import { useCrm } from '@/store/crm'

// one "beat" of buyer engagement: flat, a small bump, a sharp spike, a dip, back to flat
const BEAT = [0, 0, 0, 0.5, 0, -1, 6, -2.5, 0.6, 0, 0, 0, 1.2, 1.6, 1.2, 0.4, 0, 0, 0, 0]
const W = 300
const POINTS = 60
const engagementAt = (i: number) => BEAT[((i % BEAT.length) + BEAT.length) % BEAT.length]
const opensAt = (i: number) => Math.sin(i / 3.2) * 1.4 + Math.max(0, Math.sin(i / 3.2 - 0.8)) * 2.2

function line(fn: (i: number) => number, t: number, mid: number, scale: number) {
  return Array.from({ length: POINTS }, (_, k) => `${((k / (POINTS - 1)) * W).toFixed(1)},${(mid - fn(k + t) * scale).toFixed(1)}`).join(' ')
}

/** Streaming signal: advances while visible, holds still for reduced motion. */
function useTick(ms: number) {
  const [t, setT] = useState(0)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = setInterval(() => setT(x => x + 1), ms)
    return () => clearInterval(id)
  }, [ms])
  return t
}

function Tile({ label, value, sub, tone }: { label: string; value: React.ReactNode; sub: string; tone: string }) {
  return (
    <div className="border-t border-white/10 pt-2.5">
      <p className={`text-[11px] font-semibold ${tone}`}>{label}</p>
      <p className={`text-[1.4rem] font-semibold leading-tight tabular-nums ${tone}`}>{value}</p>
      <p className="text-[11px] text-on-ink-muted">{sub}</p>
    </div>
  )
}

export function LiveDealRoom({ deals, className = '' }: { deals: Deal[]; className?: string }) {
  const move = useCrm(s => s.move)
  const t = useTick(140)
  // the three open deals worth the most after weighting, closing within three weeks
  const hot = deals
    .filter(d => openStages.includes(d.stage) && d.closeInDays <= 21)
    .sort((a, b) => b.value * stageOf(b.stage).probability - a.value * stageOf(a.stage).probability)
    .slice(0, 3)
  const [pick, setPick] = useState<string | null>(null)
  const deal = hot.find(d => d.id === pick) ?? hot[0]

  if (!deal) {
    return (
      <section className={`ink-panel rounded-[1.75rem] p-6 text-on-ink ${className}`}>
        <h2 className="text-lg font-semibold">Deal room</h2>
        <p className="mt-3 text-on-ink-muted">Nothing closes in the next three weeks. <Link to="/pipeline" className="underline">Open the board</Link> to plan the month.</p>
      </section>
    )
  }

  const c = contacts.find(x => x.id === deal.contactId)!
  const owner = reps.find(r => r.id === deal.ownerId)!
  const stage = stageOf(deal.stage)
  const touches = 6 + (deal.value % 11) // stable per deal
  const close = new Date(Date.now() + deal.closeInDays * 864e5).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  const markWon = () => {
    const prev = deal.stage
    move(deal.id, 'won')
    toast.success(`${deal.title} marked as won`, { action: { label: 'Undo', onClick: () => move(deal.id, prev) } })
  }

  // a real action: puts a ready-to-send reminder for the owner on the clipboard
  const copyReminder = () => {
    const text = `Hi ${owner.name.split(' ')[0]}, ${deal.title} (${money(deal.value)}) is in ${stage.label} and closes ${close}. Can you get the next step booked?`
    navigator.clipboard.writeText(text).then(() => toast.success('Reminder copied'), () => toast.error('Could not reach the clipboard'))
  }

  return (
    <section aria-labelledby="room-h" className={`ink-panel flex flex-col rounded-[1.75rem] p-5 text-on-ink ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-[11px] font-bold text-bad">
            <span aria-hidden className="size-1.5 rounded-full bg-bad motion-safe:animate-pulse" /> Live
          </p>
          <h2 id="room-h" className="text-lg font-semibold">Deal room</h2>
        </div>
        <div role="tablist" aria-label="Hot deals" className="flex gap-1 rounded-full bg-white/[0.06] p-1">
          {hot.map((d, i) => (
            <button
              key={d.id}
              role="tab"
              type="button"
              aria-selected={d.id === deal.id}
              onClick={() => setPick(d.id)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${d.id === deal.id ? 'bg-on-ink text-ink' : 'text-on-ink-muted hover:text-on-ink'}`}
            >
              D-{String(i + 1).padStart(2, '0')}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Initials name={c.name} className="size-10 text-xs" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{deal.title}</p>
          <p className="truncate text-xs text-on-ink-muted">{c.company}, {stage.label}</p>
        </div>
        <span className="rounded-full bg-sig-1-soft px-2.5 py-1 text-xs font-semibold text-sig-1">{deal.closeInDays <= 7 ? 'Closing soon' : 'On track'}</span>
      </div>

      {/* the signal panel */}
      <div className="mt-4 rounded-2xl bg-ink-well p-3 ring-1 ring-white/[0.06]" role="img" aria-label={`Live buyer engagement and email opens for ${deal.title}`}>
        <div className="flex justify-between text-[10px] font-semibold text-on-ink-muted">
          <span>Buyer engagement</span><span className="tabular-nums">{touches} touches this week</span>
        </div>
        <svg viewBox={`0 0 ${W} 150`} className="mt-1 h-28 w-full" preserveAspectRatio="none" aria-hidden>
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0V20" fill="none" stroke="var(--ink-grid)" /></pattern>
          </defs>
          <rect width={W} height="150" fill="url(#grid)" />
          <polyline points={line(engagementAt, t, 52, 6.5)} fill="none" stroke="var(--sig-1)" strokeWidth="1.8" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 4px var(--sig-1))' }} />
          <text x="0" y="96" fill="var(--ink-label)" fontSize="9" fontWeight="600">Email opens</text>
          <polyline points={line(opensAt, t * 0.6, 128, 7)} fill="none" stroke="var(--sig-2)" strokeWidth="1.8" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 0 4px var(--sig-2))' }} />
        </svg>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
        <Tile label="Value" value={money(deal.value)} sub="annual contract" tone="text-sig-1" />
        <Tile label="Win chance" value={`${Math.round(stage.probability * 100)}%`} sub={`${stage.label} stage`} tone="text-sig-2" />
        <Tile label="Closes" value={<>{deal.closeInDays}<span className="text-base">d</span></>} sub={close} tone="text-sig-3" />
        <Tile label="Touches" value={touches} sub="calls, emails, meetings" tone="text-sig-4" />
      </div>

      <p className="mt-3 text-xs text-on-ink-muted">Owner <span className="font-semibold text-on-ink">{owner.name}</span></p>
      <div className="mt-auto grid grid-cols-2 gap-2 pt-3">
        <button type="button" onClick={markWon} className="flex h-10 items-center justify-center gap-2 rounded-full bg-on-ink text-sm font-semibold text-ink transition-[transform,background-color] hover:bg-white active:translate-y-px">
          <Trophy className="size-4" /> Mark as won
        </button>
        <button type="button" onClick={copyReminder} className="flex h-10 items-center justify-center gap-2 rounded-full bg-white/[0.08] text-sm font-semibold transition-colors hover:bg-white/[0.14] active:translate-y-px">
          <ClipboardCopy className="size-4" /> Copy reminder
        </button>
      </div>
    </section>
  )
}
