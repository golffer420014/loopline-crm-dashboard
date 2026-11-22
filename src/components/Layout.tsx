import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react'
import { Link, NavLink, Outlet, ScrollRestoration, useLocation, useNavigate } from 'react-router'
import { Bell, ChevronDown, ChevronRight, Columns3, LayoutDashboard, RotateCcw, Search, Users } from 'lucide-react'
import { toast } from 'sonner'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Toaster } from '@/components/ui/sonner'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Initials } from '@/components/bits'
import { activities, contacts, me } from '@/data/crm'
import { relativeMinutes } from '@/lib/crm'
import { useCrm } from '@/store/crm'

const atRisk = contacts.filter(c => c.status === 'at-risk').length
const nav = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, badge: 0 },
  { to: '/contacts', label: 'Contacts', icon: Users, badge: atRisk },
  { to: '/pipeline', label: 'Pipeline', icon: Columns3, badge: 0 },
]
const titles: Record<string, string> = { '/': 'Dashboard', '/contacts': 'Contacts', '/pipeline': 'Pipeline' }

/** Brand mark: two linked loops in a gradient tile. */
function Mark({ className = 'size-9' }: { className?: string }) {
  return (
    <span className={`grid place-items-center rounded-xl bg-gradient-to-br from-brand-from to-brand-to text-primary-foreground shadow-[0_6px_16px_-6px_var(--brand-shadow)] ${className}`}>
      <svg viewBox="0 0 24 24" aria-hidden className="size-[55%]" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
        <path d="M9 8.5a3.5 3.5 0 1 0 0 7c2 0 3-1.6 3-3.5S13 8.5 15 8.5a3.5 3.5 0 1 1 0 7" />
      </svg>
    </span>
  )
}

function Clock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 30_000); return () => clearInterval(t) }, [])
  return (
    <span className="hidden items-center gap-2 text-sm text-muted-foreground lg:flex">
      <span aria-hidden className="relative flex size-2">
        <span className="absolute inline-flex size-full rounded-full bg-ok opacity-60 motion-safe:animate-ping" />
        <span className="relative inline-flex size-2 rounded-full bg-ok" />
      </span>
      <time dateTime={now.toISOString()}>
        {now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        <span className="ml-3 font-semibold tabular-nums text-foreground">{now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
      </time>
    </span>
  )
}

function SearchBox() {
  const go = useNavigate()
  const ref = useRef<HTMLInputElement>(null)
  const [q, setQ] = useState('')
  // ⌘K / Ctrl+K focuses search from anywhere
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); ref.current?.focus() } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  const submit = (e: FormEvent) => { e.preventDefault(); go(`/contacts${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`); setQ('') }
  return (
    <form role="search" onSubmit={submit} className="pill relative flex h-11 w-full items-center rounded-full sm:w-80">
      <Search aria-hidden className="pointer-events-none absolute left-4 size-4 text-muted-foreground" />
      <input
        id="global-search"
        ref={ref}
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Search contacts, companies, deals…"
        aria-label="Search contacts"
        className="size-full rounded-full bg-transparent pl-11 pr-14 text-sm outline-none placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      />
      <kbd className="pointer-events-none absolute right-2 hidden rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground sm:block">⌘K</kbd>
    </form>
  )
}

