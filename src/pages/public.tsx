import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, LifeBuoy, Search, ShieldCheck, Target, Telescope } from 'lucide-react';

import featuresImg from '@/assets/marketing/features.jpg';
import aboutImg from '@/assets/marketing/about.jpg';
import helpImg from '@/assets/marketing/help.jpg';
import { mockFeatures } from '@/data/mock';
import { cn } from '@/lib/utils';
import { Reveal } from '@/hooks';
import { Badge, Button, EmptyState } from '@/components/ui';
import { PricingSection, WaitlistBand } from '@/features/landing';

// ---------------- Features page ----------------
export function FeaturesPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-[var(--vp-border)]">
        <div className="absolute inset-0 -z-10 aurora opacity-80" />
        <div className="mx-auto max-w-4xl px-5 pt-20 pb-2 text-center">
          <Badge tone="cyan">Features</Badge>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">Everything your AI operation needs</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[var(--vp-text-secondary)]">
            Six capabilities that turn chaotic model usage into a <span className="hl">controlled, observable, secure</span> system.
          </p>
        </div>
        <div className="relative mx-auto mt-8 max-w-4xl px-5 pb-16">
          <div className="img-glow relative overflow-hidden rounded-3xl border border-[var(--vp-border)]">
            <img
              src={featuresImg}
              alt="Abstract AI concept with a glowing brain integrated with circuitry"
              className="breathe h-[240px] w-full object-cover object-center sm:h-[440px]"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--vp-bg)] via-[var(--vp-bg)]/15 to-transparent" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-6 px-5 py-16">
        {mockFeatures.map((f, i) => (
          <Reveal key={f.id} scroll>
            <div
              className={cn(
                'flex flex-col gap-6 rounded-2xl border border-[var(--vp-border)] bg-[var(--vp-surface)] p-7 md:flex-row md:items-center',
                i % 2 === 1 && 'md:flex-row-reverse',
              )}
            >
              <div className="flex-1">
                <Badge tone="indigo">{String(i + 1).padStart(2, '0')}</Badge>
                <h2 className="mt-3 text-2xl font-bold">{f.title}</h2>
                <p className="mt-2 text-[var(--vp-text-muted)]">{f.body}</p>
              </div>
              <div className="relative flex h-40 flex-1 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-[var(--vp-selected-bg)] to-[var(--vp-surface-alt)]">
                <div className="absolute inset-0 grid-bg opacity-40" />
                <span className="relative font-mono text-5xl font-extrabold text-[var(--vp-primary)]/30">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
            </div>
          </Reveal>
        ))}
      </section>
      <PricingSection compact />
    </>
  );
}

// ---------------- About page ----------------
const team = [
  ['Maya Chen', 'Founder & CEO'],
  ['Diego Alvarez', 'CTO'],
  ['Priya Nair', 'Head of Platform'],
  ['Tom Becker', 'Design Lead'],
];

