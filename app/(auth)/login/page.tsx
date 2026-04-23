'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const authError = searchParams.get('error')

    if (authError === 'social_login_failed') {
      setError('Google 로그인에 실패했습니다. 잠시 후 다시 시도해주세요.')
      setNotice(null)
      return
    }

    if (authError === 'access_denied') {
      setError('Google 로그인 권한이 취소되었거나 만료되었습니다. 다시 시도해주세요.')
      setNotice(null)
      return
    }

    setNotice(null)
  }, [])

  const handleGoogleLogin = async () => {
    setError(null)
    setNotice(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/village`,
        },
      })

      if (error) {
        setError('Google 로그인 연결 중 오류가 발생했습니다.')
      }
    } catch {
      setError('Google 로그인 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="w-full max-w-[28rem]">
      <div className="rounded-[2rem] border border-white/70 bg-white/78 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-8">
        <div className="mb-8 text-center">
          <div className="flex justify-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-[1.9rem] border border-slate-200/90 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.10)]">
              <Image
                src="/icon-512.png"
                alt="Workville 로고"
                width={72}
                height={72}
                priority
                className="h-[4.5rem] w-[4.5rem]"
              />
            </div>
          </div>
          <h1
            className="mt-5 text-4xl font-semibold leading-tight text-slate-950 sm:text-[2.8rem]"
          >
            Workville
          </h1>
          <p className="mt-3 text-base font-medium leading-7 text-slate-700">
            일하는 순간을 더 재밌게,
            <br />
            업무와 기록이 이어지는 공간
          </p>
          <p className="mt-4 text-sm leading-6 text-slate-500">
            이메일 인증 없이 Google 계정으로 바로 시작하실 수 있습니다.
          </p>
        </div>

        <div className="space-y-5">
          {notice && (
            <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/90 px-4 py-3">
              <p className="text-sm leading-6 text-emerald-900">{notice}</p>
            </div>
          )}
          {error && (
            <div className="rounded-2xl border border-rose-200/80 bg-rose-50/90 px-4 py-3">
              <p className="text-sm leading-6 text-rose-900">{error}</p>
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-900 shadow-[0_10px_24px_rgba(15,23,42,0.08)] transition duration-200 hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-bold text-slate-700">
              G
            </span>
            {loading ? 'Google로 이동 중...' : 'Google로 시작하기'}
          </button>
        </div>
      </div>
    </div>
  )
}
