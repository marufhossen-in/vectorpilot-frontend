import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
  type Reducer,
} from 'react';

import { deriveTotals } from '@/lib/api';
import { buildUsageSeed } from '@/data/mock';
import type {
  ApiKey,
  AuthStatus,
  Billing,
  FreshKey,
  PlanId,
  SessionUser,
  Theme,
  Toast,
  UsagePoint,
  UsageTotals,
  WaitlistState,
} from '@/types';

// ============================================================
// Persisted reducer hook (localStorage + optional cross-tab sync)
// ============================================================
function usePersistedReducer<S, A>(
  reducer: Reducer<S, A>,
  key: string,
  initial: S,
  serialize: (s: S) => string,
  deserialize: (s: string) => S,
  crossTab = false,
): [S, React.Dispatch<A>] {
  const [state, dispatch] = useReducer(reducer, initial, (init) => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? deserialize(raw) : init;
    } catch {
      return init;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, serialize(state));
    } catch {
      /* storage unavailable — in-memory fallback */
    }
  }, [key, serialize, state]);

  useEffect(() => {
    if (!crossTab) return;
    function onStorage(e: StorageEvent) {
      if (e.key === key && e.newValue) {
        dispatch({ type: 'REPLACE_FROM_STORAGE', payload: e.newValue } as unknown as A);
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [crossTab, key]);

  return [state, dispatch];
}

// ============================================================
// Theme application (data-theme attribute on <html>)
// ============================================================
export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme);
}

// ============================================================
// AuthStore
// ============================================================
interface AuthState {
  user: SessionUser | null;
  status: AuthStatus;
  error: string | null;
}
type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; user: SessionUser }
  | { type: 'LOGIN_FAIL'; error: string }
  | { type: 'LOGOUT' }
  | { type: 'HYDRATE'; user: SessionUser }
  | { type: 'SET_PLAN'; plan: PlanId };

const authInitial: AuthState = { user: null, status: 'anonymous', error: null };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, error: null };
    case 'LOGIN_SUCCESS':
      return { user: action.user, status: 'authenticated', error: null };
    case 'LOGIN_FAIL':
      return { user: null, status: 'anonymous', error: action.error };
    case 'LOGOUT':
      return { user: null, status: 'anonymous', error: null };
    case 'HYDRATE':
      return { user: action.user, status: 'authenticated', error: null };
    case 'SET_PLAN':
      return state.user ? { ...state, user: { ...state.user, plan: action.plan } } : state;
    default:
      return state;
  }
}

function readSession(): SessionUser | null {
  try {
    const raw = localStorage.getItem('aico.session');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { user?: SessionUser };
    return parsed.user ?? null;
  } catch {
    return null;
  }
}

/** Module-level accessor used by route loaders (outside React context). */
export function getAuthStatus(): AuthStatus {
  return readSession() ? 'authenticated' : 'anonymous';
}

interface AuthContextValue {
  state: AuthState;
  login: (user: SessionUser) => void;
  logout: () => void;
  fail: (error: string) => void;
  start: () => void;
  upgrade: (plan: PlanId) => void;
}
const AuthContext = createContext<AuthContextValue | null>(null);

function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = usePersistedReducer(
    authReducer,
    'aico.session',
    authInitial,
    (s) => JSON.stringify({ user: s.user }),
    (raw) => {
      const parsed = JSON.parse(raw) as { user?: SessionUser };
      const user = parsed.user ?? null;
      const status: AuthStatus = user ? 'authenticated' : 'anonymous';
      return { user, status, error: null };
    },
  );
  const value = useMemo<AuthContextValue>(
    () => ({
      state,
      start: () => dispatch({ type: 'LOGIN_START' }),
      // Write synchronously so route loaders (which read localStorage) see the
      // session before the navigation they immediately trigger.
      login: (user) => {
        try {
          localStorage.setItem('aico.session', JSON.stringify({ user }));
        } catch {
          /* ignore */
        }
        dispatch({ type: 'LOGIN_SUCCESS', user });
      },
      fail: (error) => dispatch({ type: 'LOGIN_FAIL', error }),
      logout: () => {
        try {
          localStorage.removeItem('aico.session');
        } catch {
          /* ignore */
        }
        dispatch({ type: 'LOGOUT' });
      },
      upgrade: (plan) => {
        try {
          if (state.user) {
            localStorage.setItem('aico.session', JSON.stringify({ user: { ...state.user, plan } }));
          }
        } catch {
          /* ignore */
        }
        dispatch({ type: 'SET_PLAN', plan });
      },
    }),
    [state],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AppProviders');
  return ctx;
}

// ============================================================
// UsageStore
// ============================================================
interface UsageState {
  points: UsagePoint[];
}
type UsageAction =
  | { type: 'ADD_EVENT'; point: UsagePoint }
  | { type: 'REPLACE_FROM_STORAGE'; payload: string };

