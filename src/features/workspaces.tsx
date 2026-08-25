import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity as ActivityIcon,
  Bot,
  Clock,
  Cpu,
  Gauge,
  GitBranch,
  Lock,
  Plug,
  Plus,
  Send,
  Server,
  Trash2,
  Webhook,
  Zap,
} from 'lucide-react';

import { BarChart, deriveModelSlices, modelColorVar } from '@/components/charts';
import { cn, formatTokens, genId, timeAgo, usd } from '@/lib/utils';
import { modelLabel, mockSessions } from '@/data/mock';
import { useUI, useUsage } from '@/store/AppStores';
import { exportUsageCsv, usePlan } from '@/features/plans';
import { Badge, Button, EmptyState, Field, inputClass, Toggle } from '@/components/ui';
import { PageHeader, StatCard } from '@/components/shared';
import type { ModelId } from '@/types';

// Shared: daily-count quota hook (used to gate Free plans)
function useDailyCount(key: string, limit: number) {
  const today = new Date().toISOString().slice(0, 10);
  const read = () => {
    try {
      const r = JSON.parse(localStorage.getItem(key) || '{}') as { date?: string; count?: number };
      return r.date === today ? r.count ?? 0 : 0;
    } catch {
      return 0;
    }
  };
  const [count, setCount] = useState<number>(read);
  const bump = () => {
    const n = count + 1;
    setCount(n);
    try {
      localStorage.setItem(key, JSON.stringify({ date: today, count: n }));
    } catch {
      /* ignore */
    }
  };
  return { count, remaining: Math.max(0, limit - count), bump };
}

// Inline upgrade nudge shown to Free users inside gated pages
function PlanHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-4 rounded-lg bg-[var(--vp-selected-bg)] px-3 py-2 text-[12px] font-medium text-[var(--vp-primary)]">
      <span className="hl-strong">Free plan</span> — {children}
    </p>
  );
}

function filterRange<T extends { at: string }>(points: T[], days: number): T[] {
  const cutoff = Date.now() - days * 86400000;
  return points.filter((p) => new Date(p.at).getTime() >= cutoff);
}

// ============================================================
// COPILOT — interactive AI chat (Free: 5/day · Pro: unlimited + context)
// ============================================================
const COPILOT_REPLIES = [
  'Based on your last 7 days, GPT-4o is 42% of spend. I can draft a routing rule to shift easy tasks to Gemini and save ~$610/mo.',
  'Done — I summarized the 12 open tickets and flagged 3 as urgent. The full report is in your Sessions tab.',
  'Your “Production” key was used 4 minutes ago from Berlin. Everything looks normal — no anomalies.',
  'Here’s your weekly digest: spend down 8%, active sessions up 22%. You’re trending under budget.',
  'I armed a budget alert at 80% of $50. You’ll be notified the moment you cross it.',
];
const QUICK_PROMPTS = ['Summarize today\u2019s AI spend', 'Find my biggest cost driver', 'Arm a budget alert at 80%'];

