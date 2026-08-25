import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  Download,
  Eye,
  KeyRound,
  MessageSquare,
  Plus,
  ShieldCheck,
  Trash2,
} from 'lucide-react';

import { chatService, keyService } from '@/lib/api';
import { deriveModelSlices } from '@/components/charts';
import { cn, formatTokens, maskKey, timeAgo, usd } from '@/lib/utils';
import { useKeys, useUI, useUsage } from '@/store/AppStores';
import { AnimatedNumber, useMockUsageSimulator } from '@/hooks';
import { BarChart, Donut } from '@/components/charts';
import { Badge, Button, CopyButton, EmptyState, Field, inputClass, Modal, Skeleton } from '@/components/ui';
import { PageHeader, StatCard } from '@/components/shared';
import {
  CostSnapshot,
  FreeBanner,
  LockedOptimizer,
  PlanBadge,
  SpendOptimizer,
  UpgradeModal,
  exportUsageCsv,
  usePlan,
} from '@/features/plans';
import { mockSessions } from '@/data/mock';
import type { ApiKey, ChatSession, KeyScope, UsagePoint } from '@/types';

const LIMIT_USD = 50;

function filterRange(points: UsagePoint[], days: number): UsagePoint[] {
  const cutoff = Date.now() - days * 86400000;
  return points.filter((p) => new Date(p.at).getTime() >= cutoff);
}

// ---------------- Cost ticker ----------------
export function CostTicker() {
  const { totals, lastEventAt } = useUsage();
  const pctUsed = Math.min(100, (totals.todayUsd / LIMIT_USD) * 100);
  const fmt = useCallback((n: number) => usd(n, 4), []);
  const [ago, setAgo] = useState('never');
  const tone = pctUsed >= 90 ? 'var(--spend-critical)' : pctUsed >= 70 ? 'var(--spend-warn)' : 'var(--spend-ok)';

  useEffect(() => {
    const tick = () => setAgo(timeAgo(lastEventAt));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [lastEventAt]);

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--vp-border)] bg-[var(--vp-surface)] p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span key={lastEventAt} className="ticker-dot live inline-block h-2.5 w-2.5 rounded-full" />
          <span className="text-[12px] font-bold uppercase tracking-wide text-[var(--vp-text-muted)]">Live cost today</span>
        </div>
        <Badge tone={pctUsed >= 90 ? 'rose' : pctUsed >= 70 ? 'gold' : 'green'}>{pctUsed.toFixed(0)}% of limit</Badge>
      </div>
      <p className="mt-4 font-mono text-4xl font-extrabold tracking-tight">
        <AnimatedNumber value={totals.todayUsd} format={fmt} />
      </p>
      <div className="mt-4">
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--vp-surface-alt)]">
          <div className="h-full rounded-full transition-[width] duration-500" style={{ width: `${pctUsed}%`, background: tone }} />
        </div>
        <div className="mt-2 flex justify-between text-[12px] text-[var(--vp-text-muted)]">
          <span>Last event: {ago}</span>
          <span>
            {usd(totals.todayUsd, 4)} of {usd(LIMIT_USD)} limit
          </span>
        </div>
      </div>
    </div>
  );
}

