# SUWAILIH PROMPT

**Engineer Better Prompts. Get Better AI Results.** — حوّل فكرتك إلى برومبت احترافي.

AI prompt-engineering MVP: rough idea → NVIDIA NIM → structured, professional prompt → copy / save.

## Stack
Next.js 16 (App Router) · TypeScript · Tailwind CSS 3 · Motion · Firebase Auth · Supabase Postgres (RLS) · NVIDIA NIM · Vercel-ready

## Features
- Premium dark landing page with animated AI orb (idle / processing / done), reduced-motion aware
- Firebase Google + Email/Password auth, persistent sessions
- `/engineer`: idea textarea, 9 categories, 4-stage processing animation, Copy / Save / Regenerate
- `/history`: own saved prompts only, open in a modal, delete with confirmation
- English (LTR) + Arabic (RTL) with cookie-persisted language (`lib/i18n.ts`)
- Mobile-first, no horizontal scroll, 44px+ tap targets

## Routes
| Path | Purpose |
|---|---|
| `/` | Landing |
| `/login` | Sign in / sign up (`?next=` supported, open-redirect safe) |
| `/engineer` | Prompt workspace (auth required) |
| `/history` | Saved prompts (auth required) |
| `POST /api/engineer` | Verifies Firebase ID token → calls NVIDIA NIM → `{ prompt }` |
| `POST /api/session` | Verifies token, sets `role: authenticated` custom claim for Supabase |

## Architecture & security
- Browser never talks to NVIDIA. `NVIDIA_NIM_API_KEY` is read only in `lib/nim.ts` (`server-only`).
- `/api/engineer` verifies the Firebase ID token (Admin SDK), rate-limits per uid (12/min, in-memory), validates length (3–2000) and category whitelist.
- Supabase uses **Firebase as a third-party auth provider**: the browser client sends the user's Firebase ID token, and RLS policies compare `auth.jwt()->>'sub'` to `firebase_uid`. The UID is never taken from the client body; it defaults server-side from the JWT. No service-role key exists anywhere in the app.
- Generated text is rendered as React nodes (`components/prompt-text.tsx`), never `dangerouslySetInnerHTML`.
- Errors shown to users are translated, generic messages; details are not leaked.
- Without `NVIDIA_NIM_API_KEY`, `/api/engineer` returns a clearly flagged **mock** prompt (UI shows a "Demo mode" banner). Remove by setting the key.

## Setup
1. `cp .env.example .env.local` and fill in values.
2. **Firebase**: enable Google + Email/Password providers; add your domain to Authorized domains. Create a service account key and set `FIREBASE_ADMIN_CLIENT_EMAIL` / `FIREBASE_ADMIN_PRIVATE_KEY`.
3. **Supabase**: Dashboard → Authentication → *Third-party Auth* → add **Firebase** with your project ID. Then run `supabase/migrations/0001_init.sql` in the SQL editor.
4. **NVIDIA**: get a key at https://build.nvidia.com and set `NVIDIA_NIM_API_KEY` (+ optional `NVIDIA_NIM_MODEL`).
5. `npm install && npm run build && npm start` (or `npm run dev`).

> Why the service account? Supabase's Firebase integration requires the JWT to carry `role: authenticated`. `/api/session` sets that custom claim once after sign-in (the client then refreshes its token).

## Deploy (Vercel)
Import the repo, add every variable from `.env.example` (paste the private key with literal `\n`), deploy. Build uses `next build --webpack`.

## Data model
`profiles(id, firebase_uid, name, email, avatar, created_at)` · `prompts(id, firebase_uid, original_prompt, optimized_prompt, category, created_at)` — RLS: own rows only (prompts: select/insert/delete).

## Not included (by design)
Payments, credits, teams, admin, analytics, agents, vector DB.
