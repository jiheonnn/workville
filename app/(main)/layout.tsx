'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import TeamSwitcher from '@/components/team/TeamSwitcher'
import { useAuthStore } from '@/lib/stores/auth-store'
import { useActivityPing } from '@/hooks/useActivityPing'
import { getCharacterImagePath } from '@/lib/character-utils'
import { MAIN_NAV_ITEMS } from '@/lib/navigation/main-nav'
import { shouldHideMainNavigation } from '@/lib/navigation/layout-visibility'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { user, setUser, setLoading, loadUserFromServer } = useAuthStore()
  const hideMainNavigation = shouldHideMainNavigation(pathname, user?.active_team_id)
  useActivityPing(Boolean(user?.active_team_id))

  useEffect(() => {
    const supabase = createClient()

    setLoading(true)

    const syncUser = async () => {
      // 이유: 헤더 프로필은 브라우저 Supabase 조회 대신 서버 API를 단일 진실 공급원으로 사용해야
      // 팀/인증 상태와 프로필 표시가 서로 다른 경로에서 어긋나지 않습니다.
      await loadUserFromServer()
      setLoading(false)
    }

    void syncUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id)

      if (session?.user) {
        await loadUserFromServer()
      } else {
        setUser(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [loadUserFromServer, setLoading, setUser])

  // 로딩 체크 제거 - 바로 렌더링

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {!hideMainNavigation && (
        <>
          {/* Desktop Navigation - Top Bar */}
          <nav className="hidden sm:block bg-white/80 shadow-lg border-b border-gray-100/50 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-20">
                <div className="flex items-center">
                  <div className="flex-shrink-0 flex items-center">
                    <h1 className="text-2xl font-black bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                      Workville
                    </h1>
                  </div>
                  <div className="ml-10 flex space-x-2">
                    {MAIN_NAV_ITEMS.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`
                          inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                          ${pathname === item.href 
                            ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/25 scale-105' 
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/80'
                          }
                        `}
                      >
                        <span className="mr-2 text-lg">{item.icon}</span>
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <TeamSwitcher />
                  {user && (
                    <Link
                      href="/mypage"
                      className="flex shrink-0 items-center space-x-2 rounded-xl bg-gradient-to-r from-emerald-100 to-green-100 px-4 py-2 transition hover:from-emerald-200 hover:to-green-200"
                      aria-label="마이페이지로 이동"
                    >
                      <div className="w-8 h-8 rounded-full overflow-hidden relative">
                        <Image 
                          src={getCharacterImagePath(user.character_type, 'normal')}
                          alt={user.username}
                          fill
                          sizes="32px"
                          className="object-cover"
                        />
                      </div>
                      <span className="text-sm font-semibold text-gray-800">
                        {user.username}
                      </span>
                      <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-600">
                        Lv.{user.level}
                      </span>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </nav>

          {/* Mobile Header - Title and User Info */}
          <div className="sm:hidden bg-white/80 shadow-lg border-b border-gray-100/50 sticky top-0 z-50">
            <div className="px-4 py-3 flex justify-between items-center">
              <h1 className="text-xl font-black bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                Workville
              </h1>
              <div className="flex items-center space-x-3">
                <TeamSwitcher />
                {user && (
                  <Link
                    href="/mypage"
                    className="flex shrink-0 items-center space-x-2 rounded-lg bg-gradient-to-r from-emerald-100 to-green-100 px-3 py-1.5 transition hover:from-emerald-200 hover:to-green-200"
                    aria-label="마이페이지로 이동"
                  >
                    <div className="w-6 h-6 rounded-full overflow-hidden relative">
                      <Image 
                        src={getCharacterImagePath(user.character_type, 'normal')}
                        alt={user.username}
                        fill
                        sizes="24px"
                        className="object-cover"
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-800">
                      {user.username}
                    </span>
                    <span className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-green-600">
                      Lv.{user.level}
                    </span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <main className={`max-w-7xl mx-auto animate-fadeIn ${hideMainNavigation ? 'py-12 px-4 sm:px-6 lg:px-8' : 'py-8 sm:px-6 lg:px-8 pb-20 sm:pb-8'}`}>
        {children}
      </main>

      {!hideMainNavigation && (
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-200 z-50">
          <div className="flex justify-around py-2">
            {MAIN_NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex flex-col items-center px-3 py-2 rounded-lg transition-all duration-200
                  ${pathname === item.href 
                    ? 'text-emerald-600 scale-110' 
                    : 'text-gray-500 hover:text-gray-700'
                  }
                `}
              >
                <span className="text-2xl mb-1">{item.icon}</span>
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      )}
    </div>
  )
}