export function CopilotPage() {
  const { isPro } = usePlan();
  const { toast } = useUI();
  const quota = useDailyCount('aico.copilot.quota', 5);
  const [msgs, setMsgs] = useState<{ id: string; role: 'user' | 'assistant'; text: string }[]>([
    { id: 'm0', role: 'assistant', text: "Hey — I'm your VectorPilot copilot. Ask me about spend, keys, or your sessions and I'll act on it." },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, typing]);

  function send(text?: string) {
    const t = (text ?? input).trim();
    if (!t) return;
    if (!isPro && quota.remaining <= 0) {
      toast({ type: 'warning', title: 'Daily limit reached', description: 'Upgrade to Pro for unlimited copilot messages.' });
      return;
    }
    setMsgs((m) => [...m, { id: genId('m'), role: 'user', text: t }]);
    setInput('');
    if (!isPro) quota.bump();
    setTyping(true);
    window.setTimeout(() => {
      const base = COPILOT_REPLIES[Math.floor(Math.random() * COPILOT_REPLIES.length)];
      const reply = isPro ? `${base}\n\n(Pro context: I cross-referenced your live usage and 30-day history for this answer.)` : base;
      setMsgs((m) => [...m, { id: genId('m'), role: 'assistant', text: reply }]);
      setTyping(false);
    }, 850);
  }

  return (
    <div>
      <PageHeader title="Copilot" subtitle={isPro ? 'Unlimited, context-aware assistance grounded in your data.' : '5 messages per day — upgrade for unlimited + context.'}>
        {isPro ? <Badge tone="green">unlimited</Badge> : <Badge tone="muted">{quota.remaining}/5 today</Badge>}
      </PageHeader>

      <div className="mx-auto max-w-3xl">
        {isPro && (
          <div className="mb-3 flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((q) => (
              <button key={q} onClick={() => send(q)} className="rounded-full border border-[var(--vp-border-strong)] px-3 py-1.5 text-[13px] text-[var(--vp-text-secondary)] hover:bg-[var(--vp-surface-alt)]">
                {q}
              </button>
            ))}
          </div>
        )}
        <div className="overflow-hidden rounded-2xl border border-[var(--vp-border)] bg-[var(--vp-surface)]">
          <div ref={scrollRef} className="h-[460px] space-y-3 overflow-y-auto p-4">
            {msgs.map((m) => (
              <div key={m.id} className={cn('flex route-enter', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn('flex max-w-[85%] gap-2.5', m.role === 'user' && 'flex-row-reverse')}>
                  <span className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-white', m.role === 'user' ? 'bg-[var(--vp-text-muted)]' : 'bg-gradient-to-br from-indigo-500 to-violet-600')}>
                    {m.role === 'user' ? 'You' : <Bot className="h-4 w-4" />}
                  </span>
                  <div className={cn('whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed', m.role === 'user' ? 'rounded-tr-sm bg-[var(--vp-primary)] text-white' : 'rounded-tl-sm bg-[var(--vp-surface-alt)]')}>
                    {m.text}
                  </div>
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="flex gap-1 rounded-2xl rounded-tl-sm bg-[var(--vp-surface-alt)] px-4 py-3">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--vp-text-muted)] [animation-delay:0ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--vp-text-muted)] [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--vp-text-muted)] [animation-delay:300ms]" />
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 border-t border-[var(--vp-border)] p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              className={inputClass}
              placeholder="Ask your copilot anything…"
            />
            <Button variant="ai" onClick={() => send()}>
              <Send className="h-4 w-4" /> Send
            </Button>
          </div>
        </div>
        {!isPro && <PlanHint>5 messages/day. <span className="hl">Pro</span> adds unlimited messages, 30-day context, and quick actions.</PlanHint>}
      </div>
    </div>
  );
}

// ============================================================
// PROJECTS — manage AI projects with budgets (Free: 1 · Pro: unlimited + budgets)
// ============================================================
interface Project {
  id: string;
  name: string;
  status: 'active' | 'paused';
  tasks: number;
  spendUsd: number;
  budgetUsd: number;
  model: ModelId;
}
const SEED_PROJECTS: Project[] = [
  { id: 'p1', name: 'Customer Support Bot', status: 'active', tasks: 24, spendUsd: 142, budgetUsd: 300, model: 'gpt-4o' },
  { id: 'p2', name: 'Doc Summarizer', status: 'active', tasks: 12, spendUsd: 64, budgetUsd: 120, model: 'gemini-1.5' },
  { id: 'p3', name: 'Code Reviewer', status: 'paused', tasks: 8, spendUsd: 31, budgetUsd: 80, model: 'claude-sonnet' },
];
const FREE_PROJECT_LIMIT = 1;

