import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  Bell,
  Bot,
  CornerDownLeft,
  FolderKanban,
  KeyRound,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Moon,
  Plug,
  Search,
  Settings as SettingsIcon,
  Sun,
  User as UserIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { useAuth, useUI } from '@/store/AppStores';

interface Cmd {
  id: string;
  label: string;
  group: string;
  to?: string;
  action?: () => void;
  icon: ComponentType<{ className?: string }>;
}

/** Global event other components can dispatch to open the palette. */
export const OPEN_COMMAND_PALETTE = 'open-command-palette';

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useUI();
  const { logout } = useAuth();

  const commands = useMemo<Cmd[]>(
    () => [
      { id: 'nav-overview', label: 'Overview', group: 'Navigate', to: '/dashboard', icon: LayoutDashboard },
      { id: 'nav-usage', label: 'Usage analytics', group: 'Navigate', to: '/dashboard/usage', icon: BarChart3 },
      { id: 'nav-keys', label: 'API Keys', group: 'Navigate', to: '/dashboard/keys', icon: KeyRound },
      { id: 'nav-sessions', label: 'Sessions', group: 'Navigate', to: '/dashboard/sessions', icon: MessageSquare },
      { id: 'nav-copilot', label: 'Copilot', group: 'Navigate', to: '/dashboard/copilot', icon: Bot },
      { id: 'nav-projects', label: 'Projects', group: 'Navigate', to: '/dashboard/projects', icon: FolderKanban },
      { id: 'nav-activity', label: 'Activity feed', group: 'Navigate', to: '/dashboard/activity', icon: Activity },
      { id: 'nav-analytics', label: 'Analytics', group: 'Navigate', to: '/dashboard/analytics', icon: BarChart3 },
      { id: 'nav-integrations', label: 'Integrations', group: 'Navigate', to: '/dashboard/integrations', icon: Plug },
      { id: 'nav-settings', label: 'Settings', group: 'Navigate', to: '/dashboard/settings', icon: SettingsIcon },
      { id: 'nav-profile', label: 'Profile', group: 'Navigate', to: '/dashboard/profile', icon: UserIcon },
      { id: 'nav-notifications', label: 'Notifications', group: 'Navigate', to: '/dashboard/notifications', icon: Bell },
      {
        id: 'act-theme',
        label: theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme',
        group: 'Actions',
        action: toggleTheme,
        icon: theme === 'dark' ? Sun : Moon,
      },
      {
        id: 'act-logout',
        label: 'Log out',
        group: 'Actions',
        action: () => {
          logout();
          navigate('/');
        },
        icon: LogOut,
      },
    ],
    [theme, toggleTheme, logout, navigate],
  );

  const filtered = useMemo(
    () => commands.filter((c) => c.label.toLowerCase().includes(q.trim().toLowerCase())),
    [commands, q],
  );

  // Open via ⌘K / Ctrl+K and the custom event; close on route-less escape handled in input.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener(OPEN_COMMAND_PALETTE, onOpen as EventListener);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener(OPEN_COMMAND_PALETTE, onOpen as EventListener);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQ('');
      setActive(0);
      const t = window.setTimeout(() => inputRef.current?.focus(), 40);
      return () => window.clearTimeout(t);
    }
    return undefined;
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [q]);

  function run(c: Cmd) {
    setOpen(false);
    if (c.to) navigate(c.to);
    else c.action?.();
  }

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const c = filtered[active];
      if (c) run(c);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-start justify-center p-4 pt-[12vh]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--vp-border)] bg-[var(--vp-elevated)] shadow-2xl">
        <div className="flex items-center gap-2.5 border-b border-[var(--vp-border)] px-4">
          <Search className="h-4 w-4 text-[var(--vp-text-muted)]" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onInputKey}
            placeholder="Search pages and actions…"
            className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--vp-text-muted)]"
          />
          <kbd className="rounded border border-[var(--vp-border)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--vp-text-muted)]">ESC</kbd>
        </div>
        <div className="max-h-[52vh] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-[var(--vp-text-muted)]">No matching commands.</p>
          ) : (
            filtered.map((c, i) => (
              <button
                key={c.id}
                onMouseEnter={() => setActive(i)}
                onClick={() => run(c)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                  i === active ? 'bg-[var(--vp-selected-bg)] text-[var(--vp-primary)]' : 'text-[var(--vp-text-secondary)]',
                )}
              >
                <c.icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-sm font-medium">{c.label}</span>
                <span className="text-[11px] uppercase tracking-wide text-[var(--vp-text-muted)]">{c.group}</span>
                {i === active && <CornerDownLeft className="h-3.5 w-3.5 text-[var(--vp-text-muted)]" />}
              </button>
            ))
          )}
        </div>
        <div className="border-t border-[var(--vp-border)] px-4 py-2 text-[11px] text-[var(--vp-text-muted)]">
          <kbd className="rounded bg-[var(--vp-surface-alt)] px-1.5 py-0.5">↑</kbd>{' '}
          <kbd className="rounded bg-[var(--vp-surface-alt)] px-1.5 py-0.5">↓</kbd> to navigate ·{' '}
          <kbd className="rounded bg-[var(--vp-surface-alt)] px-1.5 py-0.5">↵</kbd> to select
        </div>
      </div>
    </div>,
    document.body,
  );
}
