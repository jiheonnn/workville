'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import CharacterPicker from '@/components/profile/CharacterPicker'
import { createClient } from '@/lib/supabase/client'
import type { CharacterType } from '@/types/database'

async function parseJsonResponse(response: Response) {
  return response.json().catch(() => ({}))
}

export default function CharacterSelectPage() {
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterType | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const checkAuth = useCallback(async () => {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
    }
  }, [router])

  useEffect(() => {
    void checkAuth()
  }, [checkAuth])

  const handleCharacterSelect = async () => {
    if (!selectedCharacter) {
      setError('외관을 선택해주세요.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          character_type: selectedCharacter,
        }),
      })
      const body = await parseJsonResponse(response)

      if (!response.ok) {
        setError(typeof body.error === 'string' ? body.error : '외관 저장 중 오류가 발생했습니다.')
        return
      }

      router.push('/team')
      router.refresh()
    } catch (err) {
      setError('외관 저장 중 오류가 발생했습니다.')
      console.error('Appearance select error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-extrabold text-gray-900">
          사용할 캐릭터를 선택해주세요
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Workville에서 사용할 캐릭터를 선택해주세요.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <CharacterPicker
        value={selectedCharacter}
        onChange={(characterType) => {
          setSelectedCharacter(characterType)
          setError(null)
        }}
        disabled={loading}
      />

      <div className="mt-8 text-center">
        <button
          type="button"
          onClick={handleCharacterSelect}
          disabled={!selectedCharacter || loading}
          className="inline-flex justify-center rounded-xl bg-emerald-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? '저장 중...' : '이 캐릭터로 시작하기'}
        </button>
      </div>
    </div>
  )
}
