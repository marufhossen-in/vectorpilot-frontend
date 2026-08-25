import { useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { ArrowLeft, ArrowRight, Check, CreditCard, Lock, ShieldCheck } from 'lucide-react';

import { mockPlans } from '@/data/mock';
import { cn, genId, usd } from '@/lib/utils';
import { makeUser, useAuth, useUI } from '@/store/AppStores';
import { Button, Field, inputClass } from '@/components/ui';
import { Logo } from '@/components/shared';
import type { Billing, PlanId } from '@/types';

// ---------------- Auth layout ----------------
export function AuthLayout({ title, subtitle, children, footer }: { title: string; subtitle: string; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--vp-bg)] px-4 py-10">
      <div className="absolute inset-0 -z-10 grid-bg opacity-50" />
      <div className="absolute -top-32 left-1/2 -z-10 h-96 w-96 -translate-x-1/2 rounded-full bg-[var(--vp-primary)]/20 blur-[120px]" />
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <Logo context="auth" size={40} />
        </div>
        <div className="rounded-2xl border border-[var(--vp-border)] bg-[var(--vp-surface)] p-7 shadow-2xl shadow-indigo-500/10">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-[var(--vp-text-muted)]">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
        <p className="mt-5 text-center text-sm text-[var(--vp-text-muted)]">{footer}</p>
      </div>
    </div>
  );
}

// ---------------- Login ----------------
const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
type LoginValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { start, login, fail } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') || '/dashboard';
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });

  async function onSubmit(values: LoginValues) {
    start();
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));
    if (values.password.length < 8) {
      fail('Invalid credentials');
      setSubmitting(false);
      return;
    }
    const name = values.email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    login(makeUser(name || 'Member', values.email, 'pro'));
    navigate(next);
  }

  function demoLogin() {
    start();
    login(makeUser('Maya Chen', 'maya@vectorpilot.ai', 'pro'));
    navigate(next);
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your VectorPilot workspace."
      footer={
        <>
          New here?{' '}
          <Link to="/auth/signup" className="font-semibold text-[var(--vp-primary)]">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Email" error={errors.email?.message} htmlFor="email">
          <input id="email" type="email" autoComplete="email" className={inputClass} placeholder="you@company.com" {...register('email')} />
        </Field>
        <Field label="Password" error={errors.password?.message} htmlFor="password">
          <input id="password" type="password" autoComplete="current-password" className={inputClass} placeholder="••••••••" {...register('password')} />
        </Field>
        <Button type="submit" variant="ai" className="w-full" loading={submitting}>
          Sign in
        </Button>
      </form>
      <div className="my-4 flex items-center gap-3 text-[12px] text-[var(--vp-text-muted)]">
        <span className="h-px flex-1 bg-[var(--vp-border)]" /> or <span className="h-px flex-1 bg-[var(--vp-border)]" />
      </div>
      <Button variant="outline" className="w-full" onClick={demoLogin}>
        Continue with Google (demo)
      </Button>
      <Link to="/" className="mt-5 flex items-center justify-center gap-1.5 text-[13px] text-[var(--vp-text-muted)] hover:text-[var(--vp-text-primary)]">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to home
      </Link>
    </AuthLayout>
  );
}

// ---------------- Signup ----------------
const signupSchema = z.object({
  name: z.string().min(2, 'Tell us your name'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters'),
});
type SignupValues = z.infer<typeof signupSchema>;

export function SignupPage() {
  const { start, login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [plan, setPlan] = useState<PlanId>((params.get('plan') as PlanId) || 'starter');
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupValues>({ resolver: zodResolver(signupSchema), defaultValues: { name: '', email: '', password: '' } });

  async function onSubmit(values: SignupValues) {
    start();
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 800));
    login(makeUser(values.name, values.email, plan));
    navigate(plan === 'starter' ? '/dashboard' : `/payment?plan=${plan}`);
  }

  return (
    <AuthLayout
      title="Create your workspace"
      subtitle="Start free. Upgrade when your usage demands it."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/auth/login" className="font-semibold text-[var(--vp-primary)]">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Field label="Full name" error={errors.name?.message} htmlFor="name">
          <input id="name" autoComplete="name" className={inputClass} placeholder="Maya Chen" {...register('name')} />
        </Field>
        <Field label="Email" error={errors.email?.message} htmlFor="su-email">
          <input id="su-email" type="email" autoComplete="email" className={inputClass} placeholder="you@company.com" {...register('email')} />
        </Field>
        <Field label="Password" error={errors.password?.message} htmlFor="su-password">
          <input id="su-password" type="password" autoComplete="new-password" className={inputClass} placeholder="At least 8 characters" {...register('password')} />
        </Field>

        <div>
          <p className="mb-2 text-[13px] font-semibold text-[var(--vp-text-secondary)]">Choose a plan</p>
          <div className="grid grid-cols-3 gap-2">
            {mockPlans.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPlan(p.id)}
                className={cn(
                  'rounded-xl border p-3 text-left transition-all',
                  plan === p.id ? 'border-[var(--vp-border-active)] bg-[var(--vp-selected-bg)]' : 'border-[var(--vp-border)] hover:bg-[var(--vp-surface-alt)]',
                )}
              >
                <p className="text-sm font-bold">{p.name}</p>
                <p className="text-[11px] text-[var(--vp-text-muted)]">{p.monthlyUsd === 0 ? 'Free' : `$${p.monthlyUsd}/mo`}</p>
              </button>
            ))}
          </div>
        </div>

        <Button type="submit" variant="ai" className="w-full" loading={submitting}>
          Create account <ArrowRight className="h-4 w-4" />
        </Button>
      </form>
    </AuthLayout>
  );
}

