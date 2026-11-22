import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, XAxis, YAxis } from 'recharts'
import { ArrowDownRight, ArrowUpRight, CalendarDays, CircleDollarSign, Download, Layers3, Mail, MessageSquareText, Phone, Sparkles, UserPlus, Users2 } from 'lucide-react'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { IconDisc, Initials, PageTitle, Pill, presenceOf } from '@/components/bits'
import { LiveDealRoom } from '@/components/LiveDealRoom'
import { QuotaGauge } from '@/components/QuotaGauge'
import { activities, activityMonthly, activityWeekly, contacts, leadsByDay, me, openStages, repPresence, reps, revenueByMonth, type Activity } from '@/data/crm'
import { changePct, money, moneyShort, pipelineSummary, relativeMinutes, stageOf } from '@/lib/crm'
import { useCrm } from '@/store/crm'

const monthLabel = (offset: number) => {
  const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - offset)
  return d.toLocaleDateString('en-US', { month: 'short' })
}
const revenueSeries = revenueByMonth.map((value, i) => ({ month: monthLabel(revenueByMonth.length - 1 - i), value }))
// month names follow today's date so the demo never shows a stale calendar
const monthly = activityMonthly.map((row, i) => ({ ...row, label: monthLabel(activityMonthly.length - 1 - i) }))

const sparkConfig = { value: { label: 'Revenue', color: 'var(--chart-1)' } } satisfies ChartConfig
const activityConfig = {
  calls: { label: 'Calls', color: 'var(--act-calls)' },
  meetings: { label: 'Meetings', color: 'var(--act-meetings)' },
  proposals: { label: 'Proposals', color: 'var(--act-proposals)' },
} satisfies ChartConfig

function Trend({ pct, label }: { pct: number; label: string }) {
  const up = pct >= 0
  const Icon = up ? ArrowUpRight : ArrowDownRight
  return (
    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className={`inline-flex items-center gap-0.5 font-semibold ${up ? 'text-ok-text' : 'text-bad-text'}`}><Icon aria-hidden className="size-3.5" />{Math.abs(pct).toFixed(0)}%</span>
      {label}
    </p>
  )
}

function Kpi({ icon, label, value, foot, children, i }: { icon: React.ElementType; label: string; value: string; foot: React.ReactNode; children: React.ReactNode; i: number }) {
  return (
    <section className="glass lift rise flex flex-col rounded-[1.75rem] p-5" style={{ '--i': i } as React.CSSProperties}>
      <div className="flex items-center gap-3">
        <IconDisc icon={icon} />
        <h2 className="text-sm font-semibold text-foreground/80">{label}</h2>
      </div>
      <p className="mt-5 text-[2.5rem] font-semibold leading-none tracking-[-0.03em] tabular-nums">{value}</p>
      <div className="mt-2">{foot}</div>
      {/* the chart takes whatever height the row gives the card */}
      <div className="mt-4 min-h-16 flex-1" aria-hidden>{children}</div>
    </section>
  )
}

/** Thin bars that fade in from the left, like a level meter. */
function Equalizer({ data }: { data: number[] }) {
  const max = Math.max(...data)
  return (
    <div className="flex h-full items-end gap-[3px]">
      {data.map((v, i) => (
        <span
          key={i}
          className="w-[3px] flex-1 origin-bottom rounded-full bg-bar motion-safe:animate-[rise_0.6s_ease-out_both]"
          style={{ height: `${(v / max) * 100}%`, opacity: 0.18 + (i / data.length) * 0.82, animationDelay: `${i * 18}ms` }}
        />
      ))}
    </div>
  )
}

const activityIcon: Record<Activity['type'], typeof Phone> = { call: Phone, email: Mail, meeting: Users2, note: MessageSquareText }

function exportCsv(rows: ReturnType<typeof useCrm.getState>['deals']) {
  const head = ['Deal', 'Company', 'Owner', 'Stage', 'Value (USD)', 'Close in (days)']
  const body = rows.map(d => [d.title, contacts.find(c => c.id === d.contactId)?.company ?? '', reps.find(r => r.id === d.ownerId)?.name ?? '', stageOf(d.stage).label, d.value, d.closeInDays])
  const csv = [head, ...body].map(r => r.map(v => `"${String(v).replaceAll('"', '""')}"`).join(',')).join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  a.download = 'loopline-deals.csv'
  a.click()
  URL.revokeObjectURL(a.href)
}

