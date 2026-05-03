import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  // FIX: Force Windows to use localhost instead of Docker's 0.0.0.0
  const safeOrigin = origin.replace('0.0.0.0', 'localhost')

  if (code) {
    const cookieStore = await cookies()
    
    // Create a secure server-side Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // Ignore if called from a Server Component
            }
          },
        },
      }
    )
    
    // Exchange the URL code for a secure login session
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Send them to the safe localhost URL
      return NextResponse.redirect(`${safeOrigin}${next}`)
    }
  }

  // If something goes wrong, send them home safely
  return NextResponse.redirect(`${safeOrigin}/`)
}