export function Layout() {
  const { pathname } = useLocation()
  const reset = useCrm(s => s.reset)
  const recent = activities.slice(0, 4)
  // the glide indicator follows the active nav item, measured so it works for the vertical rail and the phone bar
  const navRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: 0, y: 0, ready: false })
  useLayoutEffect(() => {
    const place = () => {
      const el = navRef.current?.querySelector<HTMLElement>('[aria-current="page"]')
      if (el) setPos({ x: el.offsetLeft, y: el.offsetTop, ready: true })
      else setPos(p => ({ ...p, ready: false }))
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [pathname])
  const resetDemo = () => { reset(); toast.success('Demo data reset', { description: 'Every deal is back in its starting stage.' }) }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-dvh md:p-4">
        {/* the frame fills the window and keeps the rail at its edge; only the work area below is capped */}
        <div className="frame relative min-h-dvh pb-28 md:flex md:min-h-[calc(100dvh-2rem)] md:gap-6 md:rounded-[2rem] md:p-4 md:pb-4">
          {/* navy rail: inside the frame on desktop, a floating bottom bar on phones */}
          <nav
            aria-label="Main"
            className="ink-panel rail fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-full p-2 text-on-ink-muted md:sticky md:top-4 md:h-[calc(100dvh-4rem)] md:w-[4.25rem] md:shrink-0 md:flex-col md:justify-start md:gap-3 md:py-5"
          >
            <Link to="/" aria-label="Loopline home" className="rail-item mb-2 hidden transition-opacity hover:opacity-85 md:block" style={{ '--i': 0 } as React.CSSProperties}><Mark className="size-11" /></Link>
            <div ref={navRef} className="relative flex flex-1 items-center justify-around md:flex-none md:flex-col md:gap-3">
              {/* the white disc that glides to the active item */}
              <span
                aria-hidden
                className="absolute left-0 top-0 size-11 rounded-full bg-on-ink shadow-[0_0_0_6px_var(--disc-ring),0_8px_20px_-6px_var(--disc-glow)] transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.34,1.4,0.5,1)]"
                style={{ transform: `translate(${pos.x}px, ${pos.y}px)`, opacity: pos.ready ? 1 : 0 }}
              />
              {nav.map(({ to, label, icon: Icon, badge }, i) => (
                <Tooltip key={to}>
                  <TooltipTrigger asChild>
                    <NavLink
                      to={to}
                      end={to === '/'}
                      aria-label={badge ? `${label}, ${badge} need attention` : label}
                      style={{ '--i': i + 1 } as React.CSSProperties}
                      // static string: TooltipTrigger's Slot merges className as text, so NavLink's function form breaks here
                      className="rail-item group relative grid size-11 place-items-center rounded-full transition-colors duration-300 hover:text-on-ink aria-[current=page]:text-ink"
                    >
                      <span aria-hidden className="absolute inset-0 rounded-full bg-white/10 opacity-0 transition-opacity group-hover:opacity-100 group-aria-[current=page]:hidden" />
                      <Icon className="relative size-5" />
                      {badge > 0 && <span aria-hidden className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-bad text-[10px] font-bold text-white ring-2 ring-ink motion-safe:animate-[pop_2.4s_ease-in-out_infinite]">{badge}</span>}
                    </NavLink>
                  </TooltipTrigger>
                  <TooltipContent side="right">{label}</TooltipContent>
                </Tooltip>
              ))}
            </div>
            <div className="hidden md:mt-auto md:flex md:flex-col md:gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" aria-label="Search" onClick={() => document.getElementById('global-search')?.focus()} style={{ '--i': 5 } as React.CSSProperties} className="rail-item group grid size-11 place-items-center rounded-full transition-colors hover:bg-white/10 hover:text-on-ink">
                    <Search className="size-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Search (⌘K)</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" aria-label="Reset demo data" onClick={resetDemo} style={{ '--i': 6 } as React.CSSProperties} className="rail-item group grid size-11 place-items-center rounded-full transition-colors hover:bg-white/10 hover:text-on-ink">
                    <RotateCcw className="size-5 transition-transform duration-500 group-hover:-rotate-180" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right">Reset demo data</TooltipContent>
              </Tooltip>
            </div>
          </nav>

          <div className="mx-auto w-full min-w-0 max-w-[130rem] flex-1">
            <header className="flex flex-wrap items-center gap-3 px-4 pt-4 md:px-2 md:pt-1">
              <div className="pill flex h-11 items-center gap-2 rounded-full pl-1.5 pr-4 text-sm">
                <Mark className="size-8 md:hidden" />
                <span className="pl-2 font-bold tracking-tight md:pl-2.5">Loop<span className="text-primary">line</span></span>
                <ChevronRight aria-hidden className="size-3.5 text-muted-foreground" />
                <span className="font-medium text-muted-foreground">{titles[pathname] ?? 'Dashboard'}</span>
              </div>
              <Clock />
              <div className="ml-auto flex w-full items-center gap-2 sm:w-auto">
                <SearchBox />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button type="button" className="pill relative grid size-11 shrink-0 place-items-center rounded-full" aria-label={`Recent activity, ${recent.length} new`}>
                      <Bell className="size-[18px]" />
                      <span className="absolute right-2 top-2 grid size-4 place-items-center rounded-full bg-bad text-[10px] font-bold text-white ring-2 ring-card">{recent.length}</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 rounded-2xl p-2">
                    <DropdownMenuLabel>Recent activity</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {recent.map(a => (
                      <DropdownMenuItem key={a.id} asChild className="rounded-xl">
                        <Link to={`/contacts?open=${a.contactId}`} className="flex flex-col items-start gap-0.5">
                          <span className="text-sm">{a.summary}</span>
                          <span className="text-xs text-muted-foreground">{contacts.find(c => c.id === a.contactId)?.name}, {relativeMinutes(a.minutesAgo)}</span>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button type="button" className="pill flex h-11 shrink-0 items-center gap-2.5 rounded-full p-1 lg:pr-3" aria-label={`Account menu for ${me.name}`}>
                      <Initials name={me.name} className="size-9 text-xs" />
                      <span className="hidden text-left leading-tight lg:block">
                        <span className="block text-sm font-semibold">{me.name.split(' ')[0]}</span>
                        <span className="block text-[11px] text-muted-foreground">{me.role}</span>
                      </span>
                      <ChevronDown aria-hidden className="hidden size-4 text-muted-foreground lg:block" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2">
                    <DropdownMenuLabel>{me.name}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="rounded-xl" onSelect={resetDemo}><RotateCcw /> Reset demo data</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </header>

            {/* keyed by route so each page's entrance plays again on navigation */}
            <main key={pathname} className="px-4 py-6 md:px-2 md:py-7">
              <Outlet />
            </main>
            <footer className="px-4 pb-4 text-xs text-muted-foreground md:px-2">
              Loopline is a portfolio demo. Every person, company and figure on this site is made up.
            </footer>
          </div>
        </div>
        <ScrollRestoration />
        <Toaster position="bottom-right" />
      </div>
    </TooltipProvider>
  )
}
