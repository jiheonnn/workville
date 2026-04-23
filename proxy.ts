import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })
  const pathname = request.nextUrl.pathname
  const isApiRoute = pathname.startsWith('/api/')

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()

  console.log('Proxy - Path:', pathname)
  console.log('Proxy - User:', user?.id)
  console.log('Proxy - Auth Error:', authError)

  if (
    !user &&
    (pathname.startsWith('/village') ||
      pathname.startsWith('/mypage') ||
      pathname.startsWith('/team') ||
      pathname.startsWith('/logs') ||
      pathname.startsWith('/stats') ||
      pathname.startsWith('/template'))
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && pathname !== '/character-select') {
    // # 이유: 캐릭터 선택 전에도 /api/me 같은 API는 캐릭터를 저장하기 위해 호출되어야 합니다.
    // 여기서 리다이렉트해 버리면 PATCH 메서드가 유지된 채 /character-select 로 이동해 405가 발생합니다.
    if (isApiRoute) {
      return supabaseResponse
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('character_type, active_team_id')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.character_type) {
      const url = request.nextUrl.clone()
      url.pathname = '/character-select'
      return NextResponse.redirect(url)
    }

    if (
      pathname === '/login' ||
      pathname === '/signup'
    ) {
      const url = request.nextUrl.clone()
      url.pathname = profile.active_team_id ? '/village' : '/team'
      return NextResponse.redirect(url)
    }

    if (
      !profile.active_team_id &&
      pathname !== '/team' &&
      pathname !== '/mypage'
    ) {
      const url = request.nextUrl.clone()
      url.pathname = '/team'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
