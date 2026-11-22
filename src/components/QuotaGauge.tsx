import { moneyShort } from '@/lib/crm'

const TICKS = 52
const START = -225 // degrees, measured clockwise from 3 o'clock
const SWEEP = 270

/** A 270° gauge drawn as radial ticks; the filled share fades from deep to light indigo. */
export function QuotaGauge({ value, target }: { value: number; target: number }) {
  const pct = Math.min(1, value / target)
  const filled = Math.round(pct * TICKS)
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[15rem]" role="meter" aria-valuemin={0} aria-valuemax={target} aria-valuenow={value} aria-label={`Team quota: ${moneyShort(value)} of ${moneyShort(target)}`}>
      <svg viewBox="0 0 200 200" className="size-full" aria-hidden>
        {Array.from({ length: TICKS }, (_, i) => {
          const a = ((START + (SWEEP * i) / (TICKS - 1)) * Math.PI) / 180
          const r1 = 70, r2 = i < filled ? 96 : 90
          const on = i < filled
          // deeper at the start of the arc, lighter towards the tip
          const l = 50 + (i / Math.max(1, filled)) * 26
          return (
            <line
              key={i}
              x1={100 + r1 * Math.cos(a)} y1={100 + r1 * Math.sin(a)}
              x2={100 + r2 * Math.cos(a)} y2={100 + r2 * Math.sin(a)}
              stroke={on ? `oklch(${l}% 0.19 275)` : 'oklch(90% 0.02 285)'}
              strokeWidth="5" strokeLinecap="round"
              className="motion-safe:animate-[rise_0.5s_ease-out_both]"
              style={{ animationDelay: `${i * 12}ms` }}
            />
          )
        })}
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center">
        <p className="text-[2.6rem] font-semibold leading-none tracking-tight tabular-nums">{moneyShort(value)}</p>
        <p className="mt-1.5 text-xs text-muted-foreground">of {moneyShort(target)} quota</p>
        <p className="mx-auto mt-2 w-fit rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-primary">{Math.round(pct * 100)}%</p>
      </div>
    </div>
  )
}
