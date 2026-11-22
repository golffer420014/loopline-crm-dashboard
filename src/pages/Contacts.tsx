import { useSearchParams } from 'react-router'
import { Cell, Pie, PieChart } from 'recharts'
import { Mail, MapPin, Search, SearchX, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Initials, PageTitle, Pill, StatusBadge, statusLabel, statusTone } from '@/components/bits'
import { activities, contacts, reps, type ContactStatus, type Segment } from '@/data/crm'
import { filterContacts, money, moneyShort, relativeDays, relativeMinutes, sourceBreakdown, stageOf } from '@/lib/crm'
import { useCrm } from '@/store/crm'

const statuses: (ContactStatus | 'all')[] = ['all', 'customer', 'lead', 'at-risk', 'churned']
const segments: (Segment | 'all')[] = ['all', 'Enterprise', 'Mid-market', 'SMB']
const statusColor: Record<ContactStatus, string> = { customer: 'var(--ok)', lead: 'var(--primary)', 'at-risk': 'var(--warn)', churned: 'var(--bad)' }
const HEALTHY = 70 // the marker on every health bar

function HealthBar({ value }: { value: number }) {
  const tone = value >= HEALTHY ? 'bg-ok' : value >= 45 ? 'bg-warn' : 'bg-bad'
  return (
    <div className="relative h-1.5 rounded-full bg-muted" role="meter" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label={`Account health ${value} of 100`}>
      <div className={`h-full origin-left rounded-full ${tone}`} style={{ transform: `scaleX(${value / 100})` }} />
      {/* the healthy threshold */}
      <span aria-hidden className="absolute -top-1.5 h-4.5 w-0.5 rounded-full bg-foreground/70" style={{ left: `${HEALTHY}%` }} />
    </div>
  )
}

