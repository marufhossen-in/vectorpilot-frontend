import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import {
  ArrowRight,
  BarChart3,
  Check,
  Globe,
  History,
  Radio,
  Shield,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react';

import heroImg from '@/assets/marketing/hero.jpg';
import ctaImg from '@/assets/marketing/cta.jpg';
import {
  mockChatDemo,
  mockFeatures,
  mockLogos,
  mockPlans,
  mockTestimonials,
} from '@/data/mock';
import { waitlistService } from '@/lib/api';
import { cn, pct } from '@/lib/utils';
import { useUI, useWaitlist } from '@/store/AppStores';
import { AnimatedNumber, Reveal, useTypewriter } from '@/hooks';
import { Badge, Button } from '@/components/ui';
import type { Billing, FeatureCardItem, Plan, PlanId } from '@/types';

const iconMap = { bolt: Zap, shield: Shield, globe: Globe, chart: BarChart3, history: History, feed: Radio } as const;

// ---------------- Typewriter headline ----------------
const PHRASES = ['tick up live.', 'drop by 31%.', 'stay under budget.'];
function TypewriterHeadline() {
  const typed = useTypewriter(PHRASES, 48);
  return (
    <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
      Watch your AI spend{' '}
      <span className="gradient-text">
        {typed}
        <span className="caret h-[0.9em] align-middle" />
      </span>
    </h1>
  );
}

// ---------------- Chat demo widget (self-contained, autoplay) ----------------
export function ChatDemoWidget() {
  const turns = mockChatDemo;
  const [count, setCount] = useState(0);
  const [paused, setPaused] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (paused) return;
    if (count >= turns.length) {
      const t = window.setTimeout(() => setCount(0), 2600);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setCount((c) => c + 1), count === 0 ? 700 : 1100);
    return () => window.clearTimeout(t);
  }, [count, paused, turns.length]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [count]);

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="overflow-hidden rounded-2xl border border-[var(--vp-border)] bg-[var(--vp-surface)] shadow-2xl shadow-indigo-500/10"
    >
      <div className="flex items-center justify-between border-b border-[var(--vp-border)] bg-[var(--vp-surface-alt)] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold">VectorPilot Copilot</span>
        </div>
        <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-500">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> live
        </span>
      </div>
      <div ref={scrollRef} className="h-[320px] space-y-3 overflow-y-auto px-4 py-4">
        {turns.slice(0, count).map((t) => (
          <div
            key={t.id}
            className={cn('flex route-enter', t.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            <div
              className={cn(
                'max-w-[80%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed',
                t.role === 'user'
                  ? 'rounded-br-sm bg-[var(--vp-primary)] text-white'
                  : 'rounded-bl-sm bg-[var(--vp-surface-alt)] text-[var(--vp-text-primary)]',
              )}
            >
              {t.text}
            </div>
          </div>
        ))}
        {count < turns.length && (
          <div className="flex justify-start">
            <div className="flex gap-1 rounded-2xl bg-[var(--vp-surface-alt)] px-4 py-3">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--vp-text-muted)] [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--vp-text-muted)] [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--vp-text-muted)] [animation-delay:300ms]" />
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 border-t border-[var(--vp-border)] px-3 py-2.5">
        <div className="flex-1 rounded-lg border border-[var(--vp-border)] bg-[var(--vp-surface-alt)] px-3 py-2 text-[12px] text-[var(--vp-text-muted)]">
          Ask VectorPilot anything…
        </div>
        <span className="rounded-lg bg-[var(--vp-primary)] p-2 text-white">
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