// ---------------- Dashboard home ----------------
export function DashboardHomePage() {
  const { plan, isPro } = usePlan();
  useMockUsageSimulator(isPro);
  const { points, totals } = useUsage();
  const chartPoints = useMemo(() => filterRange(points, 7), [points]);
  const slices = useMemo(() => deriveModelSlices(chartPoints), [chartPoints]);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const openUpgrade = () => setUpgradeOpen(true);

  return (
    <div>
      <PageHeader
        title="Overview"
        subtitle={isPro ? 'Live AI operations, streaming in real time.' : 'Your free workspace — upgrade to unlock live tracking.'}
      >
        <PlanBadge plan={plan} />
      </PageHeader>

      {!isPro && (
        <div className="mb-5">
          <FreeBanner onUpgrade={openUpgrade} />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Today's Spend" value={usd(totals.todayUsd, 4)} deltaPct={totals.deltaPct} tone="green" subText={isPro ? 'live · vs yesterday' : 'snapshot'} />
        <StatCard label="Monthly Spend" value={usd(totals.monthUsd)} deltaPct={null} tone="gold" subText={`Limit ${usd(LIMIT_USD)}`} />
        <StatCard label="API Calls Today" value={formatTokens(totals.tokensToday)} deltaPct={null} tone="cyan" subText="tokens consumed" />
        <StatCard label="Active Sessions" value={String(mockSessions.length)} deltaPct={null} tone="rose" subText="copilot threads" />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {isPro ? <CostTicker /> : <CostSnapshot onUpgrade={openUpgrade} />}
          <div className="rounded-2xl border border-[var(--vp-border)] bg-[var(--vp-surface)] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-bold">Usage — last 7 days</h2>
              <Badge tone="muted">{isPro ? 'live' : 'read-only'}</Badge>
            </div>
            <BarChart points={chartPoints} range="7d" />
            {!isPro && (
              <p className="mt-3 text-[12px] text-[var(--vp-text-muted)]">
                <span className="hl-strong">Free shows 7 days.</span> Upgrade for 30-day history + CSV export.
              </p>
            )}
          </div>
        </div>
        <div className="space-y-5">
          {isPro ? (
            <SpendOptimizer slices={slices} monthUsd={totals.monthUsd} onExport={() => exportUsageCsv(points)} />
          ) : (
            <LockedOptimizer onUpgrade={openUpgrade} />
          )}
          {isPro && (
            <div className="rounded-2xl border border-[var(--vp-border)] bg-[var(--vp-surface)] p-6">
              <h2 className="mb-4 font-bold">Model split</h2>
              <Donut slices={slices} />
            </div>
          )}
        </div>
      </div>

      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </div>
  );
}

// ---------------- Usage page ----------------
export function UsagePage() {
  const { isPro } = usePlan();
  useMockUsageSimulator(isPro);
  const { points, totals } = useUsage();
  const [range, setRange] = useState<'7d' | '30d'>('7d');
  const days = range === '7d' ? 7 : 30;
  const ranged = useMemo(() => filterRange(points, days), [points, days]);
  const slices = useMemo(() => deriveModelSlices(ranged), [ranged]);

  return (
    <div>
      <PageHeader title="Usage analytics" subtitle="Where your budget goes, and where to save.">
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-[var(--vp-border)] p-1">
            {(['7d', '30d'] as const).map((r) => (
              <button
                key={r}
                onClick={() => (isPro || r === '7d') && setRange(r)}
                disabled={!isPro && r === '30d'}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-semibold',
                  range === r ? 'bg-[var(--vp-primary)] text-white' : 'text-[var(--vp-text-secondary)]',
                  !isPro && r === '30d' && 'cursor-not-allowed opacity-40',
                )}
              >
                {r}
              </button>
            ))}
          </div>
          {isPro && (
            <Button variant="outline" size="sm" onClick={() => exportUsageCsv(points)}>
              <Download className="h-4 w-4" /> Export
            </Button>
          )}
        </div>
      </PageHeader>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Today" value={usd(totals.todayUsd, 4)} deltaPct={totals.deltaPct} tone="green" />
        <StatCard label="This Month" value={usd(totals.monthUsd)} deltaPct={null} tone="gold" />
        <StatCard label="Tokens Today" value={formatTokens(totals.tokensToday)} deltaPct={null} tone="cyan" />
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-[var(--vp-border)] bg-[var(--vp-surface)] p-6 lg:col-span-2">
          <h2 className="mb-4 font-bold">Daily spend</h2>
          <BarChart points={ranged} range={range} />
        </div>
        <div className="rounded-2xl border border-[var(--vp-border)] bg-[var(--vp-surface)] p-6">
          <h2 className="mb-4 font-bold">Model split ({range})</h2>
          <Donut slices={slices} />
        </div>
      </div>
    </div>
  );
}

