import { createBrowserRouter, redirect } from 'react-router-dom';

import { getAuthStatus } from '@/store/AppStores';
import { PublicLayout, DashboardLayout } from '@/components/shared';
import { HomePage, PricingSection } from '@/features/landing';
import { FeaturesPage, AboutPage, HelpPage, WaitlistPage, NotFoundPage } from '@/pages/public';
import {
  DashboardHomePage,
  UsagePage,
  KeysPage,
  SessionsPage,
  NotificationsPage,
} from '@/features/dashboard';
import { LoginPage, SignupPage, PaymentPage, PaymentSuccessPage } from '@/features/auth';
import { SettingsPage, ProfilePage } from '@/features/account';
import { ActivityPage, AnalyticsPage, CopilotPage, IntegrationsPage, ProjectsPage } from '@/features/workspaces';
import { Badge } from '@/components/ui';

import pricingImg from '@/assets/marketing/pricing.jpg';

// ---- Route protection (loader-based, reads AuthStore via persisted session) ----
function requireAuth({ request }: { request: Request }) {
  if (getAuthStatus() !== 'authenticated') {
    const next = new URL(request.url).pathname;
    return redirect(`/auth/login?next=${encodeURIComponent(next)}`);
  }
  return null;
}

function redirectIfAuthenticated() {
  if (getAuthStatus() === 'authenticated') return redirect('/dashboard');
  return null;
}

// ---- Pricing page (deep-linkable, shares billing state via UIStore) ----
function PricingPage() {
  return (
    <>
      <section className="relative overflow-hidden border-b border-[var(--vp-border)]">
        <div className="absolute inset-0 -z-10">
          <img src={pricingImg} alt="Enterprise workspace with AI software across multiple displays" className="breathe h-full w-full object-cover opacity-[0.24]" />
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--vp-bg)]/60 to-[var(--vp-bg)]" />
          <div className="absolute inset-0 mesh-glow opacity-50" />
        </div>
        <div className="mx-auto max-w-4xl px-5 py-20 text-center">
          <Badge tone="gold">Pricing</Badge>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight sm:text-5xl">Pricing that scales with you</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[var(--vp-text-secondary)]">
            Start free. The billing toggle here stays in sync with the home page — pick what works.
          </p>
        </div>
      </section>
      <PricingSection compact />
      <section className="mx-auto max-w-3xl px-5 py-16">
        <h2 className="text-center text-2xl font-bold">Frequently asked questions</h2>
        <div className="mt-8 space-y-3">
          {[
            ['Can I change plans later?', 'Yes — upgrade or downgrade anytime. Changes prorate automatically.'],
            ['Is there a free plan?', 'Starter is free forever with 5,000 AI calls and the live dashboard.'],
            ['Do you process payments?', 'No. This is a frontend demo with no real payment processing.'],
            ['How is the full API key secured?', 'Reveal-once: the full key lives in memory only, then is permanently unrecoverable.'],
          ].map(([q, a]) => (
            <div key={q} className="rounded-xl border border-[var(--vp-border)] bg-[var(--vp-surface)] p-5">
              <p className="font-semibold">{q}</p>
              <p className="mt-1 text-sm text-[var(--vp-text-muted)]">{a}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/features', element: <FeaturesPage /> },
      { path: '/pricing', element: <PricingPage /> },
      { path: '/about', element: <AboutPage /> },
      { path: '/help', element: <HelpPage /> },
      { path: '/waitlist', element: <WaitlistPage /> },
    ],
  },
  { path: '/auth/login', loader: redirectIfAuthenticated, element: <LoginPage /> },
  { path: '/auth/signup', loader: redirectIfAuthenticated, element: <SignupPage /> },
  { path: '/payment', loader: requireAuth, element: <PaymentPage /> },
  { path: '/payment/success', loader: requireAuth, element: <PaymentSuccessPage /> },
  {
    path: '/dashboard',
    loader: requireAuth,
    element: <DashboardLayout />,
    children: [
      { index: true, element: <DashboardHomePage /> },
      { path: 'usage', element: <UsagePage /> },
      { path: 'keys', element: <KeysPage /> },
      { path: 'sessions', element: <SessionsPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'notifications', element: <NotificationsPage /> },
      { path: 'copilot', element: <CopilotPage /> },
      { path: 'projects', element: <ProjectsPage /> },
      { path: 'activity', element: <ActivityPage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
      { path: 'integrations', element: <IntegrationsPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