function usageReducer(state: UsageState, action: UsageAction): UsageState {
  switch (action.type) {
    case 'ADD_EVENT':
      return { points: [...state.points.slice(-1439), action.point] };
    case 'REPLACE_FROM_STORAGE': {
      try {
        const parsed = JSON.parse(action.payload) as UsageState;
        return { points: Array.isArray(parsed.points) ? parsed.points.slice(-1440) : state.points };
      } catch {
        return state;
      }
    }
    default:
      return state;
  }
}

interface UsageContextValue {
  points: UsagePoint[];
  totals: UsageTotals;
  lastEventAt: string | null;
  dispatch: React.Dispatch<UsageAction>;
}
const UsageContext = createContext<UsageContextValue | null>(null);

function UsageProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = usePersistedReducer(
    usageReducer,
    'aico.usage',
    { points: buildUsageSeed().slice(-1440) },
    (s) => JSON.stringify({ points: s.points.slice(-1440) }),
    (raw) => {
      const parsed = JSON.parse(raw) as UsageState;
      return { points: Array.isArray(parsed.points) ? parsed.points.slice(-1440) : [] };
    },
    true,
  );
  const totals = useMemo(() => deriveTotals(state.points), [state.points]);
  const lastEventAt = state.points.at(-1)?.at ?? null;
  const value = useMemo<UsageContextValue>(
    () => ({ points: state.points, totals, lastEventAt, dispatch }),
    [state.points, totals, lastEventAt],
  );
  return <UsageContext.Provider value={value}>{children}</UsageContext.Provider>;
}

export function useUsage(): UsageContextValue {
  const ctx = useContext(UsageContext);
  if (!ctx) throw new Error('useUsage must be used within AppProviders');
  return ctx;
}

// ============================================================
// KeyStore  (FreshKey is memory-only — serializer strips it)
// ============================================================
interface KeyState {
  keys: ApiKey[];
  fresh: FreshKey | null;
}
type KeyAction =
  | { type: 'CREATE'; created: ApiKey; fresh: FreshKey }
  | { type: 'REVOKE'; keyId: string }
  | { type: 'DISMISS_FRESH' }
  | { type: 'REPLACE_FROM_STORAGE'; payload: string };

function keyReducer(state: KeyState, action: KeyAction): KeyState {
  switch (action.type) {
    case 'CREATE':
      return { keys: [action.created, ...state.keys], fresh: action.fresh };
    case 'REVOKE':
      return {
        keys: state.keys.map((k) => (k.id === action.keyId ? { ...k, status: 'revoked' } : k)),
        fresh: state.fresh,
      };
    case 'DISMISS_FRESH':
      return { ...state, fresh: null };
    case 'REPLACE_FROM_STORAGE': {
      try {
        const parsed = JSON.parse(action.payload) as { keys?: ApiKey[] };
        // fresh is NEVER restored from storage by design
        return { keys: Array.isArray(parsed.keys) ? parsed.keys : state.keys, fresh: null };
      } catch {
        return state;
      }
    }
    default:
      return state;
  }
}

interface KeyContextValue {
  keys: ApiKey[];
  fresh: FreshKey | null;
  create: (created: ApiKey, fresh: FreshKey) => void;
  revoke: (keyId: string) => void;
  dismissFresh: () => void;
}
const KeyContext = createContext<KeyContextValue | null>(null);

function KeyProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = usePersistedReducer(
    keyReducer,
    'aico.keys',
    { keys: [], fresh: null },
    // Critical: `fresh` is structurally stripped before reaching localStorage.
    (s) => JSON.stringify({ keys: s.keys }),
    (raw) => {
      const parsed = JSON.parse(raw) as { keys?: ApiKey[] };
      return { keys: Array.isArray(parsed.keys) ? parsed.keys : [], fresh: null };
    },
    true,
  );
  const value = useMemo<KeyContextValue>(
    () => ({
      keys: state.keys,
      fresh: state.fresh,
      create: (created, fresh) => dispatch({ type: 'CREATE', created, fresh }),
      revoke: (keyId) => dispatch({ type: 'REVOKE', keyId }),
      dismissFresh: () => dispatch({ type: 'DISMISS_FRESH' }),
    }),
    [state.keys, state.fresh],
  );
  return <KeyContext.Provider value={value}>{children}</KeyContext.Provider>;
}

export function useKeys(): KeyContextValue {
  const ctx = useContext(KeyContext);
  if (!ctx) throw new Error('useKeys must be used within AppProviders');
  return ctx;
}

// ============================================================
// WaitlistStore
// ============================================================
type WaitlistAction =
  | { type: 'JOIN'; email: string }
  | { type: 'CONFIRMED' }
  | { type: 'REPLACE_FROM_STORAGE'; payload: string };