// ---------------- Hero ----------------
function HeroSection() {
  const navigate = useNavigate();
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 aurora opacity-80" />
        <div className="absolute inset-0 grid-bg opacity-50" />
      </div>
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 lg:grid-cols-2 lg:py-24">
        <div className="space-y-7">
          <Badge tone="indigo">
            <Sparkles className="h-3 w-3" /> AI spend, in real time
          </Badge>
          <TypewriterHeadline />
          <p className="max-w-lg text-lg text-[var(--vp-text-secondary)]">
            The AI copilot platform that streams <span className="hl">every token and every cent</span> as it happens —
            with reveal-once API keys, live cost analytics, and a copilot that routes work for you.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="lg" variant="ai" onClick={() => navigate('/auth/signup')}>
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Button>
            <Link to="/pricing">
              <Button size="lg" variant="outline">
                View pricing
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-6 pt-2 text-sm text-[var(--vp-text-muted)]">
            <span>
              <strong className="text-[var(--vp-text-primary)]">31%</strong> avg spend cut
            </span>
            <span>
              <strong className="text-[var(--vp-text-primary)]">4s</strong> live updates
            </span>
            <span>
              <strong className="text-[var(--vp-text-primary)]">0</strong> leaked keys
            </span>
          </div>
        </div>
        <Reveal scroll={false} delay={0.2} className="space-y-4">
          <div className="img-glow overflow-hidden rounded-3xl border border-[var(--vp-border)]">
            <img
              src={heroImg}
              alt="Premium AI-powered workspace with an intelligent copilot interface on an ultra-wide monitor"
              className="breathe h-[190px] w-full object-cover sm:h-[220px]"
            />
          </div>
          <ChatDemoWidget />
        </Reveal>
      </div>
    </section>
  );
}

// ---------------- Feature grid ----------------
function FeatureCard({ item }: { item: FeatureCardItem }) {
  const Icon = iconMap[item.icon];
  return (
    <div
      data-reveal-item
      className="group rounded-2xl border border-[var(--vp-border)] bg-[var(--vp-surface)] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--vp-border-active)] hover:shadow-lg"
    >
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--vp-selected-bg)] text-[var(--vp-primary)] transition-transform duration-300 group-hover:scale-110">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-lg font-bold">{item.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[var(--vp-text-muted)]">{item.body}</p>
    </div>
  );
}

export function FeatureGrid() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-20">
      <Reveal className="mx-auto max-w-2xl text-center">
        <Badge tone="cyan">Everything you need</Badge>
        <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">One platform for live AI operations</h2>
        <p className="mt-3 text-[var(--vp-text-muted)]">
          From the moment a token is billed to the moment a key is revoked — VectorPilot gives you total visibility and control.
        </p>
      </Reveal>
      <Reveal stagger={0.08} className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {mockFeatures.map((f) => (
          <FeatureCard key={f.id} item={f} />
        ))}
      </Reveal>
    </section>
  );
}

