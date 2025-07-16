'use client'

import { useRouter } from 'next/navigation'

export default function TestLogoutPage() {
  const router = useRouter()

  const handleLogout = async () => {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
    })
    
    if (response.ok) {
      router.push('/login')
      router.refresh()
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">세션 테스트 페이지</h1>
      <button
        onClick={handleLogout}
        className="bg-red-500 text-white px-4 py-2 rounded"
      >
        로그아웃 (세션 정리)
      </button>
    </div>
  )
}