function waitlistReducer(state: WaitlistState, action: WaitlistAction): WaitlistState {
  switch (action.type) {
    case 'JOIN':
      return { email: action.email, joinedAt: new Date().toISOString(), confirmed: false };
    case 'CONFIRMED':
      return { ...state, confirmed: true };
    case 'REPLACE_FROM_STORAGE': {
      try {
        return JSON.parse(action.payload) as WaitlistState;
      } catch {
        return state;
      }
    }
    default:
      return state;
  }
}

interface WaitlistContextValue {
  state: WaitlistState;
  join: (email: string) => void;
  confirm: () => void;
}
const WaitlistContext = createContext<WaitlistContextValue | null>(null);

function WaitlistProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = usePersistedReducer(
    waitlistReducer,
    'aico.waitlist',
    { email: null, joinedAt: null, confirmed: false },
    JSON.stringify,
    (raw) => JSON.parse(raw) as WaitlistState,
  );
  const value = useMemo<WaitlistContextValue>(
    () => ({
      state,
      join: (email) => dispatch({ type: 'JOIN', email }),
      confirm: () => dispatch({ type: 'CONFIRMED' }),
    }),
    [state],
  );
  return <WaitlistContext.Provider value={value}>{children}</WaitlistContext.Provider>;
}

export function useWaitlist(): WaitlistContextValue {
  const ctx = useContext(WaitlistContext);
  if (!ctx) throw new Error('useWaitlist must be used within AppProviders');
  return ctx;
}

// ============================================================
// UIStore  (theme · toasts · billing preference)
// ============================================================
interface UIState {
  theme: Theme;
  billing: Billing;
  toasts: Toast[];
}
type UIAction =
  | { type: 'SET_THEME'; theme: Theme }
  | { type: 'SET_BILLING'; billing: Billing }
  | { type: 'TOAST_ADD'; toast: Toast }
  | { type: 'TOAST_REMOVE'; id: string };

function uiReducer(state: UIState, action: UIAction): UIState {
  switch (action.type) {
    case 'SET_THEME':
      return { ...state, theme: action.theme };
    case 'SET_BILLING':
      return { ...state, billing: action.billing };
    case 'TOAST_ADD':
      return { ...state, toasts: [...state.toasts, action.toast] };
    case 'TOAST_REMOVE':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) };
    default:
      return state;
  }
}

interface UIContextValue {
  theme: Theme;
  billing: Billing;
  toasts: Toast[];
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  setBilling: (b: Billing) => void;
  toast: (t: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
}
const UIContext = createContext<UIContextValue | null>(null);

function UIProvider({ children }: { children: ReactNode }) {
  const initialTheme: Theme =
    (typeof document !== 'undefined' &&
      (document.documentElement.getAttribute('data-theme') as Theme | null)) ||
    'light';
  const [state, dispatch] = usePersistedReducer(
    uiReducer,
    'aico.ui',
    { theme: initialTheme, billing: 'annual', toasts: [] },
    (s) => JSON.stringify({ theme: s.theme, billing: s.billing }),
    (raw) => {
      const parsed = JSON.parse(raw) as { theme?: Theme; billing?: Billing };
      return { theme: parsed.theme ?? 'light', billing: parsed.billing ?? 'annual', toasts: [] };
    },
  );

  useEffect(() => {
    applyTheme(state.theme);
  }, [state.theme]);

  const toast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    dispatch({ type: 'TOAST_ADD', toast: { ...t, id } });
    const duration = t.duration ?? 4000;
    window.setTimeout(() => dispatch({ type: 'TOAST_REMOVE', id }), duration);
  }, []);

  const value = useMemo<UIContextValue>(
    () => ({
      theme: state.theme,
      billing: state.billing,
      toasts: state.toasts,
      setTheme: (theme) => dispatch({ type: 'SET_THEME', theme }),
      toggleTheme: () => dispatch({ type: 'SET_THEME', theme: state.theme === 'dark' ? 'light' : 'dark' }),
      setBilling: (billing) => dispatch({ type: 'SET_BILLING', billing }),
      toast,
      dismissToast: (id) => dispatch({ type: 'TOAST_REMOVE', id }),
    }),
    [state.theme, state.billing, state.toasts, toast],
  );
  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI(): UIContextValue {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be used within AppProviders');
  return ctx;
}

// ============================================================
// Combined provider + helper builders
// ============================================================
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <UIProvider>
        <UsageProvider>
          <KeyProvider>
            <WaitlistProvider>{children}</WaitlistProvider>
          </KeyProvider>
        </UsageProvider>
      </UIProvider>
    </AuthProvider>
  );
}

export function makeUser(name: string, email: string, plan: PlanId): SessionUser {
  return { id: `u-${Date.now().toString(36)}`, name, email, plan, role: plan === 'team' ? 'owner' : 'member' };
}
