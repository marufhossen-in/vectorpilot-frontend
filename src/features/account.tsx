import { useRef, useState } from 'react';
import {
  Bell,
  Camera,
  Check,
  ChevronRight,
  Code,
  CreditCard,
  Palette,
  Plug,
  Shield,
  Trash2,
  Upload,
  User as UserIcon,
  Users,
} from 'lucide-react';
import { gsap } from 'gsap';

import { mockPlans, seedActiveSessions, seedInvoices, seedNotifications, seedTeam } from '@/data/mock';
import { cn, timeAgo, usd } from '@/lib/utils';
import { useAuth, useUI, useUsage } from '@/store/AppStores';
import { Badge, Button, CopyButton, Field, inputClass, Modal, Toggle } from '@/components/ui';
import { PageHeader } from '@/components/shared';
import { BillingToggle } from '@/features/landing';
import type { PlanId, Theme } from '@/types';

const SECTIONS = [
  { id: 'account', label: 'Account', icon: UserIcon },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'billing', label: 'Billing', icon: CreditCard },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'api', label: 'API & Webhooks', icon: Code },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="space-y-5 rounded-2xl border border-[var(--vp-border)] bg-[var(--vp-surface)] p-6">{children}</div>;
}

function Row2({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2 sm:grid-cols-[200px_1fr] sm:items-center">
      <p className="text-[13px] font-semibold text-[var(--vp-text-secondary)]">{label}</p>
      <div>{children}</div>
    </div>
  );
}

export function SettingsPage() {
  const { state } = useAuth();
  const [active, setActive] = useState<SectionId>('account');

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your workspace, security, and preferences." />
      <div className="grid gap-6 lg:grid-cols-[230px_1fr]">
        <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-[var(--vp-border)] bg-[var(--vp-surface)] p-2 lg:flex-col">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={cn(
                'flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active === s.id ? 'bg-[var(--vp-selected-bg)] text-[var(--vp-primary)]' : 'text-[var(--vp-text-secondary)] hover:bg-[var(--vp-surface-alt)]',
              )}
            >
              <s.icon className="h-4 w-4" />
              {s.label}
              <ChevronRight className="ml-auto hidden h-4 w-4 lg:block" />
            </button>
          ))}
        </nav>
        <div key={active} className="route-enter">
          {active === 'account' && <AccountSection name={state.user?.name ?? ''} email={state.user?.email ?? ''} />}
          {active === 'security' && <SecuritySection />}
          {active === 'notifications' && <NotificationSection />}
          {active === 'integrations' && <IntegrationSection />}
          {active === 'billing' && <BillingSection planId={state.user?.plan ?? 'pro'} />}
          {active === 'team' && <TeamSection />}
          {active === 'appearance' && <AppearanceSection />}
          {active === 'api' && <ApiSection />}
        </div>
      </div>
    </div>
  );
}

// ---- Account ----
function AccountSection({ name, email }: { name: string; email: string }) {
  const { toast } = useUI();
  const [bio, setBio] = useState('Building delightful AI tools for teams.');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');

  return (
    <Panel>
      <h2 className="text-lg font-bold">Account</h2>
      <Row2 label="Display name">
        <input className={inputClass} defaultValue={name} />
      </Row2>
      <Row2 label="Email address">
        <input className={inputClass} defaultValue={email} />
      </Row2>
      <Row2 label="Bio">
        <div>
          <textarea className={cn(inputClass, 'min-h-[80px] resize-y')} value={bio} onChange={(e) => setBio(e.target.value.slice(0, 280))} />
          <p className="mt-1 text-right text-[11px] text-[var(--vp-text-muted)]">{bio.length}/280</p>
        </div>
      </Row2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company"><input className={inputClass} defaultValue="Northwind" /></Field>
        <Field label="Location"><input className={inputClass} defaultValue="Berlin, DE" /></Field>
        <Field label="Timezone">
          <select className={inputClass} defaultValue="Europe/Berlin">
            <option>Europe/Berlin</option>
            <option>America/New_York</option>
            <option>Asia/Tokyo</option>
          </select>
        </Field>
        <Field label="Language">
          <select className={inputClass} defaultValue="English">
            <option>English</option>
            <option>Deutsch</option>
            <option>日本語</option>
          </select>
        </Field>
      </div>
      <div className="flex justify-between border-t border-[var(--vp-border)] pt-5">
        <Button onClick={() => toast({ type: 'success', title: 'Saved' })}>Save changes</Button>
        <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
          <Trash2 className="h-4 w-4" /> Delete account
        </Button>
      </div>
      <Modal open={confirmOpen} title="Delete account" onClose={() => setConfirmOpen(false)} size="sm">
        <p className="text-sm text-[var(--vp-text-secondary)]">
          This permanently deletes your workspace. Type <strong>{email}</strong> to confirm.
        </p>
        <input className={cn(inputClass, 'mt-3')} value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} placeholder={email} />
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button variant="destructive" disabled={confirmEmail !== email} onClick={() => { setConfirmOpen(false); toast({ type: 'info', title: 'Account scheduled for deletion' }); }}>
            Delete forever
          </Button>
        </div>
      </Modal>
    </Panel>
  );
}

