import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'

let client: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createClient() {
  // 이유: `createBrowserClient`는 브라우저 전용 API(document.cookie)에 의존하므로,
  // 서버 렌더링 중 호출되면 dev 서버에서 브라우저 스토리지 관련 예외가 날 수 있습니다.
  if (typeof window === 'undefined') {
    throw new Error('Supabase browser client must be created in the browser.')
  }

  if (!client) {
    client = createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  return client
}