// ---------------- Keys ----------------
function MaskedKey({ apiKey }: { apiKey: ApiKey }) {
  return <span className="font-mono text-[13px] text-[var(--vp-text-secondary)]">{maskKey(apiKey.prefix, apiKey.last4)}</span>;
}

function RevealOnceBox() {
  const { fresh, dismissFresh } = useKeys();
  const { toast } = useUI();
  if (!fresh) return null;
  return (
    <div className="rounded-2xl border border-amber-500/40 bg-amber-500/8 p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-500">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div className="flex-1">
          <p className="font-bold text-amber-600 dark:text-amber-400">Copy your key now — it won’t be shown again</p>
          <p className="mt-1 text-[13px] text-[var(--vp-text-muted)]">
            For your security, the full key exists only in memory. Once dismissed, it’s permanently unrecoverable.
          </p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <code className="flex-1 truncate rounded-lg border border-[var(--vp-border)] bg-[var(--vp-surface)] px-3 py-2.5 font-mono text-[13px]">
              {fresh.fullKey}
            </code>
            <CopyButton
              text={fresh.fullKey}
              label="Copy key"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                dismissFresh();
                toast({ type: 'info', title: 'Key hidden', description: 'Only the masked value is stored now.' });
              }}
            >
              I’ve copied it
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function KeyCreateModal({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (label: string, scope: KeyScope) => Promise<void> }) {
  const [label, setLabel] = useState('');
  const [scope, setScope] = useState<KeyScope>('chat');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setLabel('');
      setScope('chat');
    }
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!label.trim()) return;
    setSaving(true);
    await onSave(label.trim(), scope);
    setSaving(false);
  }

  return (
    <Modal open={open} title="Create API key" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Key label" htmlFor="key-label" hint="e.g. Production, CI runner">
          <input id="key-label" className={inputClass} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Production" autoFocus />
        </Field>
        <Field label="Scope" htmlFor="key-scope">
          <select id="key-scope" className={inputClass} value={scope} onChange={(e) => setScope(e.target.value as KeyScope)}>
            <option value="chat">Chat</option>
            <option value="usage">Usage</option>
            <option value="admin">Admin</option>
          </select>
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving} disabled={!label.trim()}>
            Create key
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function KeyRow({ apiKey, onRevoke }: { apiKey: ApiKey; onRevoke: (id: string) => void }) {
  const { toast } = useUI();
  const revoked = apiKey.status === 'revoked';
  return (
    <div className={cn('flex flex-col gap-3 rounded-xl border border-[var(--vp-border)] bg-[var(--vp-surface)] p-4 sm:flex-row sm:items-center sm:justify-between', revoked && 'opacity-55')}>
      <div className="flex items-center gap-3">
        <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg', revoked ? 'bg-[var(--vp-surface-alt)] text-[var(--vp-text-muted)]' : 'bg-[var(--vp-selected-bg)] text-[var(--vp-primary)]')}>
          <KeyRound className="h-4.5 w-4.5" />
        </span>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold">{apiKey.label}</p>
            <Badge tone={revoked ? 'rose' : 'green'}>{apiKey.status}</Badge>
            <Badge tone="muted">{apiKey.scope}</Badge>
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <MaskedKey apiKey={apiKey} />
            <span className="text-[11px] text-[var(--vp-text-muted)]">· used {timeAgo(apiKey.lastUsedAt)}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => toast({ type: 'info', title: 'Full key hidden', description: 'Full keys are only shown once at creation.' })}
          className="inline-flex items-center gap-1.5 rounded-md border border-[var(--vp-border-strong)] px-2.5 py-1.5 text-[12px] font-semibold text-[var(--vp-text-secondary)] hover:bg-[var(--vp-surface-alt)]"
        >
          <Eye className="h-3.5 w-3.5" /> Reveal
        </button>
        <CopyButton text={maskKey(apiKey.prefix, apiKey.last4)} />
        <button
          onClick={() => onRevoke(apiKey.id)}
          disabled={revoked}
          className="inline-flex items-center gap-1.5 rounded-md border border-rose-500/30 px-2.5 py-1.5 text-[12px] font-semibold text-rose-500 hover:bg-rose-500/10 disabled:opacity-40"
        >
          <Trash2 className="h-3.5 w-3.5" /> Revoke
        </button>
      </div>
    </div>
  );
}