// ---------------- Billing toggle (GSAP pill tween) ----------------
export function BillingToggle({ billing, onChange }: { billing: Billing; onChange: (b: Billing) => void }) {
  const track = useRef<HTMLDivElement>(null);
  const pill = useRef<HTMLDivElement>(null);

  const move = () => {
    if (!track.current || !pill.current) return;
    const seg = track.current.clientWidth / 2;
    gsap.to(pill.current, { x: billing === 'monthly' ? 0 : seg, duration: 0.3, ease: 'power2.inOut' });
  };
  useEffect(() => {
    move();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [billing]);
  useGSAP(
    () => move(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    { dependencies: [] },
  );

  return (
    <div ref={track} className="relative flex w-[280px] rounded-full border border-[var(--vp-border)] bg-[var(--vp-surface-alt)] p-1">
      <div
        ref={pill}
        className="absolute inset-y-1 left-1 rounded-full bg-[var(--vp-primary)]"
        style={{ width: 'calc(50% - 4px)' }}
      />
      <button
        onClick={() => onChange('monthly')}
        className={cn('relative z-10 flex-1 rounded-full py-2 text-[13px] font-semibold transition-colors', billing === 'monthly' ? 'text-white' : 'text-[var(--vp-text-secondary)]')}
      >
        Monthly
      </button>
      <button
        onClick={() => onChange('annual')}
        className={cn('relative z-10 flex-1 rounded-full py-2 text-[13px] font-semibold transition-colors', billing === 'annual' ? 'text-white' : 'text-[var(--vp-text-secondary)]')}
      >
        Annual · save 20%
      </button>
    </div>
  );
}

// ---------------- Plan card (hover-driven selection) ----------------
function PlanCard({
  plan,
  billing,
  isActive,
  onEnter,
  onLeave,
  onCta,
}: {
  plan: Plan;
  billing: Billing;
  isActive: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onCta: () => void;
}) {
  const price = billing === 'annual' ? plan.annualUsd : plan.monthlyUsd;
  return (
    <div
      data-plan={plan.id}
      data-active={isActive}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className={cn(
        'relative flex flex-col rounded-2xl border bg-[var(--vp-surface)] p-6 transition-all duration-200',
        isActive
          ? 'scale-[1.015] border-[var(--vp-border-active)] shadow-xl shadow-indigo-500/10'
          : 'border-[var(--vp-border)]',
        plan.highlight && 'ring-1 ring-[var(--vp-primary)]',
      )}
    >
      {plan.highlight && (
        <span className="absolute -top-3 left-6 rounded-full bg-[var(--vp-primary)] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
          Most popular
        </span>
      )}
      <div className="flex items-baseline justify-between">
        <h3 className="text-xl font-bold">{plan.name}</h3>
        {isActive && <Badge tone="indigo">selected</Badge>}
      </div>
      <div className="mt-4 flex items-end gap-1">
        <AnimatedNumber value={price} format={(n) => `$${Math.round(n)}`} className="font-mono text-4xl font-bold" />
        <span className="mb-1 text-sm text-[var(--vp-text-muted)]">/mo</span>
      </div>
      <p className="mt-1 text-[12px] text-[var(--vp-text-muted)]">
        {billing === 'annual' ? `billed annually · ${pct(20)} off` : 'billed monthly'}
      </p>
      <Button variant={plan.highlight ? 'ai' : 'outline'} className="mt-5 w-full" onClick={onCta}>
        {plan.cta}
      </Button>
      <ul className="mt-6 space-y-2.5">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-[13px]">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            <span className="text-[var(--vp-text-secondary)]">{f}</span>
          </li>
        ))}
        {plan.excluded.map((f) => (
          <li key={f} className="flex items-start gap-2 text-[13px] text-[var(--vp-text-muted)] line-through">
            <span className="mt-0.5 h-4 w-4 shrink-0 text-center text-[var(--vp-text-disabled)]">—</span>
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------- Pricing section ----------------
export function PricingSection({ compact = false }: { compact?: boolean }) {
  const { billing, setBilling } = useUI();
  const navigate = useNavigate();
  const [activePlan, setActivePlan] = useState<PlanId>('starter');

  return (
    <section className="mx-auto max-w-7xl px-5 py-20">
      <Reveal className="flex flex-col items-center gap-5 text-center">
        <Badge tone="gold">Pricing</Badge>
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Simple, transparent pricing</h2>
        <BillingToggle billing={billing} onChange={setBilling} />
      </Reveal>
      <Reveal stagger={0.06} className="mt-12 grid items-start gap-6 lg:grid-cols-3">
        {mockPlans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            billing={billing}
            isActive={activePlan === plan.id}
            onEnter={() => setActivePlan(plan.id)}
            onLeave={() => {}}
            onCta={() => navigate(`/auth/signup?plan=${plan.id}`)}
          />
        ))}
      </Reveal>
      {!compact && (
        <div className="mt-10 overflow-hidden rounded-2xl border border-[var(--vp-border)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--vp-surface-alt)] text-[var(--vp-text-muted)]">
              <tr>
                <th className="px-5 py-3 font-semibold">Capability</th>
                <th className="px-5 py-3 text-center font-semibold">Starter</th>
                <th className="px-5 py-3 text-center font-semibold">Pro</th>
                <th className="px-5 py-3 text-center font-semibold">Team</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--vp-border)]">
              {[
                ['AI calls / month', '5,000', '150,000', '1,000,000'],
                ['Live cost dashboard', '✓', '✓', '✓'],
                ['API key management', '—', '✓', '✓'],
                ['Usage analytics export', '—', '✓', '✓'],
                ['SSO & SAML', '—', '—', '✓'],
                ['Dedicated success manager', '—', '—', '✓'],
              ].map((row) => (
                <tr key={row[0]} className="text-[var(--vp-text-secondary)]">
                  <td className="px-5 py-3 font-medium text-[var(--vp-text-primary)]">{row[0]}</td>
                  <td className="px-5 py-3 text-center">{row[1]}</td>
                  <td className="px-5 py-3 text-center">{row[2]}</td>
                  <td className="px-5 py-3 text-center">{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ---------------- Logo ticker ----------------
export function LogoTicker() {
  const row = [...mockLogos, ...mockLogos];
  return (
    <section className="border-y border-[var(--vp-border)] bg-[var(--vp-surface)] py-8">
      <p className="mb-5 text-center text-[12px] font-semibold uppercase tracking-widest text-[var(--vp-text-muted)]">
        Trusted by teams shipping with AI
      </p>
      <div className="overflow-hidden">
        <div className="marquee-track gap-12 px-6">
          {row.map((l, i) => (
            <span key={`${l.id}-${i}`} className="whitespace-nowrap text-xl font-bold text-[var(--vp-text-disabled)]">
              {l.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------- Testimonial carousel ----------------
function TestimonialCarousel() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setIdx((i) => (i + 1) % mockTestimonials.length), 5000);
    return () => window.clearInterval(t);
  }, []);
  const t = mockTestimonials[idx];
  return (
    <section className="mx-auto max-w-4xl px-5 py-20 text-center">
      <div className="mb-6 flex justify-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
        ))}
      </div>
      <blockquote key={t.id} className="route-enter text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
        “{t.quote}”
      </blockquote>
      <div className="mt-6">
        <p className="font-bold">{t.author}</p>
        <p className="text-sm text-[var(--vp-text-muted)]">{t.role}</p>
      </div>
      <div className="mt-7 flex justify-center gap-2">
        {mockTestimonials.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className={cn('h-2 rounded-full transition-all', i === idx ? 'w-7 bg-[var(--vp-primary)]' : 'w-2 bg-[var(--vp-border-strong)]')}
            aria-label={`Testimonial ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

// ---------------- Waitlist band ----------------
export function WaitlistBand() {
  const { state, join, confirm } = useWaitlist();
  const { toast } = useUI();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState<number | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ type: 'error', title: 'Invalid email', description: 'Please enter a valid email address.' });
      return;
    }
    setLoading(true);
    join(email);
    try {
      const res = await waitlistService.join(email);
      confirm();
      setPosition(res.position);
    } catch {
      confirm();
      setPosition(Math.floor(Math.random() * 900) + 100);
    } finally {
      setLoading(false);
    }
  }

  if (state.confirmed) {
    return (
      <section className="mx-auto max-w-5xl px-5 py-20">
        <div className="overflow-hidden rounded-3xl border border-[var(--vp-border)] bg-[var(--vp-surface)] p-10 text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/12 text-emerald-500">
            <Check className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-bold">You’re on the list{state.email ? `, ${state.email.split('@')[0]}` : ''}!</h2>
          <p className="mx-auto mt-2 max-w-md text-[var(--vp-text-muted)]">
            You’re #{position ?? '847'} in line. We’ll email you the moment your workspace is ready.
          </p>
          <Link to="/features">
            <Button variant="outline" className="mt-6">
              Explore features
            </Button>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-5xl px-5 py-20">
      <div className="relative overflow-hidden rounded-3xl border border-[var(--vp-border)] bg-gradient-to-br from-[var(--vp-primary)] to-[var(--vp-primary-700)] p-10 text-center text-white">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="relative">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Get early access to VectorPilot</h2>
          <p className="mx-auto mt-3 max-w-lg text-white/85">
            Join the waitlist and lock in founding-member pricing. No credit card. No spam.
          </p>
          <form onSubmit={submit} className="mx-auto mt-7 flex max-w-md flex-col gap-3 sm:flex-row">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="h-12 flex-1 rounded-xl border border-white/20 bg-white/10 px-4 text-white placeholder:text-white/60 outline-none focus:border-white/50"
            />
            <Button type="submit" size="lg" loading={loading} className="bg-white text-[var(--vp-primary)] hover:bg-white/90">
              Join waitlist
            </Button>
          </form>
          <p className="mt-3 text-[12px] text-white/70">Joining confirms instantly · mock persistence only</p>
        </div>
      </div>
    </section>
  );
}

// ---------------- CTA band ----------------
function CtaBand() {
  return (
    <section className="relative overflow-hidden border-y border-[var(--vp-border)]">
      <img src={ctaImg} alt="Enterprise office floor with wall-mounted analytics dashboards" className="breathe absolute inset-0 h-full w-full object-cover opacity-30" loading="lazy" />
      <div className="absolute inset-0 bg-gradient-to-r from-[var(--vp-bg)] via-[var(--vp-bg)]/85 to-transparent" />
      <div className="relative mx-auto max-w-7xl px-5 py-24">
        <h2 className="max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">Put your AI spend on a live dashboard today.</h2>
        <p className="mt-3 max-w-lg text-[var(--vp-text-secondary)]">
          Start free in under a minute. Upgrade only when your usage demands it.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link to="/auth/signup">
            <Button size="lg" variant="ai">
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link to="/waitlist">
            <Button size="lg" variant="outline">
              Join the waitlist
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

// ---------------- Benefits section ----------------
function BenefitsSection() {
  const benefits = [
    { stat: '31%', title: 'Cut spend, keep capability', body: 'See where every dollar goes, then route work to the right model. Teams cut spend by an average of 31% in month one.' },
    { stat: '4s', title: 'Real-time, not retroactive', body: 'Cost events stream in live. Watch spend accrue as it happens — never a surprise invoice at month-end.' },
    { stat: '0', title: 'Keys that protect themselves', body: 'Reveal-once API keys mean full secrets never touch storage. Revoke instantly, anywhere, with a single click.' },
    { stat: '100%', title: 'Built for the whole team', body: 'Shared dashboards, role-based access, audit logs, and an export-ready dataset for finance and ops.' },
  ];
  return (
    <section className="relative overflow-hidden border-y border-[var(--vp-border)] bg-[var(--vp-surface)]">
      <div className="absolute inset-0 mesh-glow opacity-50" />
      <div className="relative mx-auto max-w-7xl px-5 py-20">
        <Reveal className="max-w-2xl">
          <Badge tone="green">Why VectorPilot</Badge>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">The complete picture of your AI operation</h2>
          <p className="mt-3 text-[var(--vp-text-muted)]">
            Every feature exists for one reason: to make AI spend <span className="hl">visible, controllable, and predictable</span>. Here’s the full benefit of running on VectorPilot.
          </p>
        </Reveal>
        <Reveal stagger={0.08} className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b) => (
            <div data-reveal-item key={b.title} className="rounded-2xl border border-[var(--vp-border)] bg-[var(--vp-surface)] p-6">
              <p className="gradient-text font-mono text-3xl font-extrabold">{b.stat}</p>
              <h3 className="mt-3 font-bold">{b.title}</h3>
              <p className="mt-2 text-sm text-[var(--vp-text-muted)]">{b.body}</p>
            </div>
          ))}
        </Reveal>
        <Reveal className="mt-10 rounded-2xl border border-[var(--vp-border)] bg-[var(--vp-surface-alt)] p-6 text-center">
          <p className="text-lg font-semibold">
            <span className="hl-strong">From the first token to the final invoice</span> — VectorPilot is the only surface your team needs to run AI responsibly.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

// ---------------- Home page ----------------
export function HomePage() {
  return (
    <>
      <HeroSection />
      <LogoTicker />
      <FeatureGrid />
      <BenefitsSection />
      <PricingSection />
      <TestimonialCarousel />
      <WaitlistBand />
      <CtaBand />
    </>
  );
}
