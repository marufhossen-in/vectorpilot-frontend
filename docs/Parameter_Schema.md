# Parameter Schema — Architecture & Data Flow

> **Artifact type:** Architecture diagram (described in text).
> **Audience:** The client's Backend Integration Team.
> **Purpose:** Show the complete component tree and data flow — from props through the state layers to the fetch service and mock JSON — so every typed boundary is unambiguous.

This file replaces `docs/Parameter_Schema.png`. Read it alongside `src/types/` (every interface named below lives there) and `src/lib/api.ts`.

---

## At a glance

```
                                 ┌───────────────────────────────────┐
   src/data/*.ts (mock)          │            DATA LAYER              │
        ▲                        │  request<T>()  ◀── VITE_API_URL    │
        │ mockFetch<T>()         │     │            (empty = mock)    │
        │                        │  usageService · keyService ·       │
        │                        │  chatService · waitlistService     │
        │                        └───────────────┬───────────────────┘
        │                                        │ typed return types
        ▼                                        ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │                       STATE LAYER  (Context + useReducer)       │
   │  AuthStore    UsageStore    KeyStore    WaitlistStore   UIStore │
   │  SessionUser  UsagePoint[]  ApiKey[]    WaitlistState  {theme,  │
   │  status       + ADD_EVENT   + FreshKey                  billing,│
   │                              (memory)                    toasts}│
   │   ─ persisted: aico.session · aico.usage · aico.keys ·          │
   │     aico.waitlist · aico.ui   (usage + keys cross-tab synced)  │
   └───────────────────────────────┬─────────────────────────────────┘
                                   │ selector hooks (useAuth, useUsage,
                                   │ useKeys, useWaitlist, useUI)
                                   ▼
   ┌─────────────────────────────────────────────────────────────────┐
   │                       COMPONENT TREE                            │
   │  AppProviders ─ RouterProvider                                 │
   │   ├─ PublicLayout ─ HomePage / Features / Pricing / ...        │
   │   └─ DashboardLayout (guard: requireAuth loader)               │
   │       ├─ Overview (CostTicker · BarChart · Donut)              │
   │       ├─ KeysPage (RevealOnceBox · MaskedKey)                  │
   │       ├─ Copilot · Projects · Activity · Analytics · Integr.   │
   │       └─ Settings · Profile · Notifications · CommandPalette   │
   └─────────────────────────────────────────────────────────────────┘
```

Color coding: **blue** = state layer · **green** = public components · **amber** = protected components · **grey** = data layer.

---

## Zone 1 — State Layer

Five stores, each a React Context + `useReducer`, persisted to `localStorage`, with derived values computed via selectors (never persisted).

| Store         | State shape (interface)            | Actions                                                          | Persist key     | Selector            |
|---------------|------------------------------------|------------------------------------------------------------------|-----------------|---------------------|
| `AuthStore`   | `{ user: SessionUser \| null; status: AuthStatus; error }` | `LOGIN_START/SUCCESS/FAIL` · `LOGOUT` · `HYDRATE` · `SET_PLAN` | `aico.session`  | `useAuth()`         |
| `UsageStore`  | `{ points: UsagePoint[] }` (1440 cap) | `ADD_EVENT` · `REPLACE_FROM_STORAGE`                          | `aico.usage`    | `useUsage()` / `useTotals()` |
| `KeyStore`    | `{ keys: ApiKey[]; fresh: FreshKey \| null }` | `CREATE` · `REVOKE` · `DISMISS_FRESH` · `REPLACE_FROM_STORAGE` | `aico.keys` | `useKeys()` |
| `WaitlistStore` | `WaitlistState`                  | `JOIN` · `CONFIRMED`                                             | `aico.waitlist` | `useWaitlist()`     |
| `UIStore`     | `{ theme; billing; toasts: Toast[] }` | `SET_THEME` · `SET_BILLING` · `TOAST_ADD/REMOVE`           | `aico.ui`       | `useUI()`           |

**Derived, never stored:** `UsageTotals` (today/month/limit/delta), `ModelSlice[]` (model split), `LiveCostState.pulsing`.

---

## Zone 2 — Component Tree (props at each boundary)

- `AppProviders` → wraps all five store providers; renders `RouterProvider`.
- `PublicLayout` → `Navbar` + `<Outlet/>` + `Footer`.
- `DashboardLayout` → sidebar + topbar + `<Outlet/>`; guarded by the `requireAuth` loader. Holds `PlanBadge`, `CommandPalette`, `Logo` (dashboard nav logic).
- Feature components receive typed props and call store actions / services:

```
DashboardHomePage
  ├─ StatCard            { label, value, deltaPct, tone, subText? }
  ├─ CostTicker          (reads useUsage)
  ├─ CostSnapshot        { onUpgrade }            ← Free system
  ├─ SpendOptimizer      { slices: ModelSlice[], monthUsd, onExport }  ← Pro system
  ├─ BarChart            { points: UsagePoint[], range }
  ├─ Donut               { slices: ModelSlice[] }
  └─ UpgradeModal        { open, onClose }        → AuthStore.upgrade(plan)
```

---

## Zone 3 — Data Layer (the swap boundary)

`request<T>(path, init?)`:
- If `VITE_API_URL` is set → real `fetch` to `${BASE}${path}`.
- If empty → `mockFetch<T>(path)` resolves from `src/data/mock.ts` after a short delay.

Both paths return the **same TypeScript types**, so swapping backend ⇄ mock requires **zero component changes**:

```
VITE_API_URL set ─┐
                   ├─→ request<T>() ─→ { UsagePoint[] | ApiKey[] | ChatSession[] | ... }
mock data ──────── ┘
```

### Endpoints to implement (backend)

| Method | Path               | Returns (`src/types/`)             |
|--------|--------------------|------------------------------------|
| GET    | `/usage?range=`    | `UsagePoint[]`                     |
| GET    | `/usage/totals`    | `UsageTotals`                      |
| GET    | `/keys`            | `ApiKey[]` (masked, no `fullKey`)  |
| POST   | `/keys`            | `ApiKey & FreshKey` (full key once)|
| POST   | `/keys/:id/revoke` | `ApiKey`                           |
| GET    | `/chat/sessions`   | `ChatSession[]`                    |
| GET    | `/chat/demo`       | `ChatTurn[]`                       |
| POST   | `/waitlist`        | `{ confirmed: boolean; position: number }` |

### Realtime feed

WebSocket messages map 1:1 to the store action:

```ts
dispatch({ type: 'ADD_EVENT', point: UsagePoint });  // identical in mock and live modes
```
