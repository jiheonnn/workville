'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const inputClassName =
    'mt-2 w-full rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3.5 text-[15px] text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none transition duration-200 placeholder:text-slate-400 focus:border-slate-950 focus:bg-white focus:shadow-[0_0_0_4px_rgba(15,23,42,0.08)]'

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const authError = searchParams.get('error')

    if (authError === 'email_not_confirmed') {
      setError('이메일 인증이 아직 완료되지 않았습니다. 받은 편지함의 인증 링크를 클릭한 뒤 다시 로그인해주세요.')
      setNotice(null)
      return
    }

    if (authError === 'email_confirmation_failed') {
      setError('이메일 인증 링크가 만료되었거나 올바르지 않습니다. 다시 회원가입하거나 새 인증 메일을 받아주세요.')
      setNotice(null)
      return
    }

    if (searchParams.get('confirmed') === '1') {
      setNotice('이메일 인증이 완료되었습니다. 이제 로그인하거나 계속 진행하실 수 있습니다.')
      setError(null)
      return
    }

    setNotice(null)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if (error.message === 'Email not confirmed') {
          setError('이메일 인증이 아직 완료되지 않았습니다. 받은 편지함의 인증 링크를 클릭한 뒤 다시 로그인해주세요.')
        } else {
          setError(error.message)
        }
      } else {
        // Use window.location to force a full page reload for proper cookie sync
        window.location.href = '/village'
      }
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = async () => {
    if (!email) {
      setError('비밀번호 재설정을 위해 이메일을 입력해주세요.')
      setNotice(null)
      return
    }

    setError(null)
    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        setError(error.message)
      } else {
        setNotice('비밀번호 재설정 링크를 이메일로 전송했습니다. 메일함에서 안내를 확인해주세요.')
      }
    } catch (err) {
      setError('비밀번호 재설정 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
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
            워크빌
          </h1>
          <p className="mt-3 text-sm text-slate-500">
            계정이 없으신가요?{' '}
            <Link
              href="/signup"
              className="font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 transition hover:decoration-slate-900"
            >
              회원가입
            </Link>
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
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

          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"
              >
                이메일
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={inputClassName}
                placeholder="name@workville.app"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor="password"
                  className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500"
                >
                  비밀번호
                </label>
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  disabled={loading}
                  className="text-sm font-medium text-slate-500 transition hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  비밀번호를 잊으셨나요?
                </button>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className={inputClassName}
                placeholder="비밀번호를 입력해주세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3.5 text-sm font-semibold text-white transition duration-200 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? '처리 중...' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  )
}
