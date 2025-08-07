'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/auth-store'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, setUser, isLoading, setLoading } = useAuthStore()

  useEffect(() => {
    const supabase = createClient()
    
    // Set loading to true at the start
    setLoading(true)
    
    const checkUser = async () => {
      console.log('checkUser started')
      try {
        // Use getSession instead of getUser for better reliability
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        console.log('Session check:', session?.user?.id, sessionError)
        
        if (sessionError) {
          console.error('Session error in checkUser:', sessionError)
          setLoading(false)
          return
        }
        
        if (session?.user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          console.log('Profile fetched:', profile, profileError)
          
          if (profileError) {
            console.error('Profile fetch error:', profileError)
          } else if (profile) {
            setUser(profile)
          }
        }
      } catch (error) {
        console.error('Unexpected error in checkUser:', error)
      } finally {
        console.log('checkUser finally - setting loading false')
        setLoading(false)
      }
    }
    
    // Initial user check
    checkUser()
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id)
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        if (profile) {
          setUser(profile)
        }
      } else {
        setUser(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [setUser, setLoading])

  const handleLogout = async () => {
    const supabase = createClient()
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Logout error:', error)
      }
      // Force a full page reload to clear all state and cookies
      window.location.href = '/login'
    } catch (error) {
      console.error('Unexpected logout error:', error)
      // Even if there's an error, redirect to login
      window.location.href = '/login'
    }
  }

  const navItems = [
    { href: '/village', label: '마을', icon: '🏘️' },
    { href: '/logs', label: '업무일지', icon: '📝' },
    { href: '/stats', label: '통계', icon: '📊' },
    { href: '/template', label: '템플릿', icon: '📋' },
  ]

  // 로딩 체크 제거 - 바로 렌더링

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
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
                {navItems.map((item) => (
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
              {user && (
                <>
                  <div className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-100 to-green-100">
                    <div className="w-8 h-8 rounded-full overflow-hidden relative">
                      <Image 
                        src={`/characters/character${user.character_type}/normal.png`}
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
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
                  >
                    로그아웃
                  </button>
                </>
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
          {user && (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-100 to-green-100">
                <div className="w-6 h-6 rounded-full overflow-hidden relative">
                  <Image 
                    src={`/characters/character${user.character_type}/normal.png`}
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
              </div>
              <button
                onClick={handleLogout}
                className="text-xs text-gray-600 hover:text-gray-900"
              >
                로그아웃
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8 animate-fadeIn pb-20 sm:pb-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-200 z-50">
        <div className="flex justify-around py-2">
          {navItems.map((item) => (
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
    </div>
  )
}
