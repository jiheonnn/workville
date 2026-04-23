'use client'

import { useEffect, useState } from 'react'

import CharacterPicker from '@/components/profile/CharacterPicker'
import { sanitizeUsername } from '@/lib/profile/validation'
import { useAuthStore } from '@/lib/stores/auth-store'
import { createClient } from '@/lib/supabase/client'
import type { CharacterType, Profile } from '@/types/database'

async function parseJsonResponse(response: Response) {
  return response.json().catch(() => ({}))
}

export default function MyPagePanel() {
  const { user, setUser, isLoading, loadUserFromServer } = useAuthStore()
  const [usernameInput, setUsernameInput] = useState('')
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterType | null>(null)
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [usernameNotice, setUsernameNotice] = useState<string | null>(null)
  const [characterError, setCharacterError] = useState<string | null>(null)
  const [characterNotice, setCharacterNotice] = useState<string | null>(null)
  const [isSavingUsername, setIsSavingUsername] = useState(false)
  const [isSavingCharacter, setIsSavingCharacter] = useState(false)
  const [isFetchingProfile, setIsFetchingProfile] = useState(false)
  const [pageError, setPageError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      return
    }

    setUsernameInput(user.username)
    setSelectedCharacter(user.character_type)
  }, [user])

  useEffect(() => {
    if (user || isLoading) {
      return
    }

    let ignore = false

    // 이유:
    // 마이페이지를 직접 새로고침하면 store가 비어 있는 짧은 구간이 생길 수 있습니다.
    // 이때 `/api/me`를 다시 읽어 프로필을 복구하면 헤더와 페이지 상태가 안정적으로 맞춰집니다.
    const bootstrapUser = async () => {
      setIsFetchingProfile(true)
      setPageError(null)

      try {
        await loadUserFromServer()
      } catch {
        if (!ignore) {
          setPageError('프로필을 불러오지 못했습니다.')
        }
      } finally {
        if (!ignore) {
          setIsFetchingProfile(false)
        }
      }
    }

    void bootstrapUser()

    return () => {
      ignore = true
    }
  }, [isLoading, loadUserFromServer, user])

  const handleUsernameSave = async () => {
    setUsernameError(null)
    setUsernameNotice(null)

    try {
      setIsSavingUsername(true)

      const response = await fetch('/api/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: usernameInput,
        }),
      })
      const body = await parseJsonResponse(response)

      if (!response.ok) {
        setUsernameError(typeof body.error === 'string' ? body.error : '이름 저장에 실패했습니다.')
        return
      }

      const profile = body.profile as Profile
      setUser(profile)
      setUsernameInput(profile.username)
      setUsernameNotice('이름이 변경되었습니다.')
    } catch {
      setUsernameError('이름 저장에 실패했습니다.')
    } finally {
      setIsSavingUsername(false)
    }
  }

  const handleCharacterSave = async () => {
    if (!selectedCharacter) {
      setCharacterError('캐릭터를 선택해주세요.')
      return
    }

    setCharacterError(null)
    setCharacterNotice(null)

    try {
      setIsSavingCharacter(true)

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
        setCharacterError(
          typeof body.error === 'string' ? body.error : '캐릭터 저장에 실패했습니다.'
        )
        return
      }

      const profile = body.profile as Profile
      setUser(profile)
      setSelectedCharacter(profile.character_type)
      setCharacterNotice('캐릭터가 변경되었습니다.')
    } catch {
      setCharacterError('캐릭터 저장에 실패했습니다.')
    } finally {
      setIsSavingCharacter(false)
    }
  }

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('Logout error:', error)
      }
    } finally {
      setUser(null)
      window.location.href = '/login'
    }
  }

  if (isLoading || isFetchingProfile) {
    return (
      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <div className="h-6 w-32 animate-pulse rounded bg-gray-100" />
          <div className="h-12 w-full animate-pulse rounded-2xl bg-gray-100" />
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="aspect-square animate-pulse rounded-2xl bg-gray-100" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="rounded-3xl border border-red-100 bg-red-50 p-6">
        <p className="text-sm text-red-800">
          {pageError || '프로필을 불러오지 못했습니다.'}
        </p>
      </div>
    )
  }

  const isUsernameChanged = sanitizeUsername(usernameInput) !== user.username
  const isCharacterChanged = selectedCharacter !== user.character_type

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">기본 정보</h2>
          <p className="mt-1 text-sm text-gray-600">
            이름은 2자 이상 12자 이하이며 한글, 영문, 숫자만 사용할 수 있습니다.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="mypage-email" className="block text-sm font-medium text-gray-700">
              이메일
            </label>
            <input
              id="mypage-email"
              value={user.email}
              disabled
              className="mt-2 block w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500"
            />
          </div>

          <div>
            <label htmlFor="mypage-username" className="block text-sm font-medium text-gray-700">
              이름
            </label>
            <input
              id="mypage-username"
              value={usernameInput}
              onChange={(event) => {
                setUsernameInput(event.target.value)
                setUsernameError(null)
                setUsernameNotice(null)
              }}
              className="mt-2 block w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
              placeholder="이름을 입력해주세요"
              autoComplete="nickname"
            />
          </div>

          {usernameError && (
            <p className="text-sm text-red-600">{usernameError}</p>
          )}
          {usernameNotice && (
            <p className="text-sm text-emerald-600">{usernameNotice}</p>
          )}

          <button
            type="button"
            onClick={handleUsernameSave}
            disabled={!isUsernameChanged || isSavingUsername}
            className="inline-flex rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {isSavingUsername ? '이름 저장 중...' : '이름 저장'}
          </button>
        </div>
      </section>

      <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">캐릭터 변경</h2>
          <p className="mt-1 text-sm text-gray-600">
            마을과 팀 화면에 표시될 캐릭터를 다시 선택할 수 있습니다.
          </p>
        </div>

        <CharacterPicker
          value={selectedCharacter}
          onChange={(characterType) => {
            setSelectedCharacter(characterType)
            setCharacterError(null)
            setCharacterNotice(null)
          }}
          disabled={isSavingCharacter}
        />

        {characterError && (
          <p className="mt-4 text-sm text-red-600">{characterError}</p>
        )}
        {characterNotice && (
          <p className="mt-4 text-sm text-emerald-600">{characterNotice}</p>
        )}

        <button
          type="button"
          onClick={handleCharacterSave}
          disabled={!isCharacterChanged || isSavingCharacter}
          className="mt-6 inline-flex rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {isSavingCharacter ? '캐릭터 저장 중...' : '캐릭터 저장'}
        </button>
      </section>

      <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">계정</h2>
          <p className="mt-1 text-sm text-gray-600">
            현재 계정에서 로그아웃합니다.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100"
        >
          로그아웃
        </button>
      </section>
    </div>
  )
}
