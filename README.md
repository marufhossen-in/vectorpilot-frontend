# VectorPilot

**AI Copilot SaaS — animated marketing site + live, plan-gated operations dashboard.**
`SAA-FE-BP-2026 · v1.0.0`

Frontend only. No backend, database, payment processing, or server logic.

---

## Stack

| Layer     | Technology                  | Version    |
|-----------|-----------------------------|------------|
| Build     | Vite                        | 7          |
| Framework | React                       | 19         |
| Language  | TypeScript                  | 5.9 strict |
| Styling   | Tailwind CSS                | v4         |
| Routing   | React Router DOM            | v7         |
| Animation | GSAP Core + ScrollTrigger   | latest     |
| Icons     | Lucide React                | latest     |
| Forms     | React Hook Form + Zod       | latest     |

---

## Quick start

### Prerequisites

- Node.js ≥ 20
- npm ≥ 10

### Install & run

```bash
npm install
npm run dev      # http://localhost:5173
```

With `VITE_API_URL` empty, all data is served from in-memory mock data — no backend required.

### Demo accounts (mock)

- **Sign up** with any plan: Starter (Free) → dashboard; Pro/Team → payment flow → dashboard.
- **Login** accepts any email + an 8-character password, or use **Continue with Google (demo)**.
- Inside the dashboard, use **⌘K** (or the Search button) to open the command palette, and **Upgrade to Pro** to unlock the full experience live.

---

## npm scripts

| Script     | Command        | Description                                   |
|------------|----------------|-----------------------------------------------|
| `dev`      | `vite`         | Start dev server with HMR (active)            |
| `build`    | `vite build`   | Production build → `dist/index.html` (active) |
| `preview`  | `vite preview` | Preview the production build locally (active) |

The production build is a single, self-contained `dist/index.html` (CSS, JS, and images are inlined via `vite-plugin-singlefile`).

### Optional tooling (governance configs provided)

These require installing the corresponding devDependencies, then run via `npx`:

```bash
npx tsc --noEmit                 # strict type-check (tsconfig.json — exact Step 4 settings)
npx eslint .                     # lint (see .eslintrc.json)
npx prettier --check src         # format check (see .prettierrc)
```

> Note: `npm run build` uses Vite's esbuild transpiler (no blocking type-check). The strict `tsconfig.json` is provided for CI/editor type-checking.

---

## Environment variables

Copy `.env.example` to `.env.local`. Only `VITE_`-prefixed variables reach the browser bundle. **Never commit real values.**

| Variable                     | Required | Default       | Description                                              |
|------------------------------|----------|---------------|----------------------------------------------------------|
| `VITE_API_URL`               | No       | _empty_       | Backend REST API base URL. Empty = mock mode.            |
| `VITE_WS_URL`                | No       | _empty_       | WebSocket endpoint for the live usage feed. Empty = 4s simulator. |
| `VITE_APP_NAME`              | No       | `VectorPilot` | App display name.                                        |
| `VITE_APP_VERSION`           | No       | `1.0.0`       | App version (matches CHANGELOG).                         |
| `VITE_ENABLE_MOCK_SIMULATOR` | No       | `true`        | Live cost simulator (4s `ADD_EVENT`).                    |
| `VITE_ENABLE_WAITLIST`       | No       | `true`        | Show the waitlist capture section.                       |
| `VITE_ENABLE_COPILOT`        | No       | `true`        | Enable the Copilot dashboard section.                    |
| `VITE_ENABLE_TEAM`           | No       | `true`        | Enable team management in Settings.                      |
| `VITE_ANALYTICS_KEY`         | No       | _empty_       | Analytics write key (Segment / PostHog).                 |
| `VITE_DEV_TOOLS`             | No       | `false`       | Show the developer tools overlay.                        |

---

## Architecture overview

```
src/
├── app/providers + router      Stores context · createBrowserRouter · loaders
├── store/AppStores.tsx         AuthStore · UsageStore · KeyStore · WaitlistStore · UIStore (Context + useReducer, persisted, cross-tab)
├── lib/                        api.ts (request/mock swap) · utils.ts (money/mask/clipboard) 
├── data/mock.ts                Typed mock data + usage seed/simulator
├── hooks/                      Reveal · useTypewriter · AnimatedNumber · useMockUsageSimulator · useCopy
├── components/                 ui.tsx · charts.tsx · shared.tsx · CommandPalette.tsx
├── features/                   landing · dashboard · keys · auth · account · plans · workspaces
├── pages/public.tsx            Features · About · Help · Waitlist · 404
└── router.tsx                  Route map + loader-based guards
```

