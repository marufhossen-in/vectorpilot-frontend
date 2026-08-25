import {
  buildUsageSeed,
  mockChatDemo,
  mockKeys,
  mockSessions,
} from '@/data/mock';
import type { ApiKey, ApiKeyCreate, ChatSession, ChatTurn, FreshKey, UsagePoint, UsageTotals } from '@/types';
import { mockFullKey, round4 } from '@/lib/utils';

const BASE = import.meta.env.VITE_API_URL as string | undefined;

/** Live request when a backend is configured; otherwise falls back to mock data. */
export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!BASE) return mockFetch<T>(path, init);
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return (await res.json()) as T;
}

let cachedSeed: UsagePoint[] | null = null;
function seed(): UsagePoint[] {
  if (!cachedSeed) cachedSeed = buildUsageSeed();
  return cachedSeed;
}

/** Derive live totals from a points array. */
export function deriveTotals(points: UsagePoint[]): UsageTotals {
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const startYesterday = startToday - 24 * 3600 * 1000;

  let todayUsd = 0;
  let tokensToday = 0;
  let monthUsd = 0;
  let yesterdayUsd = 0;

  for (const p of points) {
    const t = new Date(p.at).getTime();
    if (t >= startMonth) monthUsd += p.costUsd;
    if (t >= startToday) {
      todayUsd += p.costUsd;
      tokensToday += p.tokens;
    } else if (t >= startYesterday) {
      yesterdayUsd += p.costUsd;
    }
  }

  const deltaPct = yesterdayUsd > 0 ? round4(((todayUsd - yesterdayUsd) / yesterdayUsd) * 100) : null;
  return {
    todayUsd: round4(todayUsd),
    monthUsd: round4(monthUsd),
    limitUsd: 50,
    tokensToday,
    deltaPct,
  };
}

async function mockFetch<T>(path: string, _init?: RequestInit): Promise<T> {
  await new Promise((r) => setTimeout(r, 110));
  if (path.startsWith('/usage/totals')) return deriveTotals(seed()) as unknown as T;
  if (path.startsWith('/usage')) return seed() as unknown as T;
  if (path.startsWith('/keys')) {
    if (_init?.method === 'POST') {
      const input = JSON.parse((_init.body as string) ?? '{}') as ApiKeyCreate;
      const fullKey = mockFullKey();
      const created: ApiKey = {
        id: `k-${Math.random().toString(36).slice(2, 8)}`,
        label: input.label || 'Untitled',
        prefix: 'sk-aico',
        last4: fullKey.replace(/-/g, '').slice(-4),
        scope: input.scope,
        status: 'active',
        createdAt: new Date().toISOString(),
        lastUsedAt: null,
      };
      const fresh: FreshKey = { id: created.id, fullKey };
      return { ...created, ...fresh } as unknown as T;
    }
    return mockKeys as unknown as T;
  }
  if (path.startsWith('/chat/demo')) return mockChatDemo as unknown as T;
  if (path.startsWith('/chat/sessions')) return mockSessions as unknown as T;
  if (path.startsWith('/waitlist')) return { confirmed: true, position: 847 } as unknown as T;
  throw new Error(`Mock: no handler for ${path}`);
}

export const usageService = {
  list: () => request<UsagePoint[]>('/usage'),
  totals: () => request<UsageTotals>('/usage/totals'),
};

export const keyService = {
  list: () => request<ApiKey[]>('/keys'),
  create: (input: ApiKeyCreate) =>
    request<ApiKey & FreshKey>('/keys', { method: 'POST', body: JSON.stringify(input) }),
  revoke: (id: string) => request<ApiKey>(`/keys/${id}/revoke`, { method: 'POST' }),
};

export const chatService = {
  demoScript: () => request<ChatTurn[]>('/chat/demo'),
  sessions: () => request<ChatSession[]>('/chat/sessions'),
};

export const waitlistService = {
  join: (email: string) =>
    request<{ confirmed: boolean; position: number }>('/waitlist', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
};

export type { ChatSession };
