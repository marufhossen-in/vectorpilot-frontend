import type {
  ApiKey,
  ChatSession,
  ChatTurn,
  FeatureCardItem,
  LogoItem,
  ModelId,
  Plan,
  TestimonialItem,
  UsagePoint,
} from '@/types';

// ---- deterministic PRNG so the seed data is stable across reloads ----
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MODELS: { model: ModelId; weight: number; per1k: number }[] = [
  { model: 'gpt-4o', weight: 0.42, per1k: 0.005 },
  { model: 'claude-sonnet', weight: 0.31, per1k: 0.0085 },
  { model: 'gemini-1.5', weight: 0.19, per1k: 0.0035 },
  { model: 'custom', weight: 0.08, per1k: 0.012 },
];

const MODEL_LABELS: Record<ModelId, string> = {
  'gpt-4o': 'GPT-4o',
  'claude-sonnet': 'Claude Sonnet',
  'gemini-1.5': 'Gemini 1.5',
  custom: 'Custom',
};

export function modelLabel(m: ModelId): string {
  return MODEL_LABELS[m];
}

function pickModel(r: () => number): ModelId {
  const roll = r();
  let acc = 0;
  for (const m of MODELS) {
    acc += m.weight;
    if (roll <= acc) return m.model;
  }
  return 'gpt-4o';
}

/** Build a 30-day window of hourly usage events. */
export function buildUsageSeed(): UsagePoint[] {
  const rand = mulberry32(20260822);
  const points: UsagePoint[] = [];
  const now = Date.now();
  for (let h = 0; h < 24 * 30; h += 1) {
    const at = new Date(now - (24 * 30 - h) * 3600 * 1000);
    const events = 1 + Math.floor(rand() * 4);
    for (let e = 0; e < events; e += 1) {
      const model = pickModel(rand);
      const meta = MODELS.find((m) => m.model === model)!;
      const tokens = 200 + Math.floor(rand() * 4800);
      const costUsd = Math.round((tokens / 1000) * meta.per1k * 10000) / 10000;
      points.push({
        id: `seed-${h}-${e}`,
        at: at.toISOString(),
        model,
        tokens,
        costUsd,
      });
    }
  }
  return points;
}

/** A single fresh event for the live simulator. */
export function nextMockUsageEvent(index: number): UsagePoint {
  const rand = mulberry32(Date.now() + index * 97);
  const model = pickModel(rand);
  const meta = MODELS.find((m) => m.model === model)!;
  const tokens = 180 + Math.floor(rand() * 5200);
  const costUsd = Math.round((tokens / 1000) * meta.per1k * 10000) / 10000;
  return {
    id: `live-${Date.now()}-${index}`,
    at: new Date().toISOString(),
    model,
    tokens,
    costUsd,
  };
}

// ---- API keys ----
export const mockKeys: ApiKey[] = [
  {
    id: 'k-prod-01',
    label: 'Production',
    prefix: 'sk-aico',
    last4: '3f9a',
    scope: 'admin',
    status: 'active',
    createdAt: '2026-06-12T09:20:00.000Z',
    lastUsedAt: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
  },
  {
    id: 'k-ci-02',
    label: 'CI runner',
    prefix: 'sk-aico',
    last4: 'b21e',
    scope: 'usage',
    status: 'active',
    createdAt: '2026-07-03T14:02:00.000Z',
    lastUsedAt: new Date(Date.now() - 1000 * 60 * 60 * 9).toISOString(),
  },
  {
    id: 'k-old-03',
    label: 'Legacy webhook',
    prefix: 'sk-aico',
    last4: '9c4d',
    scope: 'chat',
    status: 'revoked',
    createdAt: '2026-04-21T11:45:00.000Z',
    lastUsedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
  },
];

