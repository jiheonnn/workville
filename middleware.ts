import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
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

  console.log('Middleware - Path:', request.nextUrl.pathname)
  console.log('Middleware - User:', user?.id)
  console.log('Middleware - Auth Error:', authError)

  // 보호된 라우트 체크
  if (
    !user &&
    (request.nextUrl.pathname.startsWith('/village') ||
      request.nextUrl.pathname.startsWith('/logs') ||
      request.nextUrl.pathname.startsWith('/stats'))
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 로그인한 유저가 인증 페이지 접근 시 리다이렉트
  if (
    user &&
    (request.nextUrl.pathname === '/login' ||
      request.nextUrl.pathname === '/signup')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/village'
    return NextResponse.redirect(url)
  }

  // 캐릭터 선택하지 않은 유저 체크
  if (user && request.nextUrl.pathname !== '/character-select') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('character_type')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.character_type) {
      const url = request.nextUrl.clone()
      url.pathname = '/character-select'
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