// ============================================================
// VectorPilot — Domain Types (zero `any`)
// ============================================================

export type ModelId = 'gpt-4o' | 'claude-sonnet' | 'gemini-1.5' | 'custom';

export interface UsagePoint {
  id: string;
  at: string; // ISO-8601
  model: ModelId;
  tokens: number;
  costUsd: number; // 4-decimal per-event cost
}

export interface UsageTotals {
  todayUsd: number;
  monthUsd: number;
  limitUsd: number;
  tokensToday: number;
  deltaPct: number | null;
}

export interface LiveCostState {
  todayUsd: number;
  lastEventAt: string | null;
  pulsing: boolean;
}

export interface ModelSlice {
  model: ModelId;
  label: string;
  pct: number;
  usd: number;
}

// ---- API keys ----
export type KeyScope = 'chat' | 'usage' | 'admin';
export type KeyStatus = 'active' | 'revoked';

export interface ApiKey {
  id: string;
  label: string;
  prefix: string;
  last4: string;
  scope: KeyScope;
  status: KeyStatus;
  createdAt: string;
  lastUsedAt: string | null;
}

export interface ApiKeyCreate {
  label: string;
  scope: KeyScope;
}

export interface FreshKey {
  id: string;
  fullKey: string;
}

// ---- Chat ----
export interface ChatTurn {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  at: string;
}
export interface ChatSession {
  id: string;
  title: string;
  updatedAt: string;
  turns: ChatTurn[];
}

// ---- Pricing ----
export type Billing = 'monthly' | 'annual';
export type PlanId = 'starter' | 'pro' | 'team';

export interface Plan {
  id: PlanId;
  name: string;
  monthlyUsd: number;
  annualUsd: number;
  highlight: boolean;
  cta: string;
  features: string[];
  excluded: string[];
}

export interface FeatureCardItem {
  id: string;
  icon: 'bolt' | 'shield' | 'globe' | 'chart' | 'history' | 'feed';
  title: string;
  body: string;
}

export interface LogoItem {
  id: string;
  label: string;
}

export interface TestimonialItem {
  id: string;
  quote: string;
  author: string;
  role: string;
}

// ---- Waitlist ----
export interface WaitlistState {
  email: string | null;
  joinedAt: string | null;
  confirmed: boolean;
}

// ---- User ----
export type UserRole = 'member' | 'owner';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  plan: PlanId;
  role: UserRole;
}

export interface Credentials {
  email: string;
  password: string;
}

export interface Registration {
  name: string;
  email: string;
  password: string;
  plan: PlanId;
}

export type AuthStatus = 'authenticated' | 'anonymous';

// ---- Settings ----
export type SessionTimeout = '15m' | '30m' | '1h' | '4h' | '24h';

export interface TrustedDevice {
  id: string;
  name: string;
  lastSeen: string;
  current: boolean;
}
export interface ActiveSession {
  id: string;
  device: string;
  location: string;
  ip: string;
  startedAt: string;
  current: boolean;
}
export interface Invoice {
  id: string;
  date: string;
  amountUsd: number;
  status: 'paid' | 'pending' | 'failed';
  downloadUrl: string;
}
export interface NotificationPreferences {
  email: boolean;
  browser: boolean;
  budgetAlerts: boolean;
  usageReports: boolean;
  securityAlerts: boolean;
  productUpdates: boolean;
  teamActivity: boolean;
}

// ---- Toasts ----
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string | undefined;
  duration?: number | undefined;
}

export type Theme = 'light' | 'dark';
