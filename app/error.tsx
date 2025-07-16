'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="mx-auto max-w-md text-center">
        <h2 className="mb-4 text-2xl font-bold">문제가 발생했습니다</h2>
        <p className="mb-6 text-gray-600">
          예상치 못한 오류가 발생했습니다. 문제가 지속되면 관리자에게 문의해주세요.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            onClick={reset}
            className="bg-green-600 hover:bg-green-700"
          >
            다시 시도
          </Button>
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
          >
            홈으로 이동
          </Button>
        </div>
      </div>
    </div>
  )
}