export function KeysPage() {
  const { keys, fresh, create, revoke } = useKeys();
  const { toast } = useUI();
  const [modalOpen, setModalOpen] = useState(false);
  const [revokeId, setRevokeId] = useState<string | null>(null);

  async function handleCreate(label: string, scope: KeyScope) {
    try {
      const res = await keyService.create({ label, scope });
      const { fullKey, ...created } = res;
      create(created, { id: created.id, fullKey });
      setModalOpen(false);
      toast({ type: 'success', title: 'Key created', description: 'Copy it now — shown once.' });
    } catch {
      toast({ type: 'error', title: 'Could not create key' });
    }
  }

  async function confirmRevoke() {
    if (!revokeId) return;
    const k = keys.find((x) => x.id === revokeId);
    revoke(revokeId);
    try {
      await keyService.revoke(revokeId);
    } catch {
      /* mock */
    }
    setRevokeId(null);
    toast({ type: 'info', title: 'Key revoked', description: k ? `${k.label} can no longer be used.` : undefined });
  }

  return (
    <div>
      <PageHeader title="API Keys" subtitle="Create, scope, and revoke keys. Full values are reveal-once by design.">
        <Button variant="ai" onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" /> Create new key
        </Button>
      </PageHeader>

      {fresh && (
        <div className="mb-5">
          <RevealOnceBox />
        </div>
      )}

      {keys.length === 0 ? (
        <EmptyState
          icon={<KeyRound className="h-6 w-6" />}
          title="No keys yet"
          hint="Create your first API key to start integrating VectorPilot."
          actionLabel="Create key"
          onAction={() => setModalOpen(true)}
        />
      ) : (
        <div className="space-y-3">
          {keys.map((k) => (
            <KeyRow key={k.id} apiKey={k} onRevoke={(id) => setRevokeId(id)} />
          ))}
        </div>
      )}

      <KeyCreateModal open={modalOpen} onClose={() => setModalOpen(false)} onSave={handleCreate} />

      <Modal open={revokeId !== null} title="Revoke this key?" onClose={() => setRevokeId(null)} size="sm">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-amber-500" />
          <p className="text-sm text-[var(--vp-text-secondary)]">
            Any service using this key will stop working immediately. This cannot be undone.
          </p>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setRevokeId(null)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={confirmRevoke}>
            Confirm revoke
          </Button>
        </div>
      </Modal>
    </div>
  );
}

