# SUWAILIH PROMPT

Engineer Better Prompts. Get Better AI Results. — turns a rough idea into a structured, ready-to-use prompt using **NVIDIA NIM** (free, server-paid) **or your own AI provider key** (OpenAI, Anthropic, Gemini, OpenRouter, Groq, Mistral, DeepSeek, xAI, Together, Cerebras).

## Stack
Next.js 16 (App Router, webpack build) · React 19 · TypeScript · Tailwind 3 · Motion · Firebase Auth · Supabase Postgres · NVIDIA NIM.

## Architecture
```
Browser ──(Firebase ID token)──► Next.js API routes ──► NVIDIA NIM   (SSE streaming, retry + fallback model)
                                       └─────────────► Supabase       (service role, scoped by verified firebase uid)
```
- **Auth:** Firebase (Google + Email/Password). Every API route verifies the ID token server-side with `firebase-admin`.
- **Database:** all reads/writes go through `/api/prompts`. The user id comes ONLY from the verified token, never from the client. The service-role key is server-only. RLS is enabled on both tables as defense-in-depth (the publishable key can't read or write — verified). *Supabase "Third-party Auth → Firebase" is therefore **not required**.*
- **AI:** `/api/engineer` streams tokens (SSE). Default NVIDIA `openai/gpt-oss-20b` (low reasoning), automatic retry then fallback `nvidia/nemotron-3-super-120b-a12b` if no token was produced. Arabic ideas produce Arabic prompts.

## Models & providers (bring your own key)
The Engineer page has an **AI model** panel: pick a provider, a preset model or **Custom model…** (any model id the provider offers), and paste your own API key.

| Provider | Kind | Key needed |
|---|---|---|
| NVIDIA NIM (`gpt-oss-20b`, `nemotron-3-super-120b`) | OpenAI-compatible | No (server-paid, allowlisted models) |
| OpenAI, OpenRouter, Groq, Mistral, DeepSeek, xAI, Together, Cerebras | OpenAI-compatible | Yes |
| Anthropic (Claude) | Messages API | Yes |
| Google Gemini | `streamGenerateContent` | Yes |

### How user keys are protected (never leaked)
- The browser sends **only a provider id** — never a URL. Endpoints are a fixed server-side allowlist (no SSRF). Model ids are validated (`^[A-Za-z0-9][A-Za-z0-9._:/@+-]{0,119}$`, no `..`).
- The key travels **only** in the `x-user-api-key` request header to our own `/api/engineer` (never URL / query / body / cookie), over HTTPS.
- Server keeps it in a local variable for the single request: **never stored in the DB, never logged** (logs contain only `provider + error code`), never echoed back.
- Upstream is called with `redirect: "error"`; upstream error bodies are **never forwarded** to the client (only classified into `key` / `model` / generic).
- Gemini key is sent in the `x-goog-api-key` header, not in the URL.
- Client: key lives in **React memory only** by default (gone on refresh). Only if the user ticks **Remember on this device** is it kept in `localStorage` of that browser (untick = deleted). Non-secret prefs (provider/model) are stored separately. Inputs use `autocomplete=off`, `referrerPolicy=no-referrer`, `cache: no-store`.
- Strict **CSP** (`connect-src 'self'` + Firebase/Google only) so injected scripts can't ship a key to a third-party host.
- Verified with canary-key tests against all 10 real providers: 0 occurrences in responses, headers or server logs.

## Endpoints
| Route | Purpose |
|---|---|
| `POST /api/engineer` `{idea, category, provider?, model?}` + header `x-user-api-key` (non-NVIDIA) | SSE stream: `{"d":"…"}`, `{"mock":true}`, `{"done":true}`, `{"error":"ai\|key\|key_missing\|model\|provider_rate\|invalid\|busy\|rate\|auth"}` |
| `GET /api/prompts?limit=20&before=<iso>` | own history, cursor pagination |
| `POST /api/prompts` `{original, optimized, category}` | save (max 1000 per user) |
| `DELETE /api/prompts?id=<uuid>` | delete own row only |

## Scalability / protection
- Streaming responses (no 60 s blocking wait), upstream timeouts, client-abort frees the slot.
- IP limit (60/min) before token verification, per-user limits (engineer 10/min, prompts 120/min).
- Concurrency gate for LLM calls with bounded queue (`ENGINEER_MAX_CONCURRENT`, `ENGINEER_MAX_QUEUE`) → clean `503 busy` instead of collapsing.
- Paginated history, indexed query `(firebase_uid, created_at desc)`, `private, no-store` on user data.
- **Measured locally (1 GB sandbox, single process):** 3,600 mixed requests at 60–100 concurrency, 0 failures; landing ≈77 rps, API reject path ≈520 rps.
- ⚠ The limiters are **per instance (in memory)**. On Vercel (many instances) swap `lib/rate-limit.ts` / `lib/limiter.ts` for Upstash Redis / Vercel KV for global limits. The NVIDIA free tier itself has an upstream quota — for thousands of *concurrent generations* use a paid NIM plan / self-hosted NIM.

## UI (21st.dev components)
Components in `components/ui/` come from 21st.dev authors (MIT), adapted to Tailwind 3 / dark-only / RTL / reduced-motion:
Aceternity UI — Background Beams, Spotlight, Text Generate Effect, Hover Border Gradient · Kokonut UI — Spotlight Cards (3D tilt), Shimmer Text · plus marquee, aurora and scroll-progress. Heavy SVG animation is disabled on mobile and for `prefers-reduced-motion`.

## Setup
```bash
cp .env.example .env.local   # fill values
npm install
npm run build && npm start   # http://localhost:3000
```
Run `supabase/migrations/0001_init.sql` once in the Supabase SQL editor. Env names are in `.env.example` (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NVIDIA_NIM_API_KEY`, optional `NVIDIA_NIM_MODEL`, `NVIDIA_NIM_FALLBACK_MODEL`).
In Firebase Console add your production domain to **Authentication → Settings → Authorized domains**.

## Deploy (Vercel)
Import the repo, add the env vars above, deploy. (`maxDuration = 60` on `/api/engineer`.)

## Security notes
No secrets in client code; input validated and length-limited; output rendered as text (no `dangerouslySetInnerHTML`); security headers in `next.config.ts`; errors are generic. User-supplied keys are never persisted server-side (see above). **Rotate any key that was pasted into chat** (Firebase service account, NVIDIA key, Supabase service-role).