**Data flow:** `mock data → request<T>() → service → store reducer → selector → component`. Set `VITE_API_URL` and the identical services hit your real backend — zero component changes.

**State persistence keys:** `aico.session`, `aico.usage`, `aico.keys`, `aico.waitlist`, `aico.ui`. Usage and Keys sync across tabs via the `storage` event.

---

## API integration guide (for the backend team)

The frontend is built for a zero-refactor backend swap. Set one variable:

```bash
# .env.local
VITE_API_URL=https://api.yourbackend.com
```

`request<T>()` in `src/lib/api.ts` routes to your API automatically. Implement these endpoints to match the shapes in `src/types/`:

| Method | Path               | Response                                  | Notes                          |
|--------|--------------------|-------------------------------------------|--------------------------------|
| `GET`  | `/usage`           | `UsagePoint[]`                            | Filterable by `?range=7d\|30d` |
| `GET`  | `/usage/totals`    | `UsageTotals`                             | Derived totals                 |
| `GET`  | `/keys`            | `ApiKey[]`                                | Masked only — never `fullKey`  |
| `POST` | `/keys`            | `ApiKey & FreshKey`                       | Returns full key **exactly once** |
| `POST` | `/keys/:id/revoke` | `ApiKey`                                  | Returns updated key            |
| `GET`  | `/chat/sessions`   | `ChatSession[]`                           |                                |
| `GET`  | `/chat/demo`       | `ChatTurn[]`                              | Landing demo script            |
| `POST` | `/waitlist`        | `{ confirmed: boolean; position: number }`|                                |

### Realtime usage feed

The live cost ticker is driven by `UsageStore.dispatch({ type: 'ADD_EVENT', point })`. Connect a WebSocket and dispatch the same action — the ticker, chart, and donut require no changes:

```ts
const ws = new WebSocket(import.meta.env.VITE_WS_URL);
ws.onmessage = (e: MessageEvent) => {
  const point = JSON.parse(e.data as string) as UsagePoint;
  dispatch({ type: 'ADD_EVENT', point });
};
```

Full architecture details: `docs/Parameter_Schema.md`. Security boundaries: `docs/Security_Key_Flow.md`.

---

## Plan model (Free vs Pro)

| Capability           | Free                          | Pro / Team                       |
|----------------------|-------------------------------|----------------------------------|
| Cost tracking        | Manual snapshot, 3/day        | Live ticker (real-time events)   |
| Spend optimization   | Locked                        | AI Spend Optimizer + CSV export  |
| History              | 7 days                        | 30 days                          |
| Copilot              | 5 messages/day                | Unlimited + context + quick actions |
| Projects             | 1, no budgets                 | Unlimited + per-project budgets  |
| Analytics            | 7-day, no metrics             | 30-day + latency/quality         |
| Integrations         | 1 connector                   | All + retryable webhooks         |

Upgrading switches the plan in place; the dashboard re-renders to the unlocked experience immediately.

---

## Deployment (Vercel)

1. Push to GitHub and import the repo in Vercel.
2. Set environment variables in **Settings → Environment Variables** (see `.env.example`).
3. Deploy. `vercel.json` provides SPA rewrites and security/cache headers.

### Smoke test (post-deploy)

- [ ] Landing loads; typewriter + chat demo + breathing images animate.
- [ ] Pricing toggle swaps monthly/annual; plan hover is dynamic.
- [ ] Signup (Starter) → dashboard shows the Free Cost Snapshot + locked optimizer.
- [ ] Upgrade to Pro → live ticker, AI optimizer, donut, and CSV export activate.
- [ ] ⌘K command palette navigates between pages.
- [ ] API keys: create → reveal-once → copy → revoke; full key never reappears.
- [ ] Theme toggle switches light/dark with no animation bleed.

---

## License

Frontend demo only. © 2026 VectorPilot · SAA-FE-BP-2026.
