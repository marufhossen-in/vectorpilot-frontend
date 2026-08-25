import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  LayoutDashboard,
  KeyRound,
  MessageSquare,
  Settings as SettingsIcon,
  User as UserIcon,
  Activity,
  BarChart3,
  Bot,
  FolderKanban,
  Plug,
  Menu,
  X,
  Sun,
  Moon,
  Search,
  ChevronRight,
} from 'lucide-react';

import logoSrc from '@/assets/logo.png';
import { cn } from '@/lib/utils';
import { useAuth, useUI } from '@/store/AppStores';
import { Button } from '@/components/ui';
import { PlanBadge } from '@/features/plans';
import { CommandPalette, OPEN_COMMAND_PALETTE } from '@/components/CommandPalette';

// ---------------- Logo (navigation logic per context) ----------------
export function Logo({
  context,
  size = 32,
  showWord = true,
}: {
  context: 'public' | 'auth' | 'dashboard';
  size?: number;
  showWord?: boolean;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [, setClicks] = useState(0);

  useEffect(() => {
    setClicks(0);
  }, [location.pathname]);

  function handleClick() {
    if (context === 'dashboard') {
      setClicks((c) => {
        if (c === 0) {
          navigate('/dashboard');
          return 1;
        }
        navigate('/');
        return 0;
      });
    } else {
      navigate('/');
    }
  }

  return (
    <button
      onClick={handleClick}
      title={context === 'dashboard' ? '⌂ Home' : '← Back'}
      className="group inline-flex items-center gap-2.5 transition-transform duration-150 active:scale-[0.97]"
      aria-label="VectorPilot — Home"
    >
      <span className="overflow-hidden rounded-xl ring-1 ring-black/10">
        <img src={logoSrc} alt="VectorPilot" width={size} height={size} className="block" style={{ height: size, width: size }} />
      </span>
      {showWord && (
        <span className="text-[17px] font-extrabold tracking-tight">
          Vector<span className="text-[var(--vp-primary)]">Pilot</span>
        </span>
      )}
    </button>
  );
}

// ---------------- ThemeToggle (scoped, no bleed) ----------------
export function ThemeToggle() {
  const { theme, toggleTheme } = useUI();
  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="relative inline-flex h-9 w-[68px] items-center overflow-hidden rounded-full border border-[var(--vp-border)] bg-[var(--vp-surface-alt)] px-1"
      style={{ contain: 'layout style' }}
    >
      <span
        className="pointer-events-none absolute flex h-7 w-7 items-center justify-center rounded-full bg-[var(--vp-surface)] shadow transition-transform duration-300"
        style={{ transform: theme === 'dark' ? 'translateX(30px)' : 'translateX(0)' }}
      >
        {theme === 'dark' ? <Moon className="h-3.5 w-3.5 text-indigo-400" /> : <Sun className="h-3.5 w-3.5 text-amber-500" />}
      </span>
    </button>
  );
}

// ---------------- Navbar ----------------
const navLinks = [
  { to: '/features', label: 'Features' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/about', label: 'About' },
  { to: '/help', label: 'Help' },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { state } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled ? 'glass border-b border-[var(--vp-border)] py-2.5' : 'border-b border-transparent py-4',
      )}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5">
        <Logo context="public" />
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3.5 py-2 text-sm font-medium transition-colors',
                  isActive ? 'text-[var(--vp-primary)]' : 'text-[var(--vp-text-secondary)] hover:text-[var(--vp-text-primary)]',
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          {state.status === 'authenticated' ? (
            <Link to="/dashboard">
              <Button size="sm">Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link to="/auth/login">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link to="/auth/signup">
                <Button size="sm">Get started</Button>
              </Link>
            </>
          )}
        </div>
        <button className="md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>
      {open && (
        <div className="mx-auto mt-2 max-w-7xl space-y-1 px-5 md:hidden">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-2.5 text-sm font-medium text-[var(--vp-text-secondary)] hover:bg-[var(--vp-surface-alt)]"
            >
              {l.label}
            </Link>
          ))}
          <div className="flex items-center gap-2 pt-2">
            <ThemeToggle />
            <Link to="/auth/login" onClick={() => setOpen(false)} className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                Sign in
              </Button>
            </Link>
            <Link to="/auth/signup" onClick={() => setOpen(false)} className="flex-1">
              <Button size="sm" className="w-full">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

