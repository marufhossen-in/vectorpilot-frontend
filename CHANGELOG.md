# Changelog

All notable changes to VectorPilot are documented in this file.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/). Versioning: [SemVer](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] — 2026-08-22

### Added — Public marketing surface

- **Landing page (`/`)** — Seven-section animated landing: typewriter hero, embedded interactive chat demo, feature grid, benefits section, three-tier pricing, social-proof logo ticker, testimonial carousel, waitlist capture band, and final CTA.
- **Typewriter hero** — GSAP-driven phrase typewriter with blinking caret; loops through AI value phrases; breathing hero image in a glowing frame; floating glass "live cost" and "saved this month" stat cards.
- **Chat demo widget** — Self-contained, auto-playing scripted chat; pauses on hover/focus and loops; primary landing conversion element.
- **Feature grid** — Six capability cards (AI Copilot · Live Tracking · Key Management · Usage Analytics · Session History · Real-time Feed) with blur-in ScrollTrigger reveals.
- **Benefits section** — Four stat cards (31% spend cut · 4s real-time · 0 leaked keys · 100% team-ready) with full benefit copy and a highlighted key line.
- **Pricing section** — Three-tier pricing (Starter · Pro · Team) with GSAP billing toggle synced to animated price numbers and hover-driven plan selection.
- **Logo ticker** — GPU-accelerated CSS marquee of integration brands.
- **Testimonial carousel** — Auto-rotating (5s) testimonials with dot navigation.
- **Waitlist band** — Email capture with instant confirm and cross-session persistence.
- **Sticky navbar** — Transparent-to-frosted on scroll; theme toggle; auth CTAs.
- **Features page (`/features`)** — Alternating feature breakdown with framed, breathing hero image (glow halo), polished gradient panels.
- **Pricing page (`/pricing`)** — Deep-linkable; shares billing state with home via UIStore; FAQ.
- **About page (`/about`)** — Mission · Vision · Philosophy · Team; framed hero image.
- **Help page (`/help`)** — Searchable FAQ accordion; support CTA; framed hero image.
- **Waitlist page (`/waitlist`)** — Dedicated capture with position counter.
- **404 page** — Friendly recovery with CTA back to home.

### Added — Authentication & payment

- **Login (`/auth/login`)** — React Hook Form + Zod; error state; Google demo button; `?next=` preserved.
- **Signup (`/auth/signup`)** — React Hook Form + Zod; plan selection; routes to dashboard (free) or payment (paid).
- **Payment (`/payment`)** — Premium full-screen UI; RHF + Zod; card inputs; order summary with savings; mock processing; no real payments.
- **Payment success (`/payment/success`)** — GSAP circle-draw + checkmark animation; order summary; receipt download; redirect to dashboard.
- **Protected routes** — React Router v7 loaders redirect unauthenticated users to `/auth/login?next=<path>` (synchronous session write prevents a navigation race).

### Added — Dashboard (enterprise-grade)

- **Dashboard home (`/dashboard`)** — Four KPI StatCards · Live CostTicker · 7-day usage bar chart · model-split donut.
- **Cost ticker** — Live USD counter (GSAP `quickTo`/AnimatedNumber); pulsing dot on each event; limit progress bar; 4s mock simulator.
- **Usage page (`/dashboard/usage`)** — 7d/30d toggle, model donut, totals, CSV export.
- **API keys (`/dashboard/keys`)** — Full key management: create · reveal-once · copy · revoke with confirm modal. **FreshKey is memory-only and stripped before persistence.**
- **Sessions (`/dashboard/sessions`)** — Chat history list + full transcript viewer.
- **Profile (`/dashboard/profile`)** — Full-screen profile with FileReader image upload (5MB limit, format validation, GSAP preview).
- **Settings (`/dashboard/settings`)** — Enterprise 8-section settings: Account · Security · Notifications · Integrations · Billing · Team · Appearance · API & Webhooks.
- **Notifications (`/dashboard/notifications`)** — Feed with type filters and mark-read.
- **Copilot (`/dashboard/copilot`)** — Interactive AI chat with typing indicator, quick prompts, and scripted responses.
- **Projects (`/dashboard/projects`)** — Project CRUD with status, per-project budgets, and progress meters.
- **Activity (`/dashboard/activity`)** — Live event feed subscribed to real usage events, with type filters and export.
- **Analytics (`/dashboard/analytics`)** — Model comparison, daily trend chart, top sessions by cost, latency/quality metrics.
- **Integrations (`/dashboard/integrations`)** — Eight service connectors plus webhook configuration, test delivery, and delivery logs.
- **Command palette (⌘K)** — Keyboard-driven global navigation and actions across the dashboard.
- **Dashboard layout** — Persistent sidebar + topbar (plan badge, search, notifications, avatar, logout) with mobile nav.

### Added — Plan differentiation (Free ≈60% · Pro 100%)

- **Free:** manual, capped Cost Snapshot (3 checks/day); 1 project (no budgets); 5 copilot messages/day; 7-day usage/analytics (no metrics); 1 integration connector; no webhooks; no CSV export.
- **Pro:** live cost ticker; AI Spend Optimizer with computed recommendations, projected bill/savings, and CSV export; unlimited projects with budgets; unlimited context-aware copilot; 30-day analytics with latency/quality; all connectors + retryable webhooks.
- **Live upgrade** — `UpgradeModal` switches the plan in place via `AuthStore.upgrade()`; the entire dashboard re-renders to the unlocked experience instantly.

### Added — State management & data layer

- **Five stores** via Context + `useReducer` with localStorage persistence and cross-tab sync: AuthStore · UsageStore · KeyStore · WaitlistStore · UIStore.
- **Reveal-once keys** — `FreshKey` held in memory only; the KeyStore serializer structurally strips it before any storage write.
- **Mock API layer** — `request<T>()` + `mockFetch<T>()` with a single `VITE_API_URL` swap; typed services for usage, keys, chat, waitlist.
- **Live usage simulator** — Dispatches `ADD_EVENT` every 4s (same action a real WebSocket would dispatch).
- **Derived selectors** — totals, model slices, and deltas are computed, never persisted.

### Added — Design system & motion

- **CSS custom-property token system** — Full light/dark sets via `data-theme`; AI-spend model palette; no-flash inline theme script.
- **Premium gradients** — Theme-aware `mesh-glow` and luminous `aurora` multi-radial gradients; richer 3-stop AI button gradient.
- **Motion** — Bulletproof `Reveal` (set→to with `once:true` + refresh so content is never stranded); breathing images (8s cubic-bezier); pulsing image glow halos; blur-in entrances; GSAP chart/checkout animations.
- **Typography** — Inter (UI) + JetBrains Mono (financial/code).

### Added — Governance & documentation

- `.eslintrc.json` — TypeScript strict, no-explicit-any, react-hooks, import/order.
- `.prettierrc` — 2-space, single quotes, ES5 trailing commas, 100 print width.
- `.gitignore` — node_modules, dist, env, coverage, .vercel.
- `.env.example` — All `VITE_` variables with inline comments.
- `vercel.json` — SPA rewrites + security/cache headers.
- `tsconfig.json` / `tsconfig.node.json` — ES2022, bundler resolution, strict (exact Step 4 settings).
- `README.md` — Setup, env reference, scripts, API integration guide, deployment.
- `docs/Parameter_Schema.md` — Component tree & data-flow reference for the backend team.
- `docs/Security_Key_Flow.md` — Environment variable & API-key security reference.

### Notes

- Frontend only. No backend, database, payment processing, or server logic.
- Production build is a single inlined `dist/index.html` (images inlined as base64 via `vite-plugin-singlefile`).