// ---------------- Payment ----------------
const paymentSchema = z.object({
  card: z.string().regex(/^[\d ]{16,19}$/, 'Enter a valid 16-digit card number'),
  expiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'MM/YY'),
  cvc: z.string().regex(/^\d{3,4}$/, '3–4 digits'),
  name: z.string().min(2, 'Name on card'),
  country: z.string().min(2, 'Required'),
});
type PaymentValues = z.infer<typeof paymentSchema>;

export function PaymentPage() {
  const { billing } = useUI();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const planId = (params.get('plan') as PlanId) || 'pro';
  const plan = mockPlans.find((p) => p.id === planId) ?? mockPlans[1];
  const price = billing === 'annual' ? plan.annualUsd : plan.monthlyUsd;
  const annualTotal = price * 12;
  const monthlyEquivalent = plan.monthlyUsd;
  const savings = billing === 'annual' ? Math.max(0, (monthlyEquivalent - price) * 12) : 0;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PaymentValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { card: '', expiry: '', cvc: '', name: '', country: '' },
  });
  const [processing, setProcessing] = useState(false);

  async function onSubmit() {
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 1500));
    navigate(`/payment/success?plan=${planId}&billing=${billing}`);
  }

  return (
    <div className="min-h-screen bg-[var(--vp-bg)]">
      <header className="flex items-center justify-between border-b border-[var(--vp-border)] bg-[var(--vp-surface)] px-6 py-4">
        <Logo context="auth" />
        <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--vp-text-muted)]">
          <Lock className="h-4 w-4" /> Secure payment
        </span>
      </header>
      <div className="mx-auto grid max-w-5xl gap-8 px-5 py-10 lg:grid-cols-2">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <h1 className="text-2xl font-bold tracking-tight">Payment details</h1>
          <p className="text-sm text-[var(--vp-text-muted)]">This is a demo — no real payment is processed.</p>
          <Field label="Card number" error={errors.card?.message} htmlFor="card">
            <div className="relative">
              <input id="card" inputMode="numeric" className={cn(inputClass, 'pr-10')} placeholder="4242 4242 4242 4242" {...register('card')} />
              <CreditCard className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--vp-text-muted)]" />
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Expiry" error={errors.expiry?.message} htmlFor="expiry">
              <input id="expiry" className={inputClass} placeholder="MM/YY" {...register('expiry')} />
            </Field>
            <Field label="CVC" error={errors.cvc?.message} htmlFor="cvc">
              <input id="cvc" className={inputClass} placeholder="123" {...register('cvc')} />
            </Field>
          </div>
          <Field label="Name on card" error={errors.name?.message} htmlFor="cc-name">
            <input id="cc-name" className={inputClass} placeholder="Maya Chen" {...register('name')} />
          </Field>
          <Field label="Country" error={errors.country?.message} htmlFor="country">
            <input id="country" className={inputClass} placeholder="Germany" {...register('country')} />
          </Field>
          <Button type="submit" variant="ai" className="w-full" loading={processing}>
            {processing ? 'Processing…' : `Pay ${usd(billing === 'annual' ? annualTotal : price)} securely`}
          </Button>
          <p className="flex items-center justify-center gap-1.5 text-[12px] text-[var(--vp-text-muted)]">
            <ShieldCheck className="h-3.5 w-3.5" /> 256-bit encrypted · Cancel any time · 30-day money-back
          </p>
        </form>

        <div className="lg:pt-12">
          <div className="rounded-2xl border border-[var(--vp-border)] bg-[var(--vp-surface)] p-6">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-[var(--vp-text-muted)]">Order summary</p>
            <div className="mt-3 flex items-center justify-between">
              <div>
                <p className="text-lg font-bold">VectorPilot {plan.name}</p>
                <p className="text-[13px] text-[var(--vp-text-muted)]">Billed {billing}</p>
              </div>
              <span className="rounded-full bg-[var(--vp-selected-bg)] px-2.5 py-1 text-[12px] font-semibold text-[var(--vp-primary)]">{plan.name}</span>
            </div>
            <div className="mt-4 space-y-2 border-t border-[var(--vp-border)] pt-4 text-sm">
              <Row label={`${usd(price)}/mo × 12`} value={usd(annualTotal)} />
              {savings > 0 && <Row label="Annual savings" value={`– ${usd(savings)}`} accent />}
              <div className="border-t border-[var(--vp-border)] pt-2">
                <Row label="Total due today" value={usd(billing === 'annual' ? annualTotal : price)} bold />
              </div>
            </div>
            <ul className="mt-5 space-y-2 text-[13px] text-[var(--vp-text-secondary)]">
              {plan.features.slice(0, 4).map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={cn('text-[var(--vp-text-muted)]', bold && 'font-bold text-[var(--vp-text-primary)]')}>{label}</span>
      <span className={cn('font-mono', bold && 'text-lg font-bold', accent && 'text-emerald-500')}>{value}</span>
    </div>
  );
}

