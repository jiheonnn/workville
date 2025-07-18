import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'

// Singleton pattern to prevent multiple client instances
let browserClient: ReturnType<typeof createBrowserClient<Database>> | undefined

export function createClient() {
  if (!browserClient) {
    browserClient = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const cookies = document.cookie.split(';')
            const cookie = cookies.find(c => c.trim().startsWith(`${name}=`))
            return cookie ? decodeURIComponent(cookie.split('=')[1]) : undefined
          },
          set(name: string, value: string, options?: any) {
            document.cookie = `${name}=${encodeURIComponent(value)}; path=/; ${options?.maxAge ? `max-age=${options.maxAge};` : ''}`
          },
          remove(name: string) {
            document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
          }
        }
      }
    )
  }
  return browserClient
}