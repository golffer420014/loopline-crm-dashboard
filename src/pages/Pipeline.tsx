import { useState } from 'react'
import { CalendarClock, GripVertical, MoreHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Initials, PageTitle } from '@/components/bits'
import { contacts, reps, stages, type Deal, type Stage } from '@/data/crm'
import { money, moneyShort, pipelineSummary, stageOf } from '@/lib/crm'
import { useCrm } from '@/store/crm'

const stageTone: Record<Stage, string> = {
  lead: 'bg-chart-2', qualified: 'bg-chart-1', proposal: 'bg-chart-5', negotiation: 'bg-chart-4', won: 'bg-ok', lost: 'bg-bad',
}

function closeLabel(d: Deal) {
  if (d.stage === 'won' || d.stage === 'lost') return d.closeInDays === 0 ? 'Closed today' : `Closed ${-d.closeInDays}d ago`
  return d.closeInDays <= 0 ? 'Overdue' : `Closes in ${d.closeInDays}d`
}

export default function Pipeline() {
  const deals = useCrm(s => s.deals)
  const move = useCrm(s => s.move)
  const [owner, setOwner] = useState('all')
  const [dragId, setDragId] = useState<string | null>(null)
  const [over, setOver] = useState<Stage | null>(null)

  const visible = owner === 'all' ? deals : deals.filter(d => d.ownerId === owner)
  const sum = pipelineSummary(visible)

  const moveWithUndo = (d: Deal, to: Stage) => {
    if (d.stage === to) return
    const from = d.stage
    move(d.id, to)
    toast(`${d.title} moved to ${stageOf(to).label}`, { action: { label: 'Undo', onClick: () => move(d.id, from) } })
  }

  return (
    <div className="space-y-6">
      <div className="rise flex flex-wrap items-end justify-between gap-4">
        <PageTitle lead="Sales" accent="pipeline" sub="Drag a deal to another stage, or use its menu. Changes are saved in this browser." />
        <Select value={owner} onValueChange={setOwner}>
          <SelectTrigger className="pill h-11 w-52 rounded-full border-0" aria-label="Deal owner"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Everyone’s deals</SelectItem>
            {reps.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          ['Open pipeline', money(sum.openValue)],
          ['Weighted forecast', money(sum.weighted)],
          ['Won', money(sum.wonValue)],
          ['Win rate', `${Math.round(sum.winRate * 100)}%`],
        ].map(([k, v]) => (
          <div key={k} className="glass rise rounded-[1.5rem] px-5 py-4">
            <dt className="text-sm text-muted-foreground">{k}</dt>
            <dd className="mt-1 text-2xl font-semibold tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="-mx-4 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
        <ol className="grid min-w-[1180px] grid-cols-6 gap-3">
          {stages.map(s => {
            const col = visible.filter(d => d.stage === s.id)
            const total = col.reduce((t, d) => t + d.value, 0)
            return (
              <li
                key={s.id}
                aria-label={`${s.label}, ${col.length} ${col.length === 1 ? 'deal' : 'deals'}`}
                onDragOver={e => { if (dragId) { e.preventDefault(); setOver(s.id) } }}
                onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(null) }}
                onDrop={e => {
                  e.preventDefault()
                  const d = deals.find(x => x.id === e.dataTransfer.getData('text/plain'))
                  if (d) moveWithUndo(d, s.id)
                  setDragId(null); setOver(null)
                }}
                className={`rise flex min-h-[440px] flex-col rounded-[1.5rem] p-2 ring-1 transition-colors ${over === s.id ? 'bg-accent ring-2 ring-primary/40' : 'bg-white/45 ring-white/80'}`}
              >
                <div className="px-2 py-2">
                  <div className="flex items-center gap-2">
                    <span aria-hidden className={`size-2 shrink-0 rounded-full ${stageTone[s.id]}`} />
                    <h2 className="text-sm font-semibold">{s.label}</h2>
                    <span className="pill ml-auto rounded-full px-2 text-xs font-semibold tabular-nums text-muted-foreground">{col.length}</span>
                  </div>
                  <p className="mt-0.5 pl-4 text-xs font-medium tabular-nums text-muted-foreground">{moneyShort(total)}</p>
                </div>
                <ul className="flex flex-1 flex-col gap-2">
                  {col.map(d => {
                    const c = contacts.find(x => x.id === d.contactId)!
                    const r = reps.find(x => x.id === d.ownerId)!
                    return (
                      <li
                        key={d.id}
                        draggable
                        onDragStart={e => { e.dataTransfer.setData('text/plain', d.id); e.dataTransfer.effectAllowed = 'move'; setDragId(d.id) }}
                        onDragEnd={() => { setDragId(null); setOver(null) }}
                        className={`glass lift group cursor-grab rounded-2xl p-3.5 active:cursor-grabbing ${dragId === d.id ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-start gap-1">
                          <GripVertical aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground/60" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold leading-snug">{d.title}</p>
                            <p className="truncate text-xs text-muted-foreground">{c.company}</p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon-xs" aria-label={`Move ${d.title}`} data-deal-menu={d.id}><MoreHorizontal /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              // the card re-mounts in its new column, so focus its new menu button instead of the old one
                              onCloseAutoFocus={e => { e.preventDefault(); requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-deal-menu="${d.id}"]`)?.focus()) }}
                            >
                              <DropdownMenuLabel>Move to</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {stages.filter(t => t.id !== d.stage).map(t => (
                                <DropdownMenuItem key={t.id} onSelect={() => moveWithUndo(d, t.id)}>
                                  <span aria-hidden className={`size-2 rounded-full ${stageTone[t.id]}`} /> {t.label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        <p className="mt-3 text-lg font-semibold tabular-nums">{money(d.value)}</p>
                        <div className="mt-2 flex items-center justify-between gap-2">
                          <span className={`inline-flex items-center gap-1 text-xs ${d.closeInDays <= 7 && d.closeInDays > 0 ? 'font-medium text-warn-text' : 'text-muted-foreground'}`}>
                            <CalendarClock aria-hidden className="size-3.5" /> {closeLabel(d)}
                          </span>
                          <span title={r.name}><Initials name={r.name} className="size-6 text-[10px]" /><span className="sr-only">Owner {r.name}</span></span>
                        </div>
                      </li>
                    )
                  })}
                  {!col.length && <li className="grid flex-1 place-items-center rounded-2xl border-2 border-dashed border-white/90 p-4 text-center text-xs text-muted-foreground">Drop a deal here</li>}
                </ul>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
