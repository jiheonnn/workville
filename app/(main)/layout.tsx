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
  const supabase = createClient()
  const { user, setUser, setLoading } = useAuthStore()

  useEffect(() => {
    checkUser()
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
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
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const checkUser = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser()
    
    if (authUser) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()
      
      if (profile) {
        setUser(profile)
      }
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navItems = [
    { href: '/village', label: '마을', icon: '🏘️' },
    { href: '/logs', label: '업무일지', icon: '📝' },
    { href: '/stats', label: '통계', icon: '📊' },
    { href: '/template', label: '템플릿', icon: '📋' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <nav className="bg-white/80 shadow-lg border-b border-gray-100/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-2xl font-black bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                  Workville
                </h1>
              </div>
              <div className="hidden sm:ml-10 sm:flex sm:space-x-2">
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
      <main className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8 animate-fadeIn">
        {children}
      </main>
    </div>
  )
}
