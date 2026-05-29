import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function getCurrentProfile() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const email = session.user.email

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('email', email)
    .single()

  return profile
}