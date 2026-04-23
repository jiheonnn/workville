'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

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
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      console.log('Attempting password reset for:', email)
      const { error, data } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      console.log('Reset response:', { error, data })

      if (error) {
        console.error('Password reset error:', error)
        setError(error.message)
      } else {
        setError(null)
        alert('비밀번호 재설정 링크가 이메일로 전송되었습니다.')
      }
    } catch (err) {
      console.error('Caught error:', err)
      setError('비밀번호 재설정 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="text-center">
        <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
          Workville 로그인
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          계정이 없으신가요?{' '}
          <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-500">
            회원가입
          </Link>
        </p>
      </div>
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        {notice && (
          <div className="rounded-md bg-blue-50 p-4">
            <p className="text-sm text-blue-800">{notice}</p>
          </div>
        )}
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
        <div className="rounded-md shadow-sm -space-y-px">
          <div>
            <label htmlFor="email" className="sr-only">
              이메일
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">
              비밀번호
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-3">
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '처리 중...' : '로그인'}
          </button>
          
          <button
            type="button"
            onClick={handlePasswordReset}
            disabled={loading}
            className="w-full text-sm text-blue-600 hover:text-blue-500 focus:outline-none focus:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            비밀번호를 잊으셨나요?
          </button>
        </div>
      </form>
    </div>
  )
}
