import { type NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

function getSafeNextPath(next: string | null) {
  if (!next) {
    return '/village'
  }

  // 이유:
  // OAuth 공급자가 돌려주는 next 파라미터는 신뢰할 수 없으므로
  // 외부 도메인으로 빠지는 오픈 리다이렉트를 막기 위해 앱 내부 경로만 허용합니다.
  if (next.startsWith('/')) {
    return next
  }

  return '/village'
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const nextPath = getSafeNextPath(requestUrl.searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(new URL(nextPath, request.url))
    }
  }

  return NextResponse.redirect(new URL('/login?error=social_login_failed', request.url))
}