// ---------------- Sessions ----------------
export function SessionsPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    chatService
      .sessions()
      .then((s) => {
        if (!alive) return;
        setSessions(s);
        setActiveId(s[0]?.id ?? null);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const active = sessions.find((s) => s.id === activeId) ?? null;

  if (loading) {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-64 lg:col-span-1" />
        <Skeleton className="h-64 lg:col-span-2" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Sessions" subtitle="Every copilot conversation, archived and searchable." />
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-2 lg:col-span-1">
          {sessions.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveId(s.id)}
              className={cn(
                'w-full rounded-xl border p-4 text-left transition-colors',
                activeId === s.id ? 'border-[var(--vp-border-active)] bg-[var(--vp-selected-bg)]' : 'border-[var(--vp-border)] bg-[var(--vp-surface)] hover:bg-[var(--vp-surface-alt)]',
              )}
            >
              <p className="font-semibold">{s.title}</p>
              <p className="mt-0.5 text-[12px] text-[var(--vp-text-muted)]">{timeAgo(s.updatedAt)} · {s.turns.length} turns</p>
            </button>
          ))}
        </div>
        <div className="rounded-2xl border border-[var(--vp-border)] bg-[var(--vp-surface)] p-6 lg:col-span-2">
          {active ? (
            <>
              <h2 className="mb-4 font-bold">{active.title}</h2>
              <div className="space-y-3">
                {active.turns.map((t) => (
                  <div key={t.id} className={cn('flex', t.role === 'user' ? 'justify-end' : 'justify-start')}>
                    <div
                      className={cn(
                        'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed',
                        t.role === 'user' ? 'rounded-br-sm bg-[var(--vp-primary)] text-white' : 'rounded-bl-sm bg-[var(--vp-surface-alt)]',
                      )}
                    >
                      {t.text}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyState icon={<MessageSquare className="h-6 w-6" />} title="Select a session" hint="Pick a conversation to view its transcript." />
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------- Notifications ----------------
type NotifType = 'cost' | 'security' | 'team' | 'product';
interface NotifItem {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  at: string;
  read: boolean;
}

const SEED_NOTIFS: NotifItem[] = [
  { id: 'n1', type: 'cost', title: 'Budget alert · 80%', body: 'Today’s spend crossed 80% of your $50 limit.', at: new Date(Date.now() - 1000 * 60 * 3).toISOString(), read: false },
  { id: 'n2', type: 'security', title: 'New API key created', body: '“Production” key was created from Berlin, DE.', at: new Date(Date.now() - 1000 * 60 * 40).toISOString(), read: false },
  { id: 'n3', type: 'team', title: 'Diego joined the workspace', body: 'diego@northwind.io accepted your invite.', at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), read: true },
  { id: 'n4', type: 'product', title: 'Model routing released', body: 'Auto-route summaries to the cheapest model.', at: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), read: true },
];

const FILTERS: { id: NotifType | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'cost', label: 'Cost' },
  { id: 'security', label: 'Security' },
  { id: 'team', label: 'Team' },
  { id: 'product', label: 'Product' },
];

export function NotificationsPage() {
  const [items, setItems] = useState<NotifItem[]>(SEED_NOTIFS);
  const [filter, setFilter] = useState<NotifType | 'all'>('all');
  const shown = items.filter((n) => filter === 'all' || n.type === filter);
  const unread = items.filter((n) => !n.read).length;

  return (
    <div>
      <PageHeader title="Notifications" subtitle={`${unread} unread`}>
        <Button variant="outline" size="sm" onClick={() => setItems((arr) => arr.map((n) => ({ ...n, read: true })))}>
          <CheckCheck className="h-4 w-4" /> Mark all read
        </Button>
      </PageHeader>
      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn('rounded-full border px-3 py-1.5 text-[13px] font-semibold', filter === f.id ? 'border-[var(--vp-primary)] bg-[var(--vp-selected-bg)] text-[var(--vp-primary)]' : 'border-[var(--vp-border)] text-[var(--vp-text-secondary)]')}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="space-y-2.5">
        {shown.map((n) => (
          <button
            key={n.id}
            onClick={() => setItems((arr) => arr.map((x) => (x.id === n.id ? { ...x, read: true } : x)))}
            className={cn('flex w-full items-start gap-3 rounded-xl border p-4 text-left', n.read ? 'border-[var(--vp-border)] bg-[var(--vp-surface)]' : 'border-[var(--vp-border-active)] bg-[var(--vp-selected-bg)]')}
          >
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--vp-surface-alt)] text-[var(--vp-primary)]">
              <Bell className="h-4 w-4" />
            </span>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{n.title}</p>
                <span className="text-[11px] text-[var(--vp-text-muted)]">{timeAgo(n.at)}</span>
              </div>
              <p className="mt-0.5 text-[13px] text-[var(--vp-text-muted)]">{n.body}</p>
            </div>
            {!n.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--vp-primary)]" />}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------- Placeholder (future routes) ----------------
export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div>
      <PageHeader title={title} subtitle="This module is part of the VectorPilot roadmap." />
      <EmptyState
        icon={<Plus className="h-6 w-6" />}
        title="Coming soon"
        hint={`${title} is planned for a future release. Explore live usage and keys in the meantime.`}
      />
    </div>
  );
}
