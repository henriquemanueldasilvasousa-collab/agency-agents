# Meridian Budget

A personal finance and budgeting dashboard built with Next.js 16 (App Router), TypeScript, and Tailwind CSS. This is a **demo application** — all data is mock/seeded and stored in-memory; there is no real money, real accounts, or real user data.

## Features

- Email/password auth (bcrypt-hashed passwords, JWT session cookie)
- Dashboard with balance, income/expense totals, budget and goal progress
- Transactions: add, edit, delete, categorize
- Budgets: per-category monthly limits with spend tracking
- Savings goals: target amount, progress bar

## Demo login

```
demo@example.com / Password123!
```

A second seeded user (`alice@example.com` / `Password123!`) exists to demonstrate that data is scoped per-user.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

For production-like behavior (required for the E2E/functional test suites, and to get `Secure` cookies), set `SESSION_SECRET` in `.env.local` — see `.env.example`.

## Testing

| Command | What it runs |
| --- | --- |
| `npm run test:unit` | Vitest — pure logic (`lib/calculations.ts`, `lib/validation.ts`) |
| `npm run test:functional` | Vitest — builds the app, boots a production server, and exercises every API route over real HTTP (auth, CRUD, ownership/IDOR, CSRF, rate limiting, validation, security headers) |
| `npm run test:e2e` | Playwright — builds the app, boots a production server, and drives a real Chromium browser through login/signup, transaction/budget/goal CRUD, navigation, a mobile-viewport layout check, and an XSS-escaping check |
| `npm run lint` | ESLint |
| `npm run build` | Production build + TypeScript check |

## Security notes

- Sessions are signed JWTs (`jose`) in an `HttpOnly`, `Secure` (in production), `SameSite=Lax` cookie.
- Every mutating API route re-verifies the session server-side and checks resource ownership before acting (IDOR protection), independent of the optimistic redirect done in `proxy.ts`.
- CSRF: `SameSite=Lax` plus an explicit `Origin`/`Host` check (`assertSameOrigin`) on every state-changing request.
- All input is validated with Zod; free-text fields are trimmed and stripped of control characters before storage.
- Login and signup are rate-limited per IP (+ email, for login) to slow brute-force and enumeration.
- `proxy.ts` sets a nonce-based Content-Security-Policy plus `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, and HSTS on every response.
- Output is rendered through React/JSX (no `dangerouslySetInnerHTML`), so stored text — including HTML/script payloads — is always escaped on render.

`npm audit` reports one moderate advisory in a copy of `postcss` bundled *inside* `next`'s own build tooling (not a direct or top-level dependency). It's exercised only at build time against this repo's own source files, never against user input, and the fix upstream would require downgrading Next.js itself — treated as an accepted, monitored risk rather than something to patch locally.
