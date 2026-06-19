import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/'

  if (!code) {
    return NextResponse.redirect(`${requestUrl.origin}/login?error=missing_code`)
  }

  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data?.session) {
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=auth_callback_failed`
    )
  }

  const email = data.session.user.email

  // Whitelist = an ACTIVE profile with this email. Deactivating a profile
  // (active = false) fully revokes login, not just hides them from the UI.
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .eq('active', true)
    .maybeSingle()

  if (profileError || !profile) {
    await supabase.auth.signOut()
    return NextResponse.redirect(
      `${requestUrl.origin}/login?error=not_whitelisted`
    )
  }

  return NextResponse.redirect(`${requestUrl.origin}${next}`)
}