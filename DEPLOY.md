# Deploying Ad Astra

Three independent pieces: a Supabase project (database + auth), a GitHub
repo (source of truth), and a Vercel project (hosting, builds from GitHub).
None of them depend on the others being done first, but this order avoids
back-and-forth.

## 1. Supabase

1. Create a project at supabase.com (or via the Supabase connector in this
   chat, if you connect it).
2. In the SQL editor, run the migrations in `supabase/migrations/` in
   order (`0001` through `0005`). This creates all tables and turns on
   row-level security scoped to `auth.uid()`.
3. Email/password auth (Authentication → Providers → Email) is on by
   default — no extra config needed for password sign-in. You can create
   your first user right in Authentication → Users → Add user (check
   "Auto Confirm User" so it's usable immediately, no confirmation email).
   If you'd rather let people sign up from the app itself, that works
   too — see the note on email confirmation below.
4. Copy Project URL and anon public key from Settings → API.

## 2. GitHub

```bash
cd ad-astra
git remote add origin https://github.com/<you>/ad-astra.git
git branch -M main
git push -u origin main
```

(The repo is already initialized locally with the Phase 1 commit — this
just adds a remote and pushes it.)

## 3. Vercel

1. Import the GitHub repo in Vercel — it auto-detects Vite via
   `vercel.json`, no config needed.
2. Add environment variables (Project Settings → Environment Variables):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
3. Deploy. Without those two variables the app still deploys and runs — it
   just falls back to local-only mode (see below).

Nothing else to configure — email/password auth doesn't depend on the
deployed URL the way magic links did.

## A note on email confirmation

By default, a fresh Supabase project requires confirming a new sign-up's
email before it can sign in. Two ways to avoid the confirmation-email
rate limits and redirect issues that come with Supabase's free-tier email
sending:

- **Create users yourself** in the dashboard (Authentication → Users →
  Add user, with "Auto Confirm User" checked) — no email sent at all,
  works immediately. Good for a personal app with a small, known set of
  users.
- **Turn off "Confirm email"** (Authentication → Providers → Email) if
  you want the in-app "Sign up" form to work for anyone without an email
  round-trip. Fine for a personal project; reconsider before opening
  sign-ups to the public.

## Local-only mode

If `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` aren't set (no
`.env.local`, or not set in Vercel), the app runs entirely on
`localStorage` — no auth screen, no network calls, works offline. This is
the default for a fresh `npm install && npm run dev`. Useful for demos or
if you don't want an account system yet; switch to Supabase whenever
you're ready by copying `.env.example` to `.env.local` and filling it in.

## Installing as a PWA

Once deployed over HTTPS (Vercel gives you this automatically):

- **Android (Chrome)**: visit the site → menu → "Install app" (or Chrome
  shows an install prompt automatically after a visit or two).
- **iOS (Safari)**: visit the site → Share → "Add to Home Screen". iOS
  doesn't support Chrome's install-prompt API, so this is always manual.
- **Desktop (Chrome/Edge)**: an install icon appears in the address bar.

The manifest and icons are already wired up (`vite.config.ts` →
`VitePWA`) — nothing more to configure.
