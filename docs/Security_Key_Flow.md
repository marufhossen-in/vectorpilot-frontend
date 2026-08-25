# Security — Environment Variable & API Key Flow

> **Artifact type:** Security diagram (described in text).
> **Audience:** The client's Security Review Team and any developer integrating the key-issuance endpoint.
> **Purpose:** Show the environment-variable boundary and the full API-key lifecycle, making explicit **what is safe to persist** and **what must never be committed, stored, or logged**.

This file replaces `docs/Security_Key_Flow.png`. The implementation lives in `src/store/AppStores.tsx` (`KeyStore`) and `src/lib/api.ts`.

Legend: 🟢 safe · 🔴 never.

---

## Swim lane 1 — Environment variable boundary

```
.env.example            .env.local                 Vite build               Browser bundle
(committed, no values)  (gitignored, real values)  (VITE_ prefix check)     (served to client)
        │                       │                         │                         │
        └──────────────────────▶│                         │                         │
                                └────────────────────────▶│                         │
                                                          │  only VITE_* exposed    │
                                                          └────────────────────────▶│
                                                                                     │
   🟢 VITE_API_URL  (a URL, not a secret — confirm backend uses token auth, never
      secrets embedded in the URL)
   🟢 VITE_APP_NAME, VITE_ENABLE_* flags, VITE_ANALYTICS_KEY (public write key)
```

**Rule:** Any value that must stay secret must **not** use the `VITE_` prefix — Vite inlines every `VITE_` variable into the browser bundle. Secrets belong to the backend.

---

## Swim lane 2 — API key creation path 🟢 (safe)

```
POST /keys ────────────────────────────────────────────────────────────────────────┐
   response: { ...ApiKey, fullKey }                                                  │
        │                                                                            │
        ▼                                                                            │
  KeyStore.dispatch({ type:'CREATE', created, fresh })  ← FreshKey in memory ONLY   │
        │                                                                            │
        ├─▶ RevealOnceBox renders fullKey exactly once  🟢                          │
        │        │                                                                   │
        │        └─▶ user copies to clipboard  🟢                                    │
        │                                                                            │
        └─▶ DISMISS_FRESH  →  fullKey leaves memory permanently  🟢                 │
                                                                                     │
  persistence serializer: JSON.stringify({ keys })  ← fresh NEVER written  🟢       │
        │                                                                            │
        ▼                                                                            │
  localStorage['aico.keys'] = [{ ...ApiKey (masked) }]  (prefix + last4 only)  🟢   │
                                                    │________________________|     │
                                                     sk-aico-••••3f9a persisted
```

**Why it's safe:** the `FreshKey` (full key) exists only in reducer state for the seconds between creation and copy. The persistence wrapper structurally omits `fresh`, so the full key cannot reach `localStorage` by design.

---

## Swim lane 3 — API key display path 🟢 (safe)

```
localStorage['aico.keys']  ─▶  KeyStore.keys[]  ─▶  MaskedKey  ─▶  renders
   sk-aico-••••3f9a                                                sk-aico-••••3f9a

   🟢 fullKey is NEVER read back — it is not in storage and not in memory after DISMISS_FRESH.
   🟢 Cross-tab sync uses the masked payload only.
```

---

## Swim lane 4 — Danger zone 🔴 (never allowed)

| 🔴 Never                                                    | Why                                                       |
|-------------------------------------------------------------|-----------------------------------------------------------|
| `FreshKey` serialized to `localStorage`                     | Persistent secrets are exposed to any XSS / extension.    |
| `fullKey` written to `console`, error reports, or analytics | Logs and telemetry leak secrets to third parties.         |
| Embedding the full key in a `VITE_` variable                | `VITE_` values are inlined into the public browser bundle.|
| Storing a secret (DB password, signing key) in `VITE_*`     | Same reason — browser-visible.                            |
| Returning the full key again from `GET /keys`               | Breaks reveal-once; re-exposes a supposed-deleted secret. |

### Hard guarantees in code

- The `KeyStore` persistence serializer is `JSON.stringify({ keys })` — `fresh` is **structurally excluded**.
- `REPLACE_FROM_STORAGE` always sets `fresh: null` — a hydration from storage can never restore a full key.
- `GET /keys` (mock and the documented contract) returns `ApiKey[]` only (masked). The full key is returned **only** by the single `POST /keys` creation response.

---

## Security checklist (deploy)

- [ ] `.env.local` is gitignored and **not** committed (verify in CI).
- [ ] No `VITE_` variable contains a secret; backend auth is token-based.
- [ ] `POST /keys` returns the full key exactly once; `GET /keys` returns masked keys.
- [ ] Security headers present (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`) — see `vercel.json`.
- [ ] Confirm no full API key appears in logs, analytics, or error reports.
