# Deploying Ad Astra

Three independent pieces: a Supabase project (database + auth), a GitHub
repo (source of truth), and a Vercel project (hosting, builds from GitHub).
None of them depend on the others being done first, but this order avoids
back-and-forth.

## 1. Supabase

1. Create a project at supabase.com (or via the Supabase connector in this
   chat, if you connect it).
2. In the SQL editor, run `supabase/migrations/0001_phase1_core_universe.sql`.
   This creates `stars`, `constellations`, `tasks`, `app_settings`, and
   turns on row-level security scoped to `auth.uid()`.
3. In Authentication → Providers, Email is enabled by default — that's all
   this app uses (magic link, no password). In Authentication → URL
   Configuration, add your Vercel URL (and `http://localhost:5173` for
   local dev) to Redirect URLs, or the magic link will bounce.
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
4. Once deployed, add the Vercel URL to Supabase's redirect URLs (step 1.3
   above) — magic links won't work until you do.

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
