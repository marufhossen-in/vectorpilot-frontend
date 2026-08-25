import { useMemo, useState } from 'react';
import {
  Check,
  Crown,
  Download,
  Lock,
  RefreshCw,
  Sparkles,
  TrendingDown,
  Wand2,
  Zap,
} from 'lucide-react';

import { modelColorVar } from '@/components/charts';
import { cn, timeAgo, usd } from '@/lib/utils';
import { mockPlans } from '@/data/mock';
import { useAuth, useUI, useUsage } from '@/store/AppStores';
import { AnimatedNumber } from '@/hooks';
import { Badge, Button, Modal } from '@/components/ui';
import type { ModelId, ModelSlice, PlanId, UsagePoint } from '@/types';

const fmt4 = (n: number): string => usd(n, 4);
const r2 = (n: number): number => Math.round(n * 100) / 100;

// ------------------------------------------------------------
// Plan helpers
// ------------------------------------------------------------
export function usePlan() {
  const { state, upgrade } = useAuth();
  const plan: PlanId = state.user?.plan ?? 'starter';
  return { plan, isPro: plan === 'pro' || plan === 'team', isFree: plan === 'starter', upgrade };
}

export function PlanBadge({ plan }: { plan: PlanId }) {
  if (plan === 'team') return <Badge tone="gold"><Crown className="h-3 w-3" /> Team</Badge>;
  if (plan === 'pro') return <Badge tone="indigo"><Zap className="h-3 w-3" /> Pro</Badge>;
  return <Badge tone="muted">Free</Badge>;
}

