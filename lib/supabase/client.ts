import { createBrowserClient } from '@supabase/ssr'

/**
 * Browser-side Supabase client.
 * Uses createBrowserClient from @supabase/ssr so the auth session is stored
 * in cookies (not localStorage). This is required for the middleware to read
 * the session server-side and protect routes correctly.
 */
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