export default function Dashboard() {
  const deals = useCrm(s => s.deals)
  const [period, setPeriod] = useState<'monthly' | 'weekly'>('monthly')
  const sum = useMemo(() => pipelineSummary(deals), [deals])

  const negotiating = deals.filter(d => d.stage === 'negotiation').length
  const openByStage = openStages.map(id => ({ stage: stageOf(id).label, value: sum.byStage.find(b => b.id === id)!.value }))
  const leadsThis = leadsByDay.slice(-12).reduce((a, b) => a + b, 0)
  const leadsPrev = leadsByDay.slice(0, 12).reduce((a, b) => a + b, 0)
  const teamQuota = reps.reduce((t, r) => t + r.quota, 0)

  const board = reps
    .map(r => ({ ...r, won: deals.filter(d => d.ownerId === r.id && d.stage === 'won').reduce((t, d) => t + d.value, 0) }))
    .sort((a, b) => b.won / b.quota - a.won / a.quota)

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
      {/* left column: hero, then KPI cards that stretch to the live card's height */}
      <div className="flex flex-col gap-6 xl:col-span-8">
      <div className="rise flex flex-wrap items-end justify-between gap-5">
        <PageTitle
          stacked
          lead="Welcome back,"
          accent={me.name.split(' ')[0]}
          chip={
            <>
              <span className="pill inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium text-foreground">
                <Sparkles aria-hidden className="size-3.5 text-primary" /> {negotiating} deals in negotiation
              </span>
              <span>Good to see you. Here is your pipeline today.</span>
            </>
          }
        />
        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="pill flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold">
                <CalendarDays aria-hidden className="size-4" /> {period === 'monthly' ? 'Last 6 months' : 'Last 6 weeks'}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-2xl p-2">
              <DropdownMenuItem className="rounded-xl" onSelect={() => setPeriod('monthly')}>Last 6 months</DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl" onSelect={() => setPeriod('weekly')}>Last 6 weeks</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button type="button" onClick={() => exportCsv(deals)} className="pill flex h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold active:translate-y-px">
            Export deals <Download aria-hidden className="size-4" />
          </button>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 gap-5 sm:grid-cols-3">
        <Kpi i={1} icon={CircleDollarSign} label="Revenue" value={moneyShort(revenueByMonth.at(-1)!)} foot={<Trend pct={changePct(revenueByMonth)} label="from last month" />}>
          <ChartContainer config={sparkConfig} className="aspect-auto size-full">
            <AreaChart accessibilityLayer={false} data={revenueSeries.slice(-9)} margin={{ top: 4, bottom: 0, left: 0, right: 0 }}>
              <defs>
                <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-value)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--color-value)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area dataKey="value" type="monotone" stroke="var(--color-value)" fill="url(#spark)" strokeWidth={2} />
            </AreaChart>
          </ChartContainer>
        </Kpi>
        <Kpi i={2} icon={Layers3} label="Open pipeline" value={moneyShort(sum.openValue)} foot={<p className="text-xs text-muted-foreground"><span className="font-semibold text-foreground">{sum.openCount}</span> open deals, {money(sum.weighted)} weighted</p>}>
          <ChartContainer config={sparkConfig} className="aspect-auto size-full">
            <BarChart accessibilityLayer={false} data={openByStage} margin={{ top: 4, bottom: 0, left: 0, right: 0 }} barCategoryGap={6}>
              <defs>
                <linearGradient id="bars" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--area-from)" />
                  <stop offset="100%" stopColor="var(--area-to)" />
                </linearGradient>
              </defs>
              <Bar dataKey="value" radius={[4, 4, 4, 4]}>
                {openByStage.map((_, i) => <Cell key={i} fill="url(#bars)" fillOpacity={0.5 + i * 0.16} />)}
              </Bar>
            </BarChart>
          </ChartContainer>
        </Kpi>
        <Kpi i={3} icon={UserPlus} label="New leads" value={String(leadsThis)} foot={<Trend pct={((leadsThis - leadsPrev) / leadsPrev) * 100} label="vs the 12 days before" />}>
          <Equalizer data={leadsByDay} />
        </Kpi>
      </div>
      </div>

      <LiveDealRoom deals={deals} className="rise xl:col-span-4" />

      {/* activity chart + quota gauge */}
      <section className="glass rise rounded-[1.75rem] p-5 xl:col-span-5" style={{ '--i': 4 } as React.CSSProperties}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">Sales activity</h2>
          <div className="flex items-center gap-2">
            <div role="tablist" aria-label="Activity period" className="flex rounded-full bg-muted p-1">
              {(['monthly', 'weekly'] as const).map(p => (
                <button key={p} role="tab" type="button" aria-selected={period === p} onClick={() => setPeriod(p)} className={`rounded-full px-3 py-1 text-xs font-semibold capitalize transition-colors ${period === p ? 'pill text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>{p}</button>
              ))}
            </div>
          </div>
        </div>
        <ChartContainer config={activityConfig} className="mt-4 aspect-auto h-64 w-full">
          <ComposedChart data={period === 'monthly' ? monthly : activityWeekly} margin={{ left: -8, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="prop" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-proposals)" stopOpacity={0.7} />
                <stop offset="100%" stopColor="var(--color-proposals)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 6" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={10} />
            <YAxis tickLine={false} axisLine={false} width={40} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area dataKey="proposals" type="monotone" stroke="none" fill="url(#prop)" />
            <Line dataKey="calls" type="linear" stroke="var(--color-calls)" strokeWidth={2} dot={{ r: 4.5, fill: 'var(--card)', strokeWidth: 2 }} activeDot={{ r: 6 }} />
            <Line dataKey="meetings" type="linear" stroke="var(--color-meetings)" strokeWidth={2} dot={{ r: 4.5, fill: 'var(--card)', strokeWidth: 2 }} activeDot={{ r: 6 }} />
          </ComposedChart>
        </ChartContainer>
        <ul className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
          {Object.entries(activityConfig).map(([k, v]) => (
            <li key={k} className="flex items-center gap-1.5"><span aria-hidden className="size-2.5 rounded-full" style={{ background: v.color }} />{v.label}</li>
          ))}
        </ul>
      </section>

      <section className="glass rise flex flex-col rounded-[1.75rem] p-5 xl:col-span-3" style={{ '--i': 5 } as React.CSSProperties}>
        <h2 className="font-semibold">Quota progress</h2>
        <div className="flex flex-1 items-center py-2">
          <QuotaGauge value={sum.wonValue} target={teamQuota} />
        </div>
        <p className="text-center text-xs text-muted-foreground">Closed-won deals against the combined team quota</p>
      </section>

      <section className="glass rise rounded-[1.75rem] p-5 xl:col-span-4" style={{ '--i': 6 } as React.CSSProperties}>
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold">Sales team <span className="rounded-full bg-ok-soft px-2 py-0.5 text-[11px] font-semibold text-ok-text">{Object.values(repPresence).filter(p => p !== 'away').length} online</span></h2>
          <Link to="/pipeline" className="pill rounded-full px-3 py-1 text-xs font-semibold">View board</Link>
        </div>
        <ul className="mt-4 space-y-3">
          {board.map(r => {
            const p = presenceOf(repPresence[r.id])
            const pct = Math.min(100, Math.round((r.won / r.quota) * 100))
            return (
              <li key={r.id} className="flex items-center gap-3 rounded-2xl p-1.5 transition-colors hover:bg-accent/60">
                <Initials name={r.name} ring={p.tone} className="size-10 text-xs" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{r.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{r.role}, {pct}% of quota</p>
                </div>
                <Pill tone={p.tone}>{p.label}</Pill>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="glass rise rounded-[1.75rem] p-5 xl:col-span-12" style={{ '--i': 7 } as React.CSSProperties}>
        <div className="flex items-baseline justify-between">
          <h2 className="font-semibold">Recent activity</h2>
          <Link to="/contacts" className="text-sm font-semibold text-primary hover:underline">All contacts</Link>
        </div>
        <ul className="mt-3 grid grid-cols-1 gap-x-8 md:grid-cols-2">
          {activities.map(a => {
            const Icon = activityIcon[a.type]
            const c = contacts.find(x => x.id === a.contactId)!
            return (
              <li key={a.id} className="flex items-center gap-4 border-b py-3 last:border-0 md:[&:nth-last-child(2)]:border-0">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-primary"><Icon aria-hidden className="size-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{a.summary}</p>
                  <p className="text-xs text-muted-foreground">
                    <Link to={`/contacts?open=${c.id}`} className="font-semibold text-foreground hover:underline">{c.name}</Link>, {c.company}
                  </p>
                </div>
                <time className="shrink-0 text-xs text-muted-foreground">{relativeMinutes(a.minutesAgo)}</time>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