export function exportUsageCsv(points: UsagePoint[]): void {
  const header = 'id,timestamp,model,tokens,cost_usd\n';
  const rows = points.map((p) => `${p.id},${p.at},${p.model},${p.tokens},${p.costUsd}`).join('\n');
  const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'vectorpilot-usage.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// ------------------------------------------------------------
// Upgrade modal (switches plan live)
// ------------------------------------------------------------
export function UpgradeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { upgrade } = usePlan();
  const { toast } = useUI();

  function pick(plan: PlanId) {
    upgrade(plan);
    toast({
      type: 'success',
      title: `Welcome to VectorPilot ${plan === 'team' ? 'Team' : 'Pro'}`,
      description: 'Live tracking and the AI optimizer are now active.',
    });
    onClose();
  }

  const plans = mockPlans.filter((p) => p.id === 'pro' || p.id === 'team');

  return (
    <Modal open={open} title="Upgrade your plan" onClose={onClose} size="lg">
      <p className="text-sm text-[var(--vp-text-muted)]">
        Switch anytime. Your dashboard updates instantly — no sign-out required.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {plans.map((p) => (
          <button
            key={p.id}
            onClick={() => pick(p.id)}
            className="rounded-2xl border border-[var(--vp-border)] bg-[var(--vp-surface)] p-5 text-left transition-all hover:-translate-y-0.5 hover:border-[var(--vp-border-active)] hover:shadow-lg"
          >
            <div className="flex items-center justify-between">
              <p className="text-lg font-bold">{p.name}</p>
              {p.highlight && <Badge tone="indigo">popular</Badge>}
            </div>
            <p className="mt-1 font-mono text-2xl font-bold">
              ${p.annualUsd}
              <span className="text-sm font-normal text-[var(--vp-text-muted)]">/mo</span>
            </p>
            <ul className="mt-3 space-y-1.5">
              {p.features.slice(0, 5).map((f) => (
                <li key={f} className="flex items-start gap-2 text-[13px] text-[var(--vp-text-secondary)]">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" /> {f}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>
    </Modal>
  );
}

// ============================================================
// SYSTEM 1 (FREE) — Cost Snapshot: manual, capped, rate-limited
// ============================================================
const QUOTA_KEY = 'aico.snapshot.quota';
const QUOTA_PER_DAY = 3;

function readQuota(): number {
  try {
    const raw = localStorage.getItem(QUOTA_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw) as { date: string; count: number };
    return parsed.date === new Date().toISOString().slice(0, 10) ? parsed.count : 0;
  } catch {
    return 0;
  }
}
function writeQuota(count: number): void {
  try {
    localStorage.setItem(QUOTA_KEY, JSON.stringify({ date: new Date().toISOString().slice(0, 10), count }));
  } catch {
    /* ignore */
  }
}

export function CostSnapshot({ onUpgrade }: { onUpgrade: () => void }) {
  const { totals } = useUsage();
  const [count, setCount] = useState<number>(readQuota);
  const [checking, setChecking] = useState(false);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const remaining = Math.max(0, QUOTA_PER_DAY - count);

  function check() {
    if (remaining <= 0 || checking) return;
    setChecking(true);
    window.setTimeout(() => {
      setChecking(false);
      setCheckedAt(new Date().toISOString());
      const next = count + 1;
      setCount(next);
      writeQuota(next);
    }, 650);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--vp-border)] bg-[var(--vp-surface)] p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--vp-surface-alt)] text-[var(--vp-text-muted)]">
            <Lock className="h-4 w-4" />
          </span>
          <span className="text-[12px] font-bold uppercase tracking-wide text-[var(--vp-text-muted)]">Cost snapshot · free</span>
        </div>
        <Badge tone="muted">{remaining}/{QUOTA_PER_DAY} checks left</Badge>
      </div>

      <p className="mt-4 font-mono text-4xl font-extrabold tracking-tight">
        <AnimatedNumber value={totals.todayUsd} format={fmt4} />
      </p>
      <p className="mt-1 text-[12px] text-[var(--vp-text-muted)]">
        Today’s spend · {checkedAt ? `checked ${timeAgo(checkedAt)}` : 'not checked yet'}
      </p>

      <div className="mt-4">
        <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--vp-surface-alt)]">
          <div
            className="h-full rounded-full bg-[var(--vp-text-muted)] transition-[width] duration-500"
            style={{ width: `${(count / QUOTA_PER_DAY) * 100}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[12px] text-[var(--vp-text-muted)]">
          <span>Manual checks reset daily</span>
          <span>{count}/{QUOTA_PER_DAY} used today</span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button onClick={check} loading={checking} disabled={remaining <= 0} variant="outline">
          <RefreshCw className="h-4 w-4" /> Refresh snapshot
        </Button>
        <Button variant="ai" onClick={onUpgrade}>
          <Zap className="h-4 w-4" /> Go live with Pro
        </Button>
      </div>
      {remaining <= 0 && (
        <p className="mt-3 rounded-lg bg-[var(--vp-selected-bg)] px-3 py-2 text-[12px] font-medium text-[var(--vp-primary)]">
          Daily snapshot limit reached. <span className="hl">Pro streams every cent in real time</span> — no caps.
        </p>
      )}
    </div>
  );
}

export function FreeBanner({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-indigo-500/30 bg-[var(--vp-selected-bg)] p-4 sm:flex-row sm:items-center">
      <div>
        <p className="font-semibold">
          You’re on the <span className="hl-strong">Free plan</span>.
        </p>
        <p className="text-[13px] text-[var(--vp-text-muted)]">
          Upgrade to unlock live tracking, the AI Spend Optimizer, 30-day history, and CSV export.
        </p>
      </div>
      <Button variant="ai" onClick={onUpgrade} className="shrink-0">
        <Sparkles className="h-4 w-4" /> Upgrade to Pro
      </Button>
    </div>
  );
}

// ============================================================
// SYSTEM 2 (PRO) — AI Spend Optimizer: live, computed, exportable
// ============================================================
interface Recommendation {
  id: string;
  title: string;
  detail: string;
  saving: number;
  model?: ModelId;
}

function buildRecommendations(slices: ModelSlice[], monthUsd: number): Recommendation[] {
  const recs: Recommendation[] = [];
  const top = slices[0];
  recs.push({
    id: 'cache',
    title: 'Enable prompt caching',
    detail: 'Cache repeated system prompts and context windows to cut latency and cost on loops.',
    saving: r2(monthUsd * 0.09),
  });
  recs.push({
    id: 'batch',
    title: 'Batch small requests',
    detail: 'Combine micro-calls into one batched request to remove per-call overhead.',
    saving: r2(monthUsd * 0.06),
  });
  if (top) {
    recs.push({
      id: 'route',
      title: `Down-tier ${top.label} on simple tasks`,
      detail: `${top.label} is ${top.pct}% of spend. Keep it for hard work; route easy tasks to a cheaper model.`,
      saving: r2(monthUsd * (top.pct / 100) * 0.35),
      model: top.model,
    });
  }
  const gemini = slices.find((s) => s.model === 'gemini-1.5');
  if (gemini && gemini.pct < 15) {
    recs.push({
      id: 'shift',
      title: 'Shift summarization to Gemini 1.5',
      detail: 'Summaries run at parity on Gemini for ~30% less. Routing them there saves monthly cost.',
      saving: r2(monthUsd * 0.05),
      model: 'gemini-1.5',
    });
  }
  return recs;
}

export function SpendOptimizer({
  slices,
  monthUsd,
  onExport,
}: {
  slices: ModelSlice[];
  monthUsd: number;
  onExport: () => void;
}) {
  const recs = useMemo(() => buildRecommendations(slices, monthUsd), [slices, monthUsd]);
  const [applied, setApplied] = useState<Record<string, boolean>>({});
  const totalSaving = recs.filter((r) => applied[r.id]).reduce((a, r) => a + r.saving, 0);
  const projected = Math.max(0, monthUsd - totalSaving);

  return (
    <div className="rounded-2xl border border-[var(--vp-border)] bg-gradient-to-br from-[var(--vp-surface)] to-[var(--vp-surface-alt)] p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
            <Wand2 className="h-4 w-4" />
          </span>
          <div>
            <p className="font-bold leading-tight">AI Spend Optimizer</p>
            <p className="text-[11px] text-[var(--vp-text-muted)]">Pro · live recommendations</p>
          </div>
        </div>
        <Badge tone="green">live</Badge>
      </div>

      <p className="mt-4 text-[13px] text-[var(--vp-text-secondary)]">
        Computed from <span className="hl">your real usage mix</span> — apply to model projected savings.
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-[var(--vp-surface)] p-3.5">
          <p className="text-[11px] uppercase tracking-wide text-[var(--vp-text-muted)]">Projected bill</p>
          <p className="mt-1 font-mono text-xl font-bold text-emerald-500">{usd(projected)}/mo</p>
        </div>
        <div className="rounded-xl bg-[var(--vp-surface)] p-3.5">
          <p className="text-[11px] uppercase tracking-wide text-[var(--vp-text-muted)]">You save</p>
          <p className="mt-1 flex items-center gap-1 font-mono text-xl font-bold">
            <TrendingDown className="h-4 w-4 text-emerald-500" /> {usd(totalSaving)}/mo
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        {recs.map((r) => {
          const on = !!applied[r.id];
          return (
            <div key={r.id} className="flex items-start gap-3 rounded-xl border border-[var(--vp-border)] bg-[var(--vp-surface)] p-3.5">
              {r.model ? (
                <span className="mt-0.5 h-3 w-3 shrink-0 rounded-full" style={{ background: modelColorVar(r.model) }} />
              ) : (
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[var(--vp-primary)]" />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{r.title}</p>
                  <span className="font-mono text-[12px] font-bold text-emerald-500">−{usd(r.saving)}/mo</span>
                </div>
                <p className="mt-0.5 text-[12px] text-[var(--vp-text-muted)]">{r.detail}</p>
              </div>
              <button
                onClick={() => setApplied((a) => ({ ...a, [r.id]: !a[r.id] }))}
                className={cn(
                  'shrink-0 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition-colors',
                  on ? 'bg-emerald-500/15 text-emerald-500' : 'border border-[var(--vp-border-strong)] text-[var(--vp-text-secondary)] hover:bg-[var(--vp-surface-alt)]',
                )}
              >
                {on ? '✓ Applied' : 'Apply'}
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-[var(--vp-border)] pt-4">
        <p className="text-[12px] text-[var(--vp-text-muted)]">Export the full dataset for your finance team.</p>
        <Button variant="outline" size="sm" onClick={onExport}>
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
// Locked panel (free, right column)
// ------------------------------------------------------------
export function LockedOptimizer({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--vp-border)] bg-[var(--vp-surface)] p-6">
      <div className="pointer-events-none absolute inset-0 flex flex-col gap-2.5 p-6 opacity-40 blur-[2px]">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-14 rounded-xl bg-[var(--vp-surface-alt)]" />
        ))}
      </div>
      <div className="relative flex h-full flex-col items-center justify-center py-6 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--vp-selected-bg)] text-[var(--vp-primary)]">
          <Lock className="h-5 w-5" />
        </span>
        <p className="mt-3 font-bold">Unlock the AI Spend Optimizer</p>
        <p className="mt-1 max-w-[15rem] text-[13px] text-[var(--vp-text-muted)]">
          Pro analyzes your model mix and finds real savings — <span className="hl-strong">automatically</span>.
        </p>
        <Button variant="ai" className="mt-4" onClick={onUpgrade}>
          <Zap className="h-4 w-4" /> Upgrade to Pro
        </Button>
      </div>
    </div>
  );
}