// ---------------- Payment success ----------------
export function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const planId = (params.get('plan') as PlanId) || 'pro';
  const billing = (params.get('billing') as Billing) || 'annual';
  const plan = mockPlans.find((p) => p.id === planId) ?? mockPlans[1];
  const txn = useRef(genId('txn')).current;
  const amount = (billing === 'annual' ? plan.annualUsd : plan.monthlyUsd) * (billing === 'annual' ? 12 : 1);

  const circle = useRef<SVGCircleElement>(null);
  const check = useRef<SVGPathElement>(null);
  const wrap = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        if (circle.current) gsap.fromTo(circle.current, { attr: { r: 0 } }, { attr: { r: 52 }, duration: 0.6, ease: 'power2.out' });
        if (check.current) {
          const len = check.current.getTotalLength();
          gsap.set(check.current, { strokeDasharray: len, strokeDashoffset: len });
          gsap.to(check.current, { strokeDashoffset: 0, duration: 0.4, delay: 0.5, ease: 'power2.inOut' });
        }
        const items = wrap.current?.querySelectorAll('[data-fade]');
        if (items) gsap.from(items, { y: 18, opacity: 0, duration: 0.5, stagger: 0.12, delay: 0.7, ease: 'power3.out' });
      });
    },
    { dependencies: [] },
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--vp-bg)] px-5 py-10">
      <div ref={wrap} className="w-full max-w-md text-center">
        <svg width="120" height="120" viewBox="0 0 120 120" className="mx-auto">
          <circle ref={circle} cx="60" cy="60" r="52" fill="none" stroke="var(--spend-ok)" strokeWidth="3" />
          <path ref={check} d="M40 62 L54 76 L82 46" fill="none" stroke="var(--spend-ok)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h1 data-fade className="mt-6 text-3xl font-extrabold tracking-tight">Payment successful</h1>
        <p data-fade className="mt-2 text-[var(--vp-text-muted)]">
          Welcome to VectorPilot {plan.name}. Your workspace is ready.
        </p>
        <div data-fade className="mt-6 rounded-2xl border border-[var(--vp-border)] bg-[var(--vp-surface)] p-5 text-left">
          <Row label="Plan" value={`VectorPilot ${plan.name}`} bold />
          <div className="mt-2" />
          <Row label="Billing" value={billing} />
          <div className="mt-2" />
          <Row label="Amount" value={usd(amount)} />
          <div className="mt-2" />
          <Row label="Transaction ID" value={txn} />
        </div>
        <div data-fade className="mt-6 flex flex-col gap-2.5 sm:flex-row">
          <Button variant="ai" className="flex-1" onClick={() => navigate('/dashboard')}>
            Go to dashboard <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => undefined}>
            Download receipt
          </Button>
        </div>
      </div>
    </div>
  );
}
