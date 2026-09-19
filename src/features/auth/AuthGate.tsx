import { useEffect, useState, type ReactNode } from 'react'
import { isSupabaseConfigured, supabase } from '@/lib/supabaseClient'
import { setStore } from '@/lib/db'
import { SupabaseStore } from '@/lib/db/supabaseStore'
import { AuthContext, type AuthState } from './AuthContext'

interface Props {
  children: ReactNode
}

export function AuthGate({ children }: Props) {
  // Local mode: no Supabase env vars configured at build time. The app
  // works fully offline against localStorage — this is the default for
  // `npm run dev` with no setup, and stays true until VITE_SUPABASE_URL /
  // VITE_SUPABASE_ANON_KEY are provided (see .env.example).
  if (!isSupabaseConfigured || !supabase) {
    return <AuthContext.Provider value={{ mode: 'local' }}>{children}</AuthContext.Provider>
  }

  return <SupabaseAuthGate>{children}</SupabaseAuthGate>
}

function SupabaseAuthGate({ children }: Props) {
  const client = supabase!
  const [state, setState] = useState<'checking' | 'signed_out' | 'signed_in'>('checking')
  const [authState, setAuthState] = useState<AuthState | null>(null)
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function apply(userId: string | undefined, userEmail: string | undefined) {
      if (!userId) {
        if (mounted) setState('signed_out')
        return
      }
      setStore(new SupabaseStore(client, userId))
      if (mounted) {
        setAuthState({
          mode: 'supabase',
          email: userEmail,
          signOut: () => client.auth.signOut(),
        })
        setState('signed_in')
      }
    }

    client.auth.getUser().then(({ data }) => apply(data.user?.id, data.user?.email))

    const { data: sub } = client.auth.onAuthStateChange((_event, session) => {
      apply(session?.user?.id, session?.user?.email)
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [client])

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const { error } = await client.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) setError(error.message)
    else setSent(true)
  }

  if (state === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-moon-dim">
        Checking sign-in…
      </div>
    )
  }

  if (state === 'signed_out') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-sm w-full space-y-4">
          <div className="flex items-center gap-2 justify-center">
            <img src="/icon-192.png" alt="" className="w-8 h-8 rounded-md" />
            <h1 className="font-display text-xl text-moon">Ad Astra</h1>
          </div>

          {sent ? (
            <p className="text-sm text-moon-dim text-center">
              Check <span className="text-moon">{email}</span> for a sign-in link.
            </p>
          ) : (
            <form className="space-y-3" onSubmit={sendMagicLink}>
              <input
                type="email"
                required
                autoFocus
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-hairline bg-night rounded-lg px-3 py-2.5 text-sm text-moon placeholder:text-moon-dim/60"
              />
              <button
                type="submit"
                className="w-full rounded-lg px-3 py-2.5 text-sm bg-gold text-night font-medium"
              >
                Send sign-in link
              </button>
              {error && <p className="text-xs text-red-400">{error}</p>}
            </form>
          )}
        </div>
      </div>
    )
  }

  return <AuthContext.Provider value={authState!}>{children}</AuthContext.Provider>
}