// ---- Chat demo script ----
export const mockChatDemo: ChatTurn[] = [
  { id: 'd1', role: 'user', text: 'Summarize last week\u2019s support tickets and flag the urgent ones.', at: '2026-08-22T09:00:00.000Z' },
  { id: 'd2', role: 'assistant', text: '47 tickets last week \u2014 6 marked urgent. The top cluster is billing webhook timeouts. Want me to draft an incident report?', at: '2026-08-22T09:00:02.000Z' },
  { id: 'd3', role: 'user', text: 'Yes, and estimate the cost impact of those failures.', at: '2026-08-22T09:00:05.000Z' },
  { id: 'd4', role: 'assistant', text: 'Drafted. Estimated impact: $4,820 in delayed renewals. I can loop in the payments on-call engineer \u2014 say the word.', at: '2026-08-22T09:00:07.000Z' },
  { id: 'd5', role: 'user', text: 'Go. Also schedule a model cost budget alert at 80%.', at: '2026-08-22T09:00:10.000Z' },
  { id: 'd6', role: 'assistant', text: 'Done \u2014 alert armed at 80% of $50. Engineer notified. Budget dashboard updated live.', at: '2026-08-22T09:00:12.000Z' },
];

// ---- Chat sessions ----
export const mockSessions: ChatSession[] = [
  {
    id: 's-01',
    title: 'Q3 churn analysis',
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    turns: [
      { id: 's1-1', role: 'user', text: 'Pull churn data for Q3 and segment by plan.', at: '2026-08-22T08:10:00.000Z' },
      { id: 's1-2', role: 'assistant', text: 'Q3 churn: 4.2% overall. Team plan churn spiked to 7.1%, driven by 3 enterprise accounts citing pricing. Want a save-play list?', at: '2026-08-22T08:10:03.000Z' },
      { id: 's1-3', role: 'user', text: 'Yes, prioritise by ARR at risk.', at: '2026-08-22T08:11:00.000Z' },
      { id: 's1-4', role: 'assistant', text: 'Generated 11-account save list, $86k ARR at risk. Top 3 get exec outreach templates.', at: '2026-08-22T08:11:05.000Z' },
    ],
  },
  {
    id: 's-02',
    title: 'API cost optimisation',
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    turns: [
      { id: 's2-1', role: 'user', text: 'Which model is cheapest per quality-adjusted token?', at: '2026-08-22T03:00:00.000Z' },
      { id: 's2-2', role: 'assistant', text: 'For summarization, Gemini 1.5 is 30% cheaper at parity. Routing summaries there could save ~$610/mo.', at: '2026-08-22T03:00:04.000Z' },
      { id: 's2-3', role: 'user', text: 'Implement the routing rule.', at: '2026-08-22T03:02:00.000Z' },
      { id: 's2-4', role: 'assistant', text: 'Routing rule live. I\u2019ll track savings and report in 7 days.', at: '2026-08-22T03:02:06.000Z' },
    ],
  },
  {
    id: 's-03',
    title: 'Onboarding doc rewrite',
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    turns: [
      { id: 's3-1', role: 'user', text: 'Rewrite the quickstart for a non-technical founder.', at: '2026-08-21T10:00:00.000Z' },
      { id: 's3-2', role: 'assistant', text: 'Rewritten in plain language with 4 steps and zero jargon. Time-to-first-key dropped from 9 min to ~2 min in a dry run.', at: '2026-08-21T10:00:05.000Z' },
    ],
  },
];

// ---- Pricing ----
export const mockPlans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    monthlyUsd: 0,
    annualUsd: 0,
    highlight: false,
    cta: 'Start free',
    features: ['1 workspace', '5,000 AI calls / mo', 'Live cost dashboard', 'Community support', '7-day history'],
    excluded: ['API key management', 'Usage analytics export', 'Priority routing'],
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyUsd: 39,
    annualUsd: 31,
    highlight: true,
    cta: 'Start Pro trial',
    features: ['Everything in Starter', '150,000 AI calls / mo', 'API key management', 'Usage analytics + export', 'Priority model routing', '30-day history', 'Email support'],
    excluded: ['SSO & SAML', 'Team audit logs'],
  },
  {
    id: 'team',
    name: 'Team',
    monthlyUsd: 99,
    annualUsd: 79,
    highlight: false,
    cta: 'Talk to sales',
    features: ['Everything in Pro', '1,000,000 AI calls / mo', 'Unlimited team seats', 'SSO & SAML', 'Team audit logs', 'Webhooks & integrations', 'Dedicated success manager', '99.9% SLA'],
    excluded: [],
  },
];