export function AboutPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-[var(--vp-border)]">
        <div className="absolute inset-0 -z-10 aurora opacity-80" />
        <div className="mx-auto max-w-4xl px-5 pt-20 pb-2 text-center">
          <Badge tone="gold">About</Badge>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">Make AI spend legible</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[var(--vp-text-secondary)]">
            VectorPilot was born from a single frustration: nobody could tell what their AI was actually costing them until the invoice arrived.
          </p>
        </div>
        <div className="relative mx-auto mt-8 max-w-4xl px-5 pb-16">
          <div className="img-glow relative overflow-hidden rounded-3xl border border-[var(--vp-border)]">
            <img
              src={aboutImg}
              alt="Two senior professionals discussing architecture diagrams at a standing desk"
              className="breathe h-[220px] w-full object-cover object-center sm:h-[400px]"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--vp-bg)]/70 via-transparent to-transparent" />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-5 py-16 md:grid-cols-3">
        {[
          { icon: Target, t: 'Mission', b: 'Give every team a live, honest view of their AI usage and spend — down to the token.' },
          { icon: Telescope, t: 'Vision', b: 'A world where AI cost is a first-class metric, observed in real time, not retroactively.' },
          { icon: ShieldCheck, t: 'Philosophy', b: 'Security by default. Secrets should never persist. Control should never be an afterthought.' },
        ].map((c) => (
          <Reveal key={c.t} scroll>
            <div className="h-full rounded-2xl border border-[var(--vp-border)] bg-[var(--vp-surface)] p-7">
              <c.icon className="h-7 w-7 text-[var(--vp-primary)]" />
              <h2 className="mt-4 text-xl font-bold">{c.t}</h2>
              <p className="mt-2 text-[var(--vp-text-muted)]">{c.b}</p>
            </div>
          </Reveal>
        ))}
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12">
        <h2 className="text-center text-3xl font-bold tracking-tight">The team</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {team.map(([name, role]) => (
            <div key={name} className="rounded-2xl border border-[var(--vp-border)] bg-[var(--vp-surface)] p-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xl font-bold text-white">
                {name.split(' ').map((n) => n[0]).join('')}
              </div>
              <p className="mt-3 font-bold">{name}</p>
              <p className="text-sm text-[var(--vp-text-muted)]">{role}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

// ---------------- Help page ----------------
const FAQ = [
  { q: 'How does the live cost ticker work?', a: 'Every AI request dispatches an ADD_EVENT. In mock mode a simulator fires every 4 seconds; with a backend, your WebSocket dispatches the identical action. The ticker never changes.' },
  { q: 'Are my API keys stored anywhere?', a: 'Only masked keys (sk-aico-••••last4) are persisted. The full key exists in memory for the seconds between creation and copy, then is permanently unrecoverable.' },
  { q: 'Can I switch billing from monthly to annual?', a: 'Yes — the billing toggle lives in shared UI state, so the home pricing section and the /pricing page always agree.' },
  { q: 'Does VectorPilot process payments?', a: 'No. This is a frontend demo. The /payment screen is a premium UI mock with no processing logic.' },
  { q: 'How do I integrate my own backend?', a: 'Set VITE_API_URL. The typed request() layer routes to your API; zero other code changes are required.' },
  { q: 'Is there a free plan?', a: 'Yes — Starter is free forever with 5,000 AI calls per month and the live cost dashboard.' },
];

function Accordion() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<string | null>(FAQ[0].q);
  const filtered = useMemo(
    () => FAQ.filter((f) => (f.q + f.a).toLowerCase().includes(query.toLowerCase())),
    [query],
  );
  return (
    <div>
      <div className="relative mx-auto mb-8 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--vp-text-muted)]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the docs…"
          className="h-11 w-full rounded-lg border border-[var(--vp-border-strong)] bg-[var(--vp-surface)] pl-10 pr-4 text-sm outline-none focus:border-[var(--vp-border-active)] focus:ring-2 focus:ring-[var(--vp-ring)]"
        />
      </div>
      {filtered.length === 0 ? (
        <EmptyState title="No results" hint="Try a different search term." />
      ) : (
        <div className="mx-auto max-w-3xl divide-y divide-[var(--vp-border)] overflow-hidden rounded-2xl border border-[var(--vp-border)] bg-[var(--vp-surface)]">
          {filtered.map((f) => (
            <div key={f.q}>
              <button
                onClick={() => setOpen(open === f.q ? null : f.q)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold hover:bg-[var(--vp-surface-alt)]"
              >
                {f.q}
                <ChevronDown className={cn('h-5 w-5 shrink-0 text-[var(--vp-text-muted)] transition-transform', open === f.q && 'rotate-180')} />
              </button>
              {open === f.q && <p className="route-enter px-5 pb-5 text-sm text-[var(--vp-text-muted)]">{f.a}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function HelpPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-[var(--vp-border)]">
        <div className="absolute inset-0 -z-10 aurora opacity-80" />
        <div className="mx-auto max-w-4xl px-5 pt-20 pb-2 text-center">
          <Badge tone="cyan">Help Center</Badge>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">How can we help?</h1>
        </div>
        <div className="relative mx-auto mt-8 max-w-4xl px-5 pb-16">
          <div className="img-glow relative overflow-hidden rounded-3xl border border-[var(--vp-border)]">
            <img
              src={helpImg}
              alt="Professional at a calm minimal workstation reviewing documentation"
              className="breathe h-[220px] w-full object-cover object-center sm:h-[360px]"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--vp-bg)]/70 via-transparent to-transparent" />
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-5 py-16">
        <Accordion />
      </section>
      <section className="mx-auto max-w-3xl px-5 pb-20">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-[var(--vp-border)] bg-[var(--vp-surface)] p-8 text-center sm:flex-row sm:text-left">
          <LifeBuoy className="h-9 w-9 text-[var(--vp-primary)]" />
          <div className="flex-1">
            <p className="text-lg font-bold">Still need a hand?</p>
            <p className="text-sm text-[var(--vp-text-muted)]">Our team replies within one business day.</p>
          </div>
          <Link to="/waitlist">
            <Button>
              Contact support <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}

// ---------------- Waitlist page ----------------
export function WaitlistPage() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-20">
      <div className="text-center">
        <Badge tone="indigo">Waitlist</Badge>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">Reserve your workspace</h1>
        <p className="mx-auto mt-3 max-w-lg text-[var(--vp-text-secondary)]">
          Drop your email below. We confirm instantly and remember you across sessions.
        </p>
      </div>
      <div className="mt-10">
        <WaitlistBand />
      </div>
    </section>
  );
}

// ---------------- 404 ----------------
export function NotFoundPage() {
  return (
    <section className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-5 text-center">
      <p className="font-mono text-7xl font-extrabold text-[var(--vp-primary)]">404</p>
      <h1 className="mt-4 text-2xl font-bold">This page drifted off course.</h1>
      <p className="mt-2 text-[var(--vp-text-muted)]">The route you’re looking for doesn’t exist.</p>
      <Link to="/" className="mt-6">
        <Button>
          Back to home <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>
    </section>
  );
}
