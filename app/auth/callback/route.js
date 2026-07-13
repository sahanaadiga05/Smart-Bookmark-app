import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    console.log("CALLBACK: Code found, creating server client...")
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
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )

    console.log("CALLBACK: Exchanging code for session...")
    try {
      const exchangePromise = supabase.auth.exchangeCodeForSession(code)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Session exchange timed out')), 8000)
      )
      
      const result = await Promise.race([exchangePromise, timeoutPromise])
      if (result?.error) {
        console.error("CALLBACK: Error exchanging code:", result.error)
      } else {
        console.log("CALLBACK: Session exchange successful! Redirecting to:", `${origin}${next}`)
        return NextResponse.redirect(`${origin}${next}`)
      }
    } catch (err) {
      console.error("CALLBACK: Exception during code exchange:", err.message)
    }
  } else {
    console.warn("CALLBACK: No code found in URL searchParams")
  }

  console.log("CALLBACK: Redirecting back to home page")
  return NextResponse.redirect(`${origin}/`)
}