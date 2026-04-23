'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CharacterType } from '@/types/database'
import Image from 'next/image'
import { getCharacterImagePath } from '@/lib/character-utils'
import { AVAILABLE_CHARACTER_TYPES } from '@/lib/character-catalog'

export default function CharacterSelectPage() {
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterType | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const checkAuth = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
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
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // 먼저 프로필이 있는지 확인
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!existingProfile) {
        // 프로필이 없으면 생성
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email!,
            username: user.user_metadata.username || user.email!.split('@')[0],
            character_type: selectedCharacter
          })

        if (insertError) {
          setError('프로필 생성 중 오류가 발생했습니다.')
          console.error('Profile insert error:', insertError)
          return
        }

        // user_status도 생성
        const { error: statusError } = await supabase
          .from('user_status')
          .insert({
            user_id: user.id,
            status: 'home'
          })

        if (statusError) {
          console.error('Status insert error:', statusError)
        }
      } else {
        // 프로필이 있으면 업데이트
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ character_type: selectedCharacter })
          .eq('id', user.id)

        if (updateError) {
          setError('외관 저장 중 오류가 발생했습니다.')
          console.error('Profile update error:', updateError)
          return
        }
      }

      router.push('/village')
      router.refresh()
    } catch (err) {
      setError('외관 저장 중 오류가 발생했습니다.')
      console.error('Appearance select error:', err)
    } finally {
      setLoading(false)
    }
  }

  const appearanceOptions: CharacterType[] = AVAILABLE_CHARACTER_TYPES

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold text-gray-900">
          사용할 캐릭터를 선택해주세요
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Workville에서 사용할 캐릭터를 선택해주세요.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-6">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {appearanceOptions.map((appearanceType) => (
          <button
            key={appearanceType}
            onClick={() => setSelectedCharacter(appearanceType)}
            className={`relative p-6 border-2 rounded-lg transition-all ${
              selectedCharacter === appearanceType
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400 cursor-pointer'
            }`}
            aria-label={`외관 ${appearanceType} 선택`}
          >
            <div className="aspect-square rounded-lg flex items-center justify-center relative overflow-hidden bg-gray-200">
              <div className="relative w-full h-full">
                <Image
                  src={getCharacterImagePath(appearanceType, 'normal')}
                  alt={`외관 ${appearanceType} 미리보기`}
                  fill
                  className="object-contain p-4"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </div>
            </div>
            <p className="mt-3 text-sm font-medium text-gray-700">
              캐릭터 {appearanceType}
            </p>
            {selectedCharacter === appearanceType && (
              <div className="absolute top-2 right-2">
                <div className="bg-blue-500 text-white rounded-full p-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="text-center">
        <button
          onClick={handleCharacterSelect}
          disabled={!selectedCharacter || loading}
          className="inline-flex justify-center py-2 px-8 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '저장 중...' : '이 외관으로 시작하기'}
        </button>
      </div>
    </div>
  )
}