// ---- Security ----
function SecuritySection() {
  const { toast } = useUI();
  const [twofa, setTwofa] = useState(false);
  const [timeout, setTimeoutVal] = useState('30m');
  const [sessions, setSessions] = useState(seedActiveSessions);
  return (
    <Panel>
      <h2 className="text-lg font-bold">Security</h2>
      <Row2 label="Two-factor auth">
        <div className="flex items-center gap-3">
          <Toggle checked={twofa} onChange={setTwofa} label="2FA" />
          <span className="text-sm text-[var(--vp-text-muted)]">{twofa ? 'Enabled' : 'Disabled'}</span>
        </div>
      </Row2>
      <Row2 label="Session timeout">
        <select className={inputClass} value={timeout} onChange={(e) => setTimeoutVal(e.target.value)}>
          {['15m', '30m', '1h', '4h', '24h'].map((t) => <option key={t}>{t}</option>)}
        </select>
      </Row2>
      <div className="border-t border-[var(--vp-border)] pt-4">
        <p className="mb-2 text-[13px] font-semibold">Change password</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <input className={inputClass} type="password" placeholder="Current" />
          <input className={inputClass} type="password" placeholder="New" />
          <input className={inputClass} type="password" placeholder="Confirm" />
        </div>
        <Button className="mt-3" size="sm" onClick={() => toast({ type: 'success', title: 'Password updated' })}>Update password</Button>
      </div>
      <div className="border-t border-[var(--vp-border)] pt-4">
        <p className="mb-2 text-[13px] font-semibold">Active sessions</p>
        <div className="space-y-2">
          {sessions.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-lg border border-[var(--vp-border)] px-3 py-2 text-[13px]">
              <div>
                <p className="font-semibold">{s.device} {s.current && <Badge tone="green">current</Badge>}</p>
                <p className="text-[var(--vp-text-muted)]">{s.location} · {s.ip} · {timeAgo(s.startedAt)}</p>
              </div>
              {!s.current && <Button variant="ghost" size="sm" onClick={() => setSessions((a) => a.filter((x) => x.id !== s.id))}>Revoke</Button>}
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

// ---- Notifications ----
const NOTIF_ROWS: { key: keyof typeof seedNotifications; label: string; browser: boolean }[] = [
  { key: 'budgetAlerts', label: 'Budget alerts', browser: true },
  { key: 'usageReports', label: 'Usage reports', browser: false },
  { key: 'securityAlerts', label: 'Security alerts', browser: true },
  { key: 'productUpdates', label: 'Product updates', browser: false },
  { key: 'teamActivity', label: 'Team activity', browser: false },
];

function NotificationSection() {
  const [prefs, setPrefs] = useState({ ...seedNotifications });
  return (
    <Panel>
      <h2 className="text-lg font-bold">Notifications</h2>
      <div className="overflow-hidden rounded-xl border border-[var(--vp-border)]">
        <div className="grid grid-cols-[1fr_80px_80px] bg-[var(--vp-surface-alt)] px-4 py-2 text-[12px] font-semibold text-[var(--vp-text-muted)]">
          <span>Category</span>
          <span className="text-center">Email</span>
          <span className="text-center">Browser</span>
        </div>
        {NOTIF_ROWS.map((r) => (
          <div key={r.key} className="grid grid-cols-[1fr_80px_80px] items-center border-t border-[var(--vp-border)] px-4 py-2.5 text-sm">
            <span>{r.label}</span>
            <div className="flex justify-center"><Toggle checked={prefs.email} onChange={(v) => setPrefs((p) => ({ ...p, email: v }))} /></div>
            <div className="flex justify-center">
              {r.browser ? <Toggle checked={prefs.browser} onChange={(v) => setPrefs((p) => ({ ...p, browser: v }))} /> : <span className="text-[var(--vp-text-disabled)]">—</span>}
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

// ---- Integrations ----
const INTEGRATIONS = [
  { id: 'slack', name: 'Slack', connected: true, account: '@maya' },
  { id: 'github', name: 'GitHub', connected: true, account: 'northwind' },
  { id: 'linear', name: 'Linear', connected: false, account: '' },
  { id: 'jira', name: 'Jira', connected: false, account: '' },
  { id: 'notion', name: 'Notion', connected: true, account: 'Northwind' },
  { id: 'zapier', name: 'Zapier', connected: false, account: '' },
];

function IntegrationSection() {
  const [items, setItems] = useState(INTEGRATIONS);
  const [webhook, setWebhook] = useState('https://hooks.vectorpilot.ai/wh_8f2a');
  return (
    <Panel>
      <h2 className="text-lg font-bold">Integrations</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((it) => (
          <div key={it.id} className="flex items-center justify-between rounded-xl border border-[var(--vp-border)] p-4">
            <div>
              <p className="font-semibold">{it.name}</p>
              <p className="text-[12px] text-[var(--vp-text-muted)]">{it.connected ? `Connected · ${it.account}` : 'Not connected'}</p>
            </div>
            {it.connected ? (
              <Button variant="ghost" size="sm" onClick={() => setItems((a) => a.map((x) => (x.id === it.id ? { ...x, connected: false, account: '' } : x)))}>Disconnect</Button>
            ) : (
              <Button size="sm" onClick={() => setItems((a) => a.map((x) => (x.id === it.id ? { ...x, connected: true, account: '@you' } : x)))}>Connect</Button>
            )}
          </div>
        ))}
      </div>
      <div className="border-t border-[var(--vp-border)] pt-4">
        <p className="mb-2 text-[13px] font-semibold">Webhook endpoint</p>
        <div className="flex gap-2">
          <input className={inputClass} value={webhook} onChange={(e) => setWebhook(e.target.value)} />
          <CopyButton text={webhook} />
        </div>
      </div>
    </Panel>
  );
}

// ---- Billing ----
function BillingSection({ planId }: { planId: PlanId }) {
  const { billing, setBilling } = useUI();
  const { totals } = useUsage();
  const plan = mockPlans.find((p) => p.id === planId) ?? mockPlans[1];
  const pctUsed = Math.min(100, (totals.monthUsd / 50) * 100);
  return (
    <Panel>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Billing</h2>
        <BillingToggle billing={billing} onChange={setBilling} />
      </div>
      <Row2 label="Current plan">
        <Badge tone="indigo">VectorPilot {plan.name}</Badge>
      </Row2>
      <Row2 label="Next billing date">
        <span className="text-sm">Sep 1, 2026 · {usd(billing === 'annual' ? plan.annualUsd * 12 : plan.monthlyUsd)}</span>
      </Row2>
      <Row2 label="Payment method">
        <div className="flex items-center gap-3 rounded-lg border border-[var(--vp-border)] px-3 py-2 text-sm">
          <CreditCard className="h-4 w-4 text-[var(--vp-text-muted)]" /> Visa ending 4242 · 08/27 <Button variant="ghost" size="sm" className="ml-auto">Update</Button>
        </div>
      </Row2>
      <div className="border-t border-[var(--vp-border)] pt-4">
        <div className="mb-1.5 flex justify-between text-[13px]"><span className="font-semibold">Usage this month</span><span className="font-mono">{usd(totals.monthUsd)} / {usd(50)}</span></div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--vp-surface-alt)]">
          <div className="h-full rounded-full bg-[var(--vp-primary)]" style={{ width: `${pctUsed}%` }} />
        </div>
      </div>
      <div className="border-t border-[var(--vp-border)] pt-4">
        <p className="mb-2 text-[13px] font-semibold">Invoice history</p>
        <div className="space-y-1">
          {seedInvoices.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-[13px] hover:bg-[var(--vp-surface-alt)]">
              <span>{inv.date}</span>
              <span className="font-mono">{usd(inv.amountUsd)}</span>
              <Badge tone={inv.status === 'paid' ? 'green' : 'gold'}>{inv.status}</Badge>
              <a href={inv.downloadUrl} className="font-semibold text-[var(--vp-primary)]">PDF</a>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

// ---- Team ----
function TeamSection() {
  const [members, setMembers] = useState(seedTeam);
  const [invite, setInvite] = useState('');
  return (
    <Panel>
      <h2 className="text-lg font-bold">Team</h2>
      <div className="space-y-2">
        {members.map((m) => (
          <div key={m.id} className="flex items-center justify-between rounded-lg border border-[var(--vp-border)] px-3 py-2 text-[13px]">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[11px] font-bold text-white">
                {m.name.split(' ').map((n) => n[0]).join('')}
              </span>
              <div>
                <p className="font-semibold">{m.name}</p>
                <p className="text-[var(--vp-text-muted)]">{m.email} · {m.lastActive}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={m.role === 'owner' ? 'gold' : 'muted'}>{m.role}</Badge>
              {m.role !== 'owner' && <Button variant="ghost" size="sm" onClick={() => setMembers((a) => a.filter((x) => x.id !== m.id))}>Remove</Button>}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-[var(--vp-border)] pt-4">
        <p className="mb-2 text-[13px] font-semibold">Invite member</p>
        <div className="flex gap-2">
          <input className={inputClass} type="email" placeholder="teammate@company.com" value={invite} onChange={(e) => setInvite(e.target.value)} />
          <Button>Send invite</Button>
        </div>
      </div>
    </Panel>
  );
}

// ---- Appearance ----
function AppearanceSection() {
  const { theme, setTheme } = useUI();
  const [reduced, setReduced] = useState(false);
  const themes: { id: Theme; label: string }[] = [
    { id: 'light', label: 'Light' },
    { id: 'dark', label: 'Dark' },
  ];
  return (
    <Panel>
      <h2 className="text-lg font-bold">Appearance</h2>
      <Row2 label="Theme">
        <div className="flex gap-2">
          {themes.map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={cn('flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold', theme === t.id ? 'border-[var(--vp-border-active)] bg-[var(--vp-selected-bg)] text-[var(--vp-primary)]' : 'border-[var(--vp-border)]')}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Row2>
      <Row2 label="Density">
        <select className={inputClass} defaultValue="comfortable">
          <option value="compact">Compact</option>
          <option value="comfortable">Comfortable</option>
          <option value="spacious">Spacious</option>
        </select>
      </Row2>
      <Row2 label="Font size">
        <select className={inputClass} defaultValue="md">
          <option value="sm">Small</option>
          <option value="md">Medium</option>
          <option value="lg">Large</option>
        </select>
      </Row2>
      <Row2 label="Date format">
        <select className={inputClass} defaultValue="YYYY-MM-DD">
          <option>MM/DD/YYYY</option>
          <option>DD/MM/YYYY</option>
          <option>YYYY-MM-DD</option>
        </select>
      </Row2>
      <Row2 label="Reduced motion">
        <Toggle checked={reduced} onChange={setReduced} />
      </Row2>
    </Panel>
  );
}

// ---- API ----
function ApiSection() {
  const baseUrl = (import.meta.env.VITE_API_URL as string) || 'Mock mode — no backend configured';
  return (
    <Panel>
      <h2 className="text-lg font-bold">API & Webhooks</h2>
      <Row2 label="Base URL">
        <div className="flex items-center gap-2">
          <code className="flex-1 truncate rounded-lg border border-[var(--vp-border)] bg-[var(--vp-surface-alt)] px-3 py-2 font-mono text-[12px]">{baseUrl}</code>
          <CopyButton text={baseUrl} />
        </div>
      </Row2>
      <Row2 label="Rate limits">
        <div className="text-[13px] text-[var(--vp-text-secondary)]">600 req/min · 50,000 req/day · <span className="font-semibold">12,480</span> used today</div>
      </Row2>
      <div className="border-t border-[var(--vp-border)] pt-4">
        <p className="mb-2 text-[13px] font-semibold">Install the SDK</p>
        <div className="flex flex-wrap gap-2">
          <code className="rounded-lg border border-[var(--vp-border)] bg-[var(--vp-surface-alt)] px-3 py-2 font-mono text-[12px]">npm i @vectorpilot/sdk</code>
          <CopyButton text="npm i @vectorpilot/sdk" />
        </div>
      </div>
      <div className="border-t border-[var(--vp-border)] pt-4">
        <p className="mb-2 text-[13px] font-semibold">Recent webhook deliveries</p>
        <div className="space-y-1 text-[13px]">
          {[
            ['usage.created', '200', '2m ago'],
            ['key.revoked', '200', '1h ago'],
            ['budget.alert', '500', '3h ago'],
          ].map(([evt, code, t]) => (
            <div key={evt} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-[var(--vp-surface-alt)]">
              <span className="font-mono">{evt}</span>
              <Badge tone={code.startsWith('2') ? 'green' : 'rose'}>{code}</Badge>
              <span className="text-[var(--vp-text-muted)]">{t}</span>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

// ============================================================
// Profile (full-width, image upload)
// ============================================================
export function ProfilePage() {
  const { state } = useAuth();
  const { toast } = useUI();
  const fileRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLImageElement>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setError(null);
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('File must be under 5MB');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setError('Unsupported format (use JPEG, PNG, WebP, or GIF)');
      return;
    }
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      setAvatar(src);
      setLoading(false);
      gsap.fromTo(previewRef.current, { scale: 0.95, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.25, ease: 'power2.out' });
      toast({ type: 'success', title: 'Photo updated' });
    };
    reader.onerror = () => {
      setError('Failed to read file');
      setLoading(false);
    };
    reader.readAsDataURL(file);
  }

  const initials = (state.user?.name || 'U').split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div>
      <PageHeader title="Profile" subtitle="Your public identity and activity." />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-[var(--vp-border)] bg-[var(--vp-surface)] p-6 text-center">
          <div className="relative mx-auto w-fit">
            {avatar ? (
              <img ref={previewRef} src={avatar} alt="Avatar preview" className="mx-auto h-28 w-28 rounded-full object-cover ring-2 ring-[var(--vp-border-active)]" />
            ) : (
              <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-3xl font-bold text-white">
                {initials}
              </div>
            )}
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full border-2 border-[var(--vp-surface)] bg-[var(--vp-primary)] text-white shadow"
              title="Upload photo"
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={onFile} />
          <p className="mt-4 text-lg font-bold">{state.user?.name}</p>
          <Badge tone="indigo">{state.user?.plan}</Badge>
          <p className="mt-1 text-[12px] text-[var(--vp-text-muted)]">Member since Aug 2026</p>
          <Button variant="outline" size="sm" className="mt-4" loading={loading} onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4" /> {loading ? 'Uploading…' : 'Upload photo'}
          </Button>
          {error && <p className="mt-2 text-[12px] text-[var(--vp-danger)]">{error}</p>}
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Panel>
            <h2 className="text-lg font-bold">Profile info</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name"><input className={inputClass} defaultValue={state.user?.name} /></Field>
              <Field label="Email"><input className={inputClass} defaultValue={state.user?.email} /></Field>
              <Field label="Company"><input className={inputClass} defaultValue="Northwind" /></Field>
              <Field label="Location"><input className={inputClass} defaultValue="Berlin, DE" /></Field>
            </div>
            <Field label="Bio"><textarea className={cn(inputClass, 'mt-4 min-h-[70px] resize-y')} defaultValue="Building delightful AI tools for teams." /></Field>
            <Button className="mt-4" onClick={() => toast({ type: 'success', title: 'Profile saved' })}>Save profile</Button>
          </Panel>
          <Panel>
            <h2 className="text-lg font-bold">Activity & stats</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                ['API calls', '12.4k'],
                ['Sessions', '38'],
                ['Keys', '3'],
                ['Saved', '$1.9k'],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-[var(--vp-surface-alt)] p-4 text-center">
                  <p className="font-mono text-2xl font-bold">{v}</p>
                  <p className="text-[12px] text-[var(--vp-text-muted)]">{k}</p>
                </div>
              ))}
            </div>
            <ul className="mt-4 space-y-2 text-[13px]">
              {['Created “Production” API key', 'Resolved 6 urgent support tickets', 'Hit 80% budget alert'].map((a) => (
                <li key={a} className="flex items-center gap-2 text-[var(--vp-text-secondary)]">
                  <Check className="h-4 w-4 text-emerald-500" /> {a}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  );
}