export function ProjectsPage() {
  const { isPro } = usePlan();
  const { toast } = useUI();
  const [items, setItems] = useState<Project[]>(SEED_PROJECTS);
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('150');

  function add() {
    if (!isPro && items.length >= FREE_PROJECT_LIMIT) {
      toast({ type: 'warning', title: 'Free plan limit', description: `Free allows ${FREE_PROJECT_LIMIT} project. Upgrade for unlimited.` });
      return;
    }
    if (!name.trim()) return;
    setItems((a) => [{ id: genId('p'), name: name.trim(), status: 'active', tasks: 0, spendUsd: 0, budgetUsd: isPro ? Number(budget) || 0 : 0, model: 'gpt-4o' }, ...a]);
    setName('');
    setBudget('150');
    toast({ type: 'success', title: 'Project created' });
  }
  function remove(id: string) {
    setItems((a) => a.filter((p) => p.id !== id));
  }
  function toggle(id: string) {
    setItems((a) => a.map((p) => (p.id === id ? { ...p, status: p.status === 'active' ? 'paused' : 'active' } : p)));
  }

  return (
    <div>
      <PageHeader title="Projects" subtitle={isPro ? 'Unlimited projects with per-project budgets.' : `Free allows ${FREE_PROJECT_LIMIT} project — no budgets.`} />
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="rounded-2xl border border-[var(--vp-border)] bg-[var(--vp-surface)] p-5">
          <h2 className="font-bold">New project</h2>
          <div className="mt-4 space-y-3">
            <Field label="Project name">
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Marketing assistant" />
            </Field>
            <Field label="Monthly budget (USD)" hint={isPro ? undefined : 'Budgets are a Pro feature'}>
              <input className={cn(inputClass, !isPro && 'opacity-50')} value={budget} onChange={(e) => setBudget(e.target.value)} disabled={!isPro} placeholder="150" />
            </Field>
            <Button variant="ai" className="w-full" onClick={add}>
              <Plus className="h-4 w-4" /> Create project
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {items.length === 0 ? (
            <EmptyState icon={<GitBranch className="h-6 w-6" />} title="No projects yet" hint="Create your first AI project to start tracking spend per use case." />
          ) : (
            items.map((p) => {
              const pctUsed = p.budgetUsd > 0 ? Math.min(100, (p.spendUsd / p.budgetUsd) * 100) : 0;
              return (
                <div key={p.id} className="rounded-2xl border border-[var(--vp-border)] bg-[var(--vp-surface)] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold">{p.name}</p>
                        <Badge tone={p.status === 'active' ? 'green' : 'muted'}>{p.status}</Badge>
                      </div>
                      <p className="mt-0.5 flex items-center gap-2 text-[12px] text-[var(--vp-text-muted)]">
                        <span className="flex items-center gap-1"><Cpu className="h-3 w-3" /> {modelLabel(p.model)}</span>
                        <span>· {p.tasks} tasks</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => toggle(p.id)}>{p.status === 'active' ? 'Pause' : 'Resume'}</Button>
                      <Button variant="ghost" size="sm" onClick={() => remove(p.id)}><Trash2 className="h-4 w-4 text-rose-500" /></Button>
                    </div>
                  </div>
                  {isPro && p.budgetUsd > 0 && (
                    <div className="mt-4">
                      <div className="mb-1 flex justify-between text-[12px] text-[var(--vp-text-muted)]">
                        <span>{usd(p.spendUsd)} spent</span>
                        <span>of {usd(p.budgetUsd)} budget</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--vp-surface-alt)]">
                        <div className="h-full rounded-full" style={{ width: `${pctUsed}%`, background: pctUsed >= 90 ? 'var(--spend-critical)' : pctUsed >= 70 ? 'var(--spend-warn)' : 'var(--vp-primary)' }} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
          {!isPro && <PlanHint>1 project, no budgets. <span className="hl">Pro</span> unlocks unlimited projects, per-project budgets, and team members.</PlanHint>}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ACTIVITY — real-time event feed (Free: recent only · Pro: full + filters + export)
// ============================================================
interface FeedEvent {
  id: string;
  type: 'cost' | 'key' | 'auth' | 'budget';
  title: string;
  detail: string;
  at: string;
}
const STATIC_EVENTS: FeedEvent[] = [
  { id: 'e1', type: 'key', title: 'API key created', detail: '“Production” key created from Berlin, DE', at: new Date(Date.now() - 1000 * 60 * 40).toISOString() },
  { id: 'e2', type: 'auth', title: 'New sign-in', detail: 'Maya Chen · MacBook Pro · Chrome', at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString() },
  { id: 'e3', type: 'budget', title: 'Budget alert armed', detail: '80% of $50 monthly limit', at: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString() },
];

export function ActivityPage() {
  const { isPro } = usePlan();
  const { points } = useUsage();
  const costEvents: FeedEvent[] = useMemo(
    () =>
      points
        .slice(-(isPro ? 40 : 12))
        .reverse()
        .map((p) => ({ id: p.id, type: 'cost', title: `${modelLabel(p.model)} call`, detail: `${formatTokens(p.tokens)} tokens · ${usd(p.costUsd, 4)}`, at: p.at })),
    [points, isPro],
  );
  const all = useMemo(
    () => [...costEvents, ...STATIC_EVENTS].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, isPro ? 60 : 15),
    [costEvents, isPro],
  );
  const [filter, setFilter] = useState<'all' | FeedEvent['type']>('all');
  const shown = all.filter((e) => filter === 'all' || e.type === filter);

  const typeIcon = {
    cost: <Zap className="h-3.5 w-3.5" />,
    key: <Lock className="h-3.5 w-3.5" />,
    auth: <ActivityIcon className="h-3.5 w-3.5" />,
    budget: <Gauge className="h-3.5 w-3.5" />,
  } as const;

  return (
    <div>
      <PageHeader title="Activity" subtitle={isPro ? 'Full, filterable event history — live.' : 'Recent activity — upgrade for full history & filters.'}>
        {isPro && (
          <Button variant="outline" size="sm" onClick={() => exportUsageCsv(points)}>
            Export
          </Button>
        )}
      </PageHeader>
      <div className="mb-4 flex flex-wrap gap-2">
        {(['all', 'cost', 'key', 'auth', 'budget'] as const).map((f) => (
          <button
            key={f}
            onClick={() => (isPro || f === 'all' ? setFilter(f) : undefined)}
            disabled={!isPro && f !== 'all'}
            className={cn(
              'rounded-full border px-3 py-1.5 text-[13px] font-semibold capitalize transition-colors',
              filter === f ? 'border-[var(--vp-primary)] bg-[var(--vp-selected-bg)] text-[var(--vp-primary)]' : 'border-[var(--vp-border)] text-[var(--vp-text-secondary)]',
              !isPro && f !== 'all' && 'cursor-not-allowed opacity-40',
            )}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="space-y-2.5">
        {shown.map((e) => (
          <div key={e.id} className="flex items-center gap-3 rounded-xl border border-[var(--vp-border)] bg-[var(--vp-surface)] p-3.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--vp-surface-alt)] text-[var(--vp-primary)]">{typeIcon[e.type]}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{e.title}</p>
              <p className="truncate text-[12px] text-[var(--vp-text-muted)]">{e.detail}</p>
            </div>
            <span className="shrink-0 text-[12px] text-[var(--vp-text-muted)]">{timeAgo(e.at)}</span>
          </div>
        ))}
      </div>
      {!isPro && <PlanHint>recent events only. <span className="hl">Pro</span> unlocks full history, all filters, and CSV export.</PlanHint>}
    </div>
  );
}

// ============================================================
// ANALYTICS — model comparison + trends (Free: 7d · Pro: 30d + metrics + export)
// ============================================================
const MODEL_METRICS: Record<ModelId, { latencyMs: number; quality: number }> = {
  'gpt-4o': { latencyMs: 820, quality: 94 },
  'claude-sonnet': { latencyMs: 1100, quality: 96 },
  'gemini-1.5': { latencyMs: 640, quality: 90 },
  custom: { latencyMs: 480, quality: 88 },
};

export function AnalyticsPage() {
  const { isPro } = usePlan();
  const { points } = useUsage();
  const days = isPro ? 30 : 7;
  const ranged = useMemo(() => filterRange(points, days), [points, days]);
  const slices = useMemo(() => deriveModelSlices(ranged), [ranged]);
  const monthUsd = slices.reduce((a, s) => a + s.usd, 0);
  const topSessions = mockSessions.map((s, i) => ({ ...s, costUsd: [42.1, 28.4, 15.7][i] ?? 9.2 }));

  return (
    <div>
      <PageHeader title="Analytics" subtitle={isPro ? 'Deep model analytics over 30 days.' : '7-day analytics — upgrade for 30-day depth.'}>
        {isPro && (
          <Button variant="outline" size="sm" onClick={() => exportUsageCsv(points)}>
            Export
          </Button>
        )}
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={`Spend · ${days}d`} value={usd(monthUsd)} deltaPct={null} tone="green" />
        <StatCard label="Models in use" value={String(slices.length)} deltaPct={null} tone="cyan" />
        <StatCard label="Avg quality" value={isPro ? `${Math.round(slices.reduce((a, s) => a + MODEL_METRICS[s.model].quality * (s.pct / 100), 0))}%` : 'Pro'} deltaPct={null} tone="gold" />
      </div>

      <div className="mt-5 rounded-2xl border border-[var(--vp-border)] bg-[var(--vp-surface)] p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold">Daily spend trend</h2>
          <Badge tone={isPro ? 'green' : 'muted'}>{isPro ? '30 days' : '7 days · free'}</Badge>
        </div>
        <BarChart points={ranged} range={isPro ? '30d' : '7d'} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-[var(--vp-border)] bg-[var(--vp-surface)] p-6">
          <h2 className="mb-4 font-bold">Model comparison</h2>
          <div className="space-y-3">
            {slices.map((s) => {
              const m = MODEL_METRICS[s.model];
              return (
                <div key={s.model} className="rounded-xl border border-[var(--vp-border)] p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 font-semibold">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: modelColorVar(s.model) }} />
                      {s.label}
                    </span>
                    <span className="font-mono text-[13px] text-[var(--vp-text-muted)]">{usd(s.usd)} · {s.pct}%</span>
                  </div>
                  {isPro && (
                    <div className="mt-2.5 grid grid-cols-2 gap-3 text-[12px]">
                      <div className="flex items-center gap-1.5 text-[var(--vp-text-muted)]"><Clock className="h-3.5 w-3.5" /> {m.latencyMs}ms avg</div>
                      <div className="flex items-center gap-1.5 text-[var(--vp-text-muted)]"><Gauge className="h-3.5 w-3.5" /> {m.quality}/100 quality</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--vp-border)] bg-[var(--vp-surface)] p-6">
          <h2 className="mb-4 font-bold">Top sessions by cost</h2>
          <div className="space-y-2.5">
            {topSessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-xl border border-[var(--vp-border)] p-3.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{s.title}</p>
                  <p className="text-[12px] text-[var(--vp-text-muted)]">{s.turns.length} turns · {timeAgo(s.updatedAt)}</p>
                </div>
                <span className="font-mono text-[13px] font-bold text-[var(--vp-primary)]">{usd(s.costUsd)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {!isPro && <PlanHint>7-day window, no latency/quality metrics. <span className="hl">Pro</span> adds 30-day depth, model metrics, benchmarks, and export.</PlanHint>}
    </div>
  );
}

// ============================================================
// INTEGRATIONS — connectors + webhooks (Free: 1 connector · Pro: all + webhooks)
// ============================================================
const SERVICES = [
  { id: 'slack', name: 'Slack', desc: 'Cost & budget alerts to channels' },
  { id: 'github', name: 'GitHub', desc: 'Tag spend to PRs & commits' },
  { id: 'linear', name: 'Linear', desc: 'Attach AI cost to issues' },
  { id: 'jira', name: 'Jira', desc: 'Roll up spend per epic' },
  { id: 'notion', name: 'Notion', desc: 'Publish usage digests' },
  { id: 'zapier', name: 'Zapier', desc: 'Trigger 6,000+ automations' },
  { id: 'sentry', name: 'Sentry', desc: 'Correlate errors with spend' },
  { id: 'datadog', name: 'Datadog', desc: 'Stream metrics to dashboards' },
];
const DELIVERIES = [
  { id: 'd1', event: 'usage.created', code: '200', at: '2m ago' },
  { id: 'd2', event: 'key.revoked', code: '200', at: '1h ago' },
  { id: 'd3', event: 'budget.alert', code: '500', at: '3h ago' },
];

export function IntegrationsPage() {
  const { isPro } = usePlan();
  const { toast } = useUI();
  const [connected, setConnected] = useState<Record<string, boolean>>({ slack: true, github: true, notion: true });
  const [events, setEvents] = useState({ usage: true, keys: true, budget: true, sessions: false });

  const connectedCount = Object.values(connected).filter(Boolean).length;
  function toggle(id: string) {
    setConnected((c) => {
      const next = !c[id];
      if (next && !isPro && connectedCount >= 1) {
        toast({ type: 'warning', title: 'Free plan limit', description: 'Free allows 1 connector. Upgrade to connect more.' });
        return c;
      }
      return { ...c, [id]: next };
    });
  }

  return (
    <div>
      <PageHeader title="Integrations" subtitle={isPro ? 'Connect every service and route events via webhooks.' : '1 connector on Free — upgrade for all + webhooks.'} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((s) => {
          const on = !!connected[s.id];
          return (
            <div key={s.id} className="rounded-2xl border border-[var(--vp-border)] bg-[var(--vp-surface)] p-5">
              <div className="flex items-start justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--vp-surface-alt)] text-[var(--vp-primary)]">
                  <Plug className="h-4 w-4" />
                </span>
                {on && <Badge tone="green">connected</Badge>}
              </div>
              <p className="mt-3 font-bold">{s.name}</p>
              <p className="mt-0.5 text-[12px] text-[var(--vp-text-muted)]">{s.desc}</p>
              <Button variant={on ? 'ghost' : 'outline'} size="sm" className="mt-3 w-full" onClick={() => toggle(s.id)}>
                {on ? 'Disconnect' : 'Connect'}
              </Button>
            </div>
          );
        })}
      </div>

      {isPro ? (
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-[var(--vp-border)] bg-[var(--vp-surface)] p-6">
            <h2 className="flex items-center gap-2 font-bold"><Webhook className="h-4 w-4" /> Webhook endpoint</h2>
            <p className="mt-1 text-[13px] text-[var(--vp-text-muted)]">Route VectorPilot events to your own services.</p>
            <Field label="Endpoint URL"><input className={inputClass} defaultValue="https://hooks.yourapp.io/vectorpilot" /></Field>
            <div className="mt-3">
              <p className="mb-2 text-[13px] font-semibold">Events</p>
              <div className="space-y-2">
                {([
                  ['usage', 'Usage events'],
                  ['keys', 'Key events'],
                  ['budget', 'Budget alerts'],
                  ['sessions', 'Session events'],
                ] as const).map(([k, label]) => (
                  <div key={k} className="flex items-center justify-between rounded-lg border border-[var(--vp-border)] px-3 py-2 text-sm">
                    <span>{label}</span>
                    <Toggle checked={events[k]} onChange={(v) => setEvents((e) => ({ ...e, [k]: v }))} />
                  </div>
                ))}
              </div>
            </div>
            <Button className="mt-4" variant="ai" onClick={() => toast({ type: 'success', title: 'Test delivery sent', description: '200 OK received.' })}>
              <Send className="h-4 w-4" /> Send test event
            </Button>
          </div>

          <div className="rounded-2xl border border-[var(--vp-border)] bg-[var(--vp-surface)] p-6">
            <h2 className="flex items-center gap-2 font-bold"><Server className="h-4 w-4" /> Recent deliveries</h2>
            <div className="mt-3 space-y-1.5">
              {DELIVERIES.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-lg px-2 py-2 text-[13px] hover:bg-[var(--vp-surface-alt)]">
                  <span className="font-mono">{d.event}</span>
                  <Badge tone={d.code.startsWith('2') ? 'green' : 'rose'}>{d.code}</Badge>
                  <span className="text-[var(--vp-text-muted)]">{d.at}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-[var(--vp-border-strong)] bg-[var(--vp-surface)] p-8 text-center">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--vp-selected-bg)] text-[var(--vp-primary)]"><Webhook className="h-5 w-5" /></span>
          <p className="mt-3 font-bold">Webhooks & event routing</p>
          <p className="mx-auto mt-1 max-w-sm text-[13px] text-[var(--vp-text-muted)]">Route cost, key, and budget events to your own services with retryable webhooks.</p>
          <PlanHint>webhooks are disabled. <span className="hl">Pro</span> unlocks webhooks, delivery logs, and all connectors.</PlanHint>
        </div>
      )}
    </div>
  );
}
