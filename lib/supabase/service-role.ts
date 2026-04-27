import { createClient } from '@supabase/supabase-js'

import { Database } from '@/types/database'

export function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('SERVICE_ROLE_NOT_CONFIGURED')
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      // 이유: service role 클라이언트는 사용자 세션이 아니라 서버 비밀키로 동작합니다.
      // 세션 저장/자동 갱신을 끄면 서버 런타임에서 불필요한 auth 상태를 만들지 않습니다.
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
