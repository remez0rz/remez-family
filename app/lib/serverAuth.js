import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Server-side guard for API routes. Reads the Supabase session from cookies and
// confirms it belongs to an ACTIVE whitelisted profile — same rule as the login
// callback. Returns the profile ({ id, role }) or null. Routes that mutate or
// reach out to the network should refuse when this returns null.
export async function getAuthedProfile() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        // Route handlers can't always set cookies; no-op is fine here since we
        // only read the session, never refresh it.
        setAll() {},
      },
    }
  )

  // getUser() verifies the JWT with Supabase, unlike getSession() which trusts
  // whatever is in the cookie — important for an auth gate.
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('email', user.email)
    .eq('active', true)
    .maybeSingle()

  return profile || null
}
