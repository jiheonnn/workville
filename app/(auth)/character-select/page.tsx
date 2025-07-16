'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CharacterType } from '@/types/database'
import Image from 'next/image'

export default function CharacterSelectPage() {
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterType | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [takenCharacters, setTakenCharacters] = useState<CharacterType[]>([])
  const [loadingCharacters, setLoadingCharacters] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
    fetchTakenCharacters()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
    }
  }

  const fetchTakenCharacters = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('character_type')
        .not('character_type', 'is', null)

      if (error) {
        console.error('Error fetching taken characters:', error)
      } else {
        const taken = data?.map(profile => profile.character_type).filter(Boolean) || []
        setTakenCharacters(taken as CharacterType[])
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoadingCharacters(false)
    }
  }

  const handleCharacterSelect = async () => {
    if (!selectedCharacter) {
      setError('캐릭터를 선택해주세요.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ character_type: selectedCharacter })
        .eq('id', user.id)

      if (updateError) {
        setError('캐릭터 선택 중 오류가 발생했습니다.')
        console.error(updateError)
      } else {
        router.push('/village')
        router.refresh()
      }
    } catch (err) {
      setError('캐릭터 선택 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const characters: { type: CharacterType; name: string; description: string }[] = [
    { type: 1, name: '캐릭터 1', description: '활발하고 에너지 넘치는 캐릭터' },
    { type: 2, name: '캐릭터 2', description: '차분하고 지적인 캐릭터' },
    { type: 3, name: '캐릭터 3', description: '친근하고 따뜻한 캐릭터' },
    { type: 4, name: '캐릭터 4', description: '창의적이고 독특한 캐릭터' },
  ]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold text-gray-900">
          캐릭터를 선택하세요
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

      {loadingCharacters ? (
        <div className="text-center py-12">
          <p className="text-gray-500">캐릭터 정보를 불러오는 중...</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6 mb-8">
          {characters.map((character) => {
            const isTaken = takenCharacters.includes(character.type)
            const isSelectable = !isTaken
            
            return (
              <button
                key={character.type}
                onClick={() => isSelectable && setSelectedCharacter(character.type)}
                disabled={isTaken}
                className={`relative p-6 border-2 rounded-lg transition-all ${
                  selectedCharacter === character.type
                    ? 'border-blue-500 bg-blue-50'
                    : isTaken
                    ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60'
                    : 'border-gray-300 hover:border-gray-400 cursor-pointer'
                }`}
              >
                <div className={`aspect-square rounded-lg mb-4 flex items-center justify-center relative overflow-hidden ${
                  isTaken ? 'bg-gray-300' : 'bg-gray-200'
                }`}>
                  <div className="relative w-full h-full">
                    <Image
                      src={`/characters/character${character.type}/home_1.png`}
                      alt={character.name}
                      fill
                      className={`object-contain p-4 ${isTaken ? 'filter grayscale' : ''}`}
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </div>
                  {isTaken && (
                    <div className="absolute inset-0 bg-gray-900 bg-opacity-20 flex items-center justify-center">
                      <span className="text-gray-700 font-semibold bg-white px-3 py-1 rounded">선택됨</span>
                    </div>
                  )}
                </div>
                <h3 className={`font-semibold text-lg mb-1 ${isTaken ? 'text-gray-500' : ''}`}>
                  {character.name}
                </h3>
                <p className={`text-sm ${isTaken ? 'text-gray-400' : 'text-gray-600'}`}>
                  {character.description}
                </p>
                {selectedCharacter === character.type && (
                  <div className="absolute top-2 right-2">
                    <div className="bg-blue-500 text-white rounded-full p-1">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}

      <div className="text-center">
        <button
          onClick={handleCharacterSelect}
          disabled={!selectedCharacter || loading || loadingCharacters}
          className="inline-flex justify-center py-2 px-8 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '선택 중...' : '캐릭터 선택하기'}
        </button>
      </div>
    </div>
  )
}