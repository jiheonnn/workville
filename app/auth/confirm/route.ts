import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

function getSafeNextPath(next: string | null) {
  if (!next) {
    return '/character-select'
  }

  // 이유:
  // 리다이렉트 파라미터는 사용자가 제어할 수 있으므로 외부 도메인으로 보내지 않도록
  // 앱 내부 경로만 허용합니다.
  if (next.startsWith('/')) {
    return next
  }

  try {
    const url = new URL(next)
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return '/character-select'
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const nextPath = getSafeNextPath(searchParams.get('next'))

  if (tokenHash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    })

    if (!error) {
      return NextResponse.redirect(new URL(nextPath, request.url))
    }
  }

  return NextResponse.redirect(new URL('/login?error=email_confirmation_failed', request.url))
}
