import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'

// Singleton pattern to prevent multiple client instances
let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined

export function createClient() {
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return browserClient
}