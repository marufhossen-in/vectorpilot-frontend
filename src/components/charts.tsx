import { useMemo, useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';

import type { ModelId, ModelSlice, UsagePoint } from '@/types';
import { modelLabel } from '@/data/mock';
import { usd } from '@/lib/utils';

export function modelColorVar(model: ModelId): string {
  switch (model) {
    case 'gpt-4o':
      return 'var(--model-gpt-4o)';
    case 'claude-sonnet':
      return 'var(--model-claude)';
    case 'gemini-1.5':
      return 'var(--model-gemini)';
    case 'custom':
      return 'var(--model-custom)';
  }
}

/** Aggregate points into model share slices. */
export function deriveModelSlices(points: UsagePoint[]): ModelSlice[] {
  const totals = new Map<ModelId, number>();
  for (const p of points) totals.set(p.model, (totals.get(p.model) ?? 0) + p.costUsd);
  const grand = [...totals.values()].reduce((a, b) => a + b, 0) || 1;
  return [...totals.entries()]
    .map(([model, usdAmt]) => ({
      model,
      label: modelLabel(model),
      pct: Math.round((usdAmt / grand) * 1000) / 10,
      usd: Math.round(usdAmt * 10000) / 10000,
    }))
    .sort((a, b) => b.usd - a.usd);
}

interface DayBucket {
  key: string;
  label: string;
  total: number;
  dominant: ModelId;
}

function bucketByDay(points: UsagePoint[], days: number): DayBucket[] {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const buckets: DayBucket[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(startOfToday - i * 86400000);
    buckets.push({
      key: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      total: 0,
      dominant: 'gpt-4o',
    });
  }
  const index = new Map(buckets.map((b, i) => [b.key, i]));
  const modelTotals = new Map<string, Map<ModelId, number>>();
  for (const p of points) {
    const key = p.at.slice(0, 10);
    const i = index.get(key);
    if (i === undefined) continue;
    buckets[i].total += p.costUsd;
    if (!modelTotals.has(key)) modelTotals.set(key, new Map());
    const mt = modelTotals.get(key)!;
    mt.set(p.model, (mt.get(p.model) ?? 0) + p.costUsd);
  }
  for (const b of buckets) {
    const mt = modelTotals.get(b.key);
    if (mt) {
      let best: ModelId = 'gpt-4o';
      let bestV = -1;
      mt.forEach((v, k) => {
        if (v > bestV) {
          bestV = v;
          best = k;
        }
      });
      b.dominant = best;
    }
  }
  return buckets;
}

// ---------------- BarChart ----------------
export function BarChart({ points, range }: { points: UsagePoint[]; range: '7d' | '30d' }) {
  const scope = useRef<HTMLDivElement>(null);
  const days = range === '7d' ? 7 : 30;
  const buckets = useMemo(() => bucketByDay(points, days), [points, days]);
  const max = Math.max(0.01, ...buckets.map((b) => b.total));
  const showLabels = days <= 14;

  useGSAP(
    () => {
      const bars = scope.current?.querySelectorAll('[data-bar]');
      if (!bars) return;
      gsap.fromTo(
        bars,
        { scaleY: 0 },
        { scaleY: 1, duration: 0.8, ease: 'power3.out', stagger: days <= 7 ? 0.05 : 0.012, transformOrigin: 'bottom' },
      );
    },
    { scope, dependencies: [range, buckets.length] },
  );

  return (
    <div ref={scope} className="w-full">
      <div className="flex h-52 items-end gap-[3px] sm:gap-1.5">
        {buckets.map((b, i) => {
          const h = Math.max(2, (b.total / max) * 100);
          const isLast = i === buckets.length - 1;
          return (
            <div key={b.key} className="group relative flex flex-1 flex-col items-center justify-end">
              <div className="pointer-events-none absolute -top-9 z-10 hidden whitespace-nowrap rounded-md border border-[var(--vp-border)] bg-[var(--vp-elevated)] px-2 py-1 text-[11px] font-semibold shadow-md group-hover:block">
                {usd(b.total)}
              </div>
              <div
                data-bar
                className="w-full rounded-t-[3px] transition-opacity"
                style={{
                  height: `${h}%`,
                  background: isLast ? 'var(--vp-primary)' : modelColorVar(b.dominant),
                  opacity: isLast ? 1 : 0.82,
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-[var(--vp-text-muted)]">
        {showLabels ? (
          buckets.map((b) => (
            <span key={b.key} className="flex-1 text-center">
              {b.label.slice(0, b.label.length > 6 ? 6 : undefined)}
            </span>
          ))
        ) : (
          <>
            <span>{buckets[0]?.label}</span>
            <span>{buckets[Math.floor(buckets.length / 2)]?.label}</span>
            <span>{buckets.at(-1)?.label}</span>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------- Donut ----------------
export function Donut({ slices }: { slices: ModelSlice[] }) {
  const scope = useRef<SVGSVGElement>(null);
  const r = 70;
  const C = 2 * Math.PI * r;
  const totalUsd = slices.reduce((a, s) => a + s.usd, 0);

  useGSAP(
    () => {
      const arcs = scope.current?.querySelectorAll('[data-arc]');
      if (!arcs) return;
      arcs.forEach((arc) => gsap.set(arc, { strokeDasharray: `0 ${C}` }));
      gsap.to(arcs, {
        strokeDasharray: (i) => {
          const len = (slices[i].pct / 100) * C;
          return `${Math.max(len, 0.001)} ${C}`;
        },
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.08,
      });
    },
    { scope, dependencies: [slices.map((s) => s.pct).join(',')] },
  );

  let cumulative = 0;
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:gap-8">
      <div className="relative">
        <svg ref={scope} width="180" height="180" viewBox="0 0 180 180" className="-rotate-90">
          <circle cx="90" cy="90" r={r} fill="none" stroke="var(--vp-surface-alt)" strokeWidth="18" />
          {slices.map((s) => {
            const offset = -(cumulative / 100) * C;
            cumulative += s.pct;
            return (
              <circle
                key={s.model}
                data-arc
                cx="90"
                cy="90"
                r={r}
                fill="none"
                stroke={modelColorVar(s.model)}
                strokeWidth="18"
                strokeLinecap="round"
                strokeDashoffset={offset}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[11px] uppercase tracking-wide text-[var(--vp-text-muted)]">Total</span>
          <span className="font-mono text-lg font-bold">{usd(totalUsd)}</span>
        </div>
      </div>
      <ul className="w-full max-w-[220px] space-y-2.5">
        {slices.map((s) => (
          <li key={s.model} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: modelColorVar(s.model) }} />
              <span className="font-medium">{s.label}</span>
            </span>
            <span className="font-mono text-[var(--vp-text-secondary)]">{s.pct}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