// ---------------- Footer ----------------
export function Footer() {
  return (
    <footer className="border-t border-[var(--vp-border)] bg-[var(--vp-surface)]">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-5 py-14 md:grid-cols-5">
        <div className="col-span-2">
          <Logo context="public" />
          <p className="mt-4 max-w-xs text-sm text-[var(--vp-text-muted)]">
            The AI copilot that tracks every token, every cent, in real time. Built for teams who treat AI spend as a live metric.
          </p>
        </div>
        {[
          { h: 'Product', links: [['Features', '/features'], ['Pricing', '/pricing'], ['Waitlist', '/waitlist'], ['Help', '/help']] },
          { h: 'Company', links: [['About', '/about'], ['Careers', '/about'], ['Blog', '/about'], ['Contact', '/help']] },
          { h: 'Legal', links: [['Privacy', '/about'], ['Terms', '/about'], ['Security', '/about'], ['DPA', '/about']] },
        ].map((col) => (
          <div key={col.h}>
            <p className="text-[13px] font-bold uppercase tracking-wide text-[var(--vp-text-muted)]">{col.h}</p>
            <ul className="mt-3 space-y-2">
              {col.links.map(([label, to]) => (
                <li key={label}>
                  <Link to={to} className="text-sm text-[var(--vp-text-secondary)] hover:text-[var(--vp-primary)]">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-[var(--vp-border)] px-5 py-5">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 text-[12px] text-[var(--vp-text-muted)] sm:flex-row">
          <p>© 2026 VectorPilot · SAA-FE-BP-2026</p>
          <p>Frontend demo · No real payments or API calls.</p>
        </div>
      </div>
    </footer>
  );
}

// ---------------- StatCard ----------------
export function StatCard({
  label,
  value,
  deltaPct,
  tone,
  subText,
}: {
  label: string;
  value: string;
  deltaPct: number | null;
  tone: 'gold' | 'green' | 'cyan' | 'rose';
  subText?: string;
}) {
  const toneRing = {
    gold: 'text-amber-500',
    green: 'text-emerald-500',
    cyan: 'text-sky-500',
    rose: 'text-rose-500',
  }[tone];
  return (
    <div className="rounded-2xl border border-[var(--vp-border)] bg-[var(--vp-surface)] p-5">
      <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--vp-text-muted)]">{label}</p>
      <p className="mt-2 font-mono text-3xl font-bold tracking-tight">{value}</p>
      <div className="mt-2 flex items-center gap-1.5 text-[12px]">
        {deltaPct !== null && (
          <span className={cn('font-semibold', deltaPct >= 0 ? 'text-emerald-500' : 'text-rose-500')}>
            {deltaPct >= 0 ? '▲' : '▼'} {Math.abs(deltaPct).toFixed(1)}%
          </span>
        )}
        <span className={toneRing}>vs prev period</span>
      </div>
      {subText && <p className="mt-3 border-t border-[var(--vp-border)] pt-3 text-[12px] text-[var(--vp-text-muted)]">{subText}</p>}
    </div>
  );
}

// ---------------- PageHeader ----------------
export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1.5 text-sm text-[var(--vp-text-muted)]">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

// ---------------- ScrollToTop ----------------
export function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
}

// ---------------- PublicLayout ----------------
export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1 pt-16">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

// ---------------- Dashboard layout ----------------
const dashNav = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/copilot', label: 'Copilot', icon: Bot },
  { to: '/dashboard/projects', label: 'Projects', icon: FolderKanban },
  { to: '/dashboard/usage', label: 'Usage', icon: BarChart3 },
  { to: '/dashboard/keys', label: 'API Keys', icon: KeyRound },
  { to: '/dashboard/sessions', label: 'Sessions', icon: MessageSquare },
  { to: '/dashboard/activity', label: 'Activity', icon: Activity },
  { to: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
];

export function DashboardLayout() {
  const { state, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const initials = (state.user?.name || 'U')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const crumbs = location.pathname.split('/').filter(Boolean);

  return (
    <div className="min-h-screen bg-[var(--vp-bg)]">
      <ScrollToTop />
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-[var(--vp-border)] bg-[var(--vp-surface)] px-3 py-4 lg:flex">
        <div className="px-2 py-2">
          <Logo context="dashboard" />
        </div>
        <nav className="mt-4 flex-1 space-y-0.5">
          {dashNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end ?? false}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[var(--vp-selected-bg)] text-[var(--vp-primary)]'
                    : 'text-[var(--vp-text-secondary)] hover:bg-[var(--vp-surface-alt)]',
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
          <div className="my-3 border-t border-[var(--vp-border)]" />
          <NavLink
            to="/dashboard/integrations"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium',
                isActive ? 'bg-[var(--vp-selected-bg)] text-[var(--vp-primary)]' : 'text-[var(--vp-text-secondary)] hover:bg-[var(--vp-surface-alt)]',
              )
            }
          >
            <Plug className="h-4 w-4" /> Integrations
          </NavLink>
          <NavLink
            to="/dashboard/settings"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium',
                isActive ? 'bg-[var(--vp-selected-bg)] text-[var(--vp-primary)]' : 'text-[var(--vp-text-secondary)] hover:bg-[var(--vp-surface-alt)]',
              )
            }
          >
            <SettingsIcon className="h-4 w-4" /> Settings
          </NavLink>
        </nav>
        <button
          onClick={() => {
            logout();
            navigate('/');
          }}
          className="mx-2 mb-1 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-[var(--vp-text-secondary)] hover:bg-[var(--vp-surface-alt)]"
        >
          <X className="h-4 w-4" /> Log out
        </button>
      </aside>

      {/* Topbar */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-[var(--vp-border)] bg-[var(--vp-surface)] px-4 lg:px-8 lg:pl-[17rem]">
        <div className="flex items-center gap-2 text-sm text-[var(--vp-text-muted)]">
          <span className="lg:hidden">
            <Logo context="dashboard" showWord={false} size={28} />
          </span>
          <ChevronRight className="hidden h-4 w-4 lg:block" />
          <span className="font-semibold capitalize text-[var(--vp-text-primary)]">
            {crumbs[crumbs.length - 1] ?? 'dashboard'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.dispatchEvent(new Event(OPEN_COMMAND_PALETTE))}
            className="hidden items-center gap-2 rounded-lg border border-[var(--vp-border)] px-3 py-2 text-sm text-[var(--vp-text-muted)] hover:bg-[var(--vp-surface-alt)] sm:flex"
            title="Search (⌘K)"
          >
            <Search className="h-4 w-4" />
            <span>Search…</span>
            <kbd className="ml-3 rounded bg-[var(--vp-surface-alt)] px-1.5 py-0.5 text-[10px] font-semibold">⌘K</kbd>
          </button>
          <PlanBadge plan={state.user?.plan ?? 'starter'} />
          <ThemeToggle />
          <Link
            to="/dashboard/notifications"
            className="relative rounded-lg border border-[var(--vp-border)] p-2 text-[var(--vp-text-secondary)] hover:bg-[var(--vp-surface-alt)]"
          >
            <Bell className="h-4.5 w-4.5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" />
          </Link>
          <Link
            to="/dashboard/profile"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-[12px] font-bold text-white"
            title={state.user?.name}
          >
            {initials}
          </Link>
        </div>
      </header>

      {/* Mobile bottom-ish nav */}
      <div className="flex gap-1 overflow-x-auto border-b border-[var(--vp-border)] bg-[var(--vp-surface)] px-3 py-2 lg:hidden">
        {dashNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end ?? false}
            className={({ isActive }) =>
              cn(
                'whitespace-nowrap rounded-lg px-3 py-1.5 text-[13px] font-medium',
                isActive ? 'bg-[var(--vp-selected-bg)] text-[var(--vp-primary)]' : 'text-[var(--vp-text-secondary)]',
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>

      <main className="route-enter px-4 py-7 lg:px-8 lg:pl-[17rem]">
        <Outlet />
      </main>
      <CommandPalette />
    </div>
  );
}

export function ProfilePillLink() {
  return (
    <Link to="/dashboard/profile" className="inline-flex items-center gap-1 text-sm text-[var(--vp-primary)]">
      <UserIcon className="h-4 w-4" /> Profile
    </Link>
  );
}