// ---- Features ----
export const mockFeatures: FeatureCardItem[] = [
  { id: 'f1', icon: 'bolt', title: 'AI Copilot', body: 'A context-aware copilot that drafts, routes, and resolves work across your tools \u2014 grounded in your live data.' },
  { id: 'f2', icon: 'chart', title: 'Live Tracking', body: 'Real-time AI spend and usage streamed as events. See every token and every cent the instant it happens.' },
  { id: 'f3', icon: 'shield', title: 'Key Management', body: 'Create, scope, and revoke API keys with reveal-once security. Full keys never touch storage.' },
  { id: 'f4', icon: 'globe', title: 'Usage Analytics', body: 'Model-split donuts and trend charts that explain where your budget goes and where to save.' },
  { id: 'f5', icon: 'history', title: 'Session History', body: 'Every copilot session archived with full transcripts, searchable and exportable.' },
  { id: 'f6', icon: 'feed', title: 'Real-time Feed', body: 'A unified activity feed of cost events, key changes, and alerts \u2014 synced across every open tab.' },
];

// ---- Logos (text marquees) ----
export const mockLogos: LogoItem[] = [
  { id: 'l1', label: 'Northwind' },
  { id: 'l2', label: 'Lumen Labs' },
  { id: 'l3', label: 'Quantix' },
  { id: 'l4', label: 'Hyperdrive' },
  { id: 'l5', label: 'Meridian' },
  { id: 'l6', label: 'Cobalt' },
  { id: 'l7', label: 'Vertex AI' },
  { id: 'l8', label: 'Foundry' },
];

// ---- Testimonials ----
export const mockTestimonials: TestimonialItem[] = [
  { id: 't1', quote: 'VectorPilot cut our model spend by 31% in the first month \u2014 we finally saw where every dollar went.', author: 'Maya Chen', role: 'VP Engineering, Northwind' },
  { id: 't2', quote: 'The live cost ticker is addictive. Our team treats AI spend like a live metric now, not a surprise invoice.', author: 'Diego Alvarez', role: 'CTO, Quantix' },
  { id: 't3', quote: 'Reveal-once keys gave our security team exactly what they wanted. No leaked secrets, full control.', author: 'Priya Nair', role: 'Head of Platform, Meridian' },
  { id: 't4', quote: 'We replaced three dashboards with one. The copilot routes work better than our on-call rota.', author: 'Tom Becker', role: 'Founder, Hyperdrive' },
];

// ---- Settings seed ----
export const seedNotifications = {
  email: true,
  browser: true,
  budgetAlerts: true,
  usageReports: true,
  securityAlerts: true,
  productUpdates: false,
  teamActivity: true,
};

export const seedActiveSessions = [
  { id: 'as1', device: 'MacBook Pro \u00b7 Chrome', location: 'Berlin, DE', ip: '203.0.113.42', startedAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(), current: true },
  { id: 'as2', device: 'iPhone 15 \u00b7 Safari', location: 'Berlin, DE', ip: '203.0.113.88', startedAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), current: false },
];

export const seedTrustedDevices = [
  { id: 'td1', name: 'Maya\u2019s MacBook Pro', lastSeen: new Date(Date.now() - 1000 * 60 * 8).toISOString(), current: true },
  { id: 'td2', name: 'Office iMac', lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(), current: false },
];

export const seedInvoices = [
  { id: 'inv-1042', date: '2026-08-01', amountUsd: 31, status: 'paid' as const, downloadUrl: '#' },
  { id: 'inv-1029', date: '2026-07-01', amountUsd: 31, status: 'paid' as const, downloadUrl: '#' },
  { id: 'inv-1015', date: '2026-06-01', amountUsd: 39, status: 'paid' as const, downloadUrl: '#' },
];

export const seedTeam = [
  { id: 'tm1', name: 'Maya Chen', email: 'maya@northwind.io', role: 'owner' as const, lastActive: 'now' },
  { id: 'tm2', name: 'Diego Alvarez', email: 'diego@northwind.io', role: 'member' as const, lastActive: '2h ago' },
  { id: 'tm3', name: 'Priya Nair', email: 'priya@northwind.io', role: 'member' as const, lastActive: '1d ago' },
];