export default function Contacts() {
  const [params, setParams] = useSearchParams()
  const deals = useCrm(s => s.deals)
  const q = params.get('q') ?? ''
  const status = (params.get('status') as ContactStatus | null) ?? 'all'
  const segment = (params.get('segment') as Segment | null) ?? 'all'
  const open = contacts.find(c => c.id === params.get('open'))

  const set = (key: string, value: string | null) => {
    const next = new URLSearchParams(params)
    if (value && value !== 'all') next.set(key, value); else next.delete(key)
    setParams(next, { replace: key !== 'open' })
  }

  const list = filterContacts(contacts, { q, status, segment })
  const counts = Object.fromEntries(statuses.map(s => [s, s === 'all' ? contacts.length : contacts.filter(c => c.status === s).length])) as Record<ContactStatus | 'all', number>
  const mix = (['customer', 'lead', 'at-risk', 'churned'] as ContactStatus[]).map(s => ({ status: s, count: counts[s] }))
  const mixConfig = Object.fromEntries(mix.map(m => [m.status, { label: statusLabel(m.status), color: statusColor[m.status] }])) satisfies ChartConfig
  const sources = sourceBreakdown()
  const atRiskValue = contacts.filter(c => c.status === 'at-risk').reduce((t, c) => t + c.lifetimeValue, 0)

  return (
    <div className="space-y-6">
      <div className="rise flex flex-wrap items-end justify-between gap-4">
        <PageTitle lead="Customer" accent="directory" sub={`${contacts.length} contacts across ${new Set(contacts.map(c => c.company)).size} companies. ${counts.customer} pay today.`} />
        <div className="pill relative flex h-11 w-full max-w-xs items-center rounded-full">
          <Search aria-hidden className="pointer-events-none absolute left-4 size-4 text-muted-foreground" />
          <input
            value={q}
            onChange={e => set('q', e.target.value)}
            placeholder="Filter by name, company or city"
            aria-label="Filter contacts"
            className="size-full rounded-full bg-transparent pl-11 pr-10 text-sm outline-none placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          />
          {q && <button type="button" aria-label="Clear filter" onClick={() => set('q', null)} className="absolute right-3 grid size-6 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"><X className="size-4" /></button>}
        </div>
      </div>

      <div className="rise flex flex-wrap items-center gap-3" style={{ '--i': 1 } as React.CSSProperties}>
        <div role="group" aria-label="Status" className="flex flex-wrap gap-1 rounded-full bg-white/50 p-1 ring-1 ring-white/80">
          {statuses.map(s => (
            <button
              key={s}
              type="button"
              aria-pressed={status === s}
              onClick={() => set('status', s)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${status === s ? 'pill text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {s === 'all' ? 'All' : statusLabel(s)} <span className="ml-0.5 text-xs tabular-nums text-muted-foreground">{counts[s]}</span>
            </button>
          ))}
        </div>
        <Select value={segment} onValueChange={v => set('segment', v)}>
          <SelectTrigger className="pill ml-auto h-10 w-44 rounded-full border-0" aria-label="Segment"><SelectValue /></SelectTrigger>
          <SelectContent>{segments.map(s => <SelectItem key={s} value={s}>{s === 'all' ? 'All segments' : s}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
        {list.length ? (
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 2xl:grid-cols-3">
            {list.map((c, i) => (
              <li key={c.id} className="rise" style={{ '--i': Math.min(i, 8) + 2 } as React.CSSProperties}>
                <button type="button" onClick={() => set('open', c.id)} className="glass lift flex size-full flex-col rounded-[1.75rem] p-5 text-left" aria-label={c.name} aria-describedby={`ct-${c.id}`}>
                  <div className="flex w-full items-start justify-between gap-3">
                    <Initials name={c.name} ring={statusTone(c.status)} className="size-14 text-sm" />
                    <StatusBadge status={c.status} />
                  </div>
                  <p className="mt-4 text-[1.05rem] font-semibold tracking-tight">{c.name}</p>
                  <p id={`ct-${c.id}`} className="truncate text-sm text-muted-foreground">{c.title}, {c.company}<span className="sr-only">, {statusLabel(c.status)}</span></p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-full bg-accent px-2.5 py-1 font-semibold text-primary">{c.segment}</span>
                    <span className="flex items-center gap-1 text-muted-foreground"><MapPin aria-hidden className="size-3.5" />{c.city}</span>
                  </div>
                  <dl className="mt-4 grid w-full grid-cols-2 divide-x border-y py-2.5 text-sm">
                    <div className="pr-3"><dt className="text-[11px] text-muted-foreground">Lifetime value</dt><dd className="font-semibold tabular-nums">{c.lifetimeValue ? moneyShort(c.lifetimeValue) : 'None yet'}</dd></div>
                    <div className="pl-3"><dt className="text-[11px] text-muted-foreground">Last contact</dt><dd className="font-semibold">{relativeDays(c.lastContactDaysAgo)}</dd></div>
                  </dl>
                  <div className="mt-4 w-full">
                    <div className="mb-2 flex justify-between text-[11px] text-muted-foreground"><span>Account health</span><span className="font-semibold tabular-nums text-foreground">{c.health}</span></div>
                    <HealthBar value={c.health} />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="glass grid place-items-center rounded-[1.75rem] py-20 text-center text-muted-foreground">
            <SearchX className="mb-3 size-10" strokeWidth={1.5} />
            <p>No contacts match these filters.</p>
            <Button variant="link" onClick={() => setParams({}, { replace: true })}>Clear all filters</Button>
          </div>
        )}

        <aside className="space-y-5">
          <section className="glass rise rounded-[1.75rem] p-5" style={{ '--i': 2 } as React.CSSProperties}>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Customer mix</h2>
              <Pill tone="ok">Live</Pill>
            </div>
            <div className="relative mx-auto mt-2 aspect-square w-52">
              <ChartContainer config={mixConfig} className="size-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="status" hideLabel />} />
                  <Pie data={mix} dataKey="count" nameKey="status" innerRadius={70} outerRadius={92} paddingAngle={3} cornerRadius={6} strokeWidth={0}>
                    {mix.map(m => <Cell key={m.status} fill={statusColor[m.status]} />)}
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
                <p className="text-4xl font-semibold tabular-nums">{contacts.length}</p>
                <p className="text-xs text-muted-foreground">contacts</p>
              </div>
            </div>
            <ul className="mt-3 space-y-3">
              {mix.map(m => (
                <li key={m.status}>
                  <button type="button" onClick={() => set('status', m.status)} className="w-full text-left text-sm">
                    <span className="flex items-center gap-2">
                      <span aria-hidden className="size-2.5 rounded-full" style={{ background: statusColor[m.status] }} />
                      <span className="flex-1">{statusLabel(m.status)}</span>
                      <span className="tabular-nums font-semibold">{m.count}</span>
                    </span>
                    <span className="mt-1.5 block h-1 rounded-full bg-muted">
                      <span className="block h-full origin-left rounded-full" style={{ background: statusColor[m.status], transform: `scaleX(${m.count / contacts.length})` }} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="glass rise rounded-[1.75rem] p-5" style={{ '--i': 3 } as React.CSSProperties}>
            <h2 className="font-semibold">Lead sources</h2>
            <ul className="mt-3 space-y-2.5 text-sm">
              {sources.map(s => (
                <li key={s.source} className="grid grid-cols-[5.5rem_minmax(0,1fr)_1.5rem] items-center gap-3">
                  <span className="text-muted-foreground">{s.source}</span>
                  <span className="h-2 rounded-full bg-muted"><span className="block h-full origin-left rounded-full bg-primary/70" style={{ transform: `scaleX(${s.count / sources[0].count})` }} /></span>
                  <span className="text-right tabular-nums font-semibold">{s.count}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="ink-panel rise rounded-[1.75rem] p-5 text-on-ink" style={{ '--i': 4 } as React.CSSProperties}>
            <h2 className="font-semibold">Needs attention</h2>
            <p className="mt-1 text-sm text-on-ink-muted">{counts['at-risk']} accounts at risk, worth {money(atRiskValue)} in lifetime value.</p>
            <button type="button" className="mt-4 h-10 w-full rounded-full bg-on-ink text-sm font-semibold text-ink transition-colors hover:bg-white active:translate-y-px" onClick={() => set('status', 'at-risk')}>Show at-risk accounts</button>
          </section>
        </aside>
      </div>

      <Sheet open={!!open} onOpenChange={o => { if (!o) set('open', null) }}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          {open && (
            <>
              <SheetHeader>
                <div className="flex items-center gap-3">
                  <Initials name={open.name} ring={statusTone(open.status)} className="size-14 text-base" />
                  <div>
                    <SheetTitle className="text-xl">{open.name}</SheetTitle>
                    <SheetDescription>{open.title}, {open.company}</SheetDescription>
                  </div>
                </div>
              </SheetHeader>
              <div className="space-y-6 px-4 pb-6">
                <div className="flex flex-wrap gap-2">
                  <StatusBadge status={open.status} />
                  <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-primary">{open.segment}</span>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs">Source: {open.source}</span>
                </div>
                <dl className="space-y-2.5 text-sm">
                  <div className="flex items-center gap-2"><Mail aria-hidden className="size-4 text-muted-foreground" /><dt className="sr-only">Email</dt><dd>{open.email}</dd></div>
                  <div className="flex items-center gap-2"><MapPin aria-hidden className="size-4 text-muted-foreground" /><dt className="sr-only">City</dt><dd>{open.city}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Owner</dt><dd>{reps.find(r => r.id === open.ownerId)?.name}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Lifetime value</dt><dd className="font-semibold tabular-nums">{money(open.lifetimeValue)}</dd></div>
                  <div><dt className="mb-2 flex justify-between text-muted-foreground">Account health <span className="font-semibold text-foreground">{open.health}</span></dt><dd><HealthBar value={open.health} /></dd></div>
                </dl>
                <section>
                  <h3 className="mb-2 font-semibold">Deals</h3>
                  <ul className="space-y-2">
                    {deals.filter(d => d.contactId === open.id).map(d => (
                      <li key={d.id} className="flex items-center justify-between rounded-2xl bg-muted/70 px-3 py-2.5 text-sm">
                        <span><span className="font-medium">{d.title}</span><span className="block text-xs text-muted-foreground">{stageOf(d.stage).label}</span></span>
                        <span className="font-semibold tabular-nums">{moneyShort(d.value)}</span>
                      </li>
                    ))}
                    {!deals.some(d => d.contactId === open.id) && <li className="text-sm text-muted-foreground">No deals yet.</li>}
                  </ul>
                </section>
                <section>
                  <h3 className="mb-2 font-semibold">Activity</h3>
                  <ul className="space-y-2 text-sm">
                    {activities.filter(a => a.contactId === open.id).map(a => (
                      <li key={a.id}><p>{a.summary}</p><p className="text-xs text-muted-foreground">{a.type}, {relativeMinutes(a.minutesAgo)}</p></li>
                    ))}
                    {!activities.some(a => a.contactId === open.id) && <li className="text-muted-foreground">Last touched {relativeDays(open.lastContactDaysAgo)}.</li>}
                  </ul>
                </section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
