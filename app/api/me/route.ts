import { NextResponse } from 'next/server'

import { isCharacterType } from '@/lib/character-catalog'
import { sanitizeUsername, validateUsername } from '@/lib/profile/validation'
import { requireAuthenticatedProfile } from '@/lib/team/server-context'
import { createApiClient } from '@/lib/supabase/api-client'

export async function GET() {
  try {
    const supabase = await createApiClient()
    const { profile } = await requireAuthenticatedProfile(supabase)

    return NextResponse.json({ profile })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (error instanceof Error && error.message === 'PROFILE_NOT_FOUND') {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createApiClient()
    const { userId } = await requireAuthenticatedProfile(supabase)
    const body = await request.json()

    const nextUsername = typeof body.username === 'string' ? sanitizeUsername(body.username) : undefined
    const nextCharacterType =
      typeof body.character_type === 'number' ? body.character_type : undefined

    if (nextUsername === undefined && nextCharacterType === undefined) {
      return NextResponse.json(
        { error: '변경할 프로필 정보가 없습니다.' },
        { status: 400 }
      )
    }

    const updates: Record<string, string | number> = {}

    if (nextUsername !== undefined) {
      const validationResult = validateUsername(nextUsername)

      if (!validationResult.ok) {
        return NextResponse.json({ error: validationResult.error }, { status: 400 })
      }

      const { data: duplicateProfiles, error: duplicateError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', nextUsername)

      if (duplicateError) {
        return NextResponse.json({ error: '이름 중복 여부를 확인하지 못했습니다.' }, { status: 500 })
      }

      const isDuplicated = (duplicateProfiles || []).some((profile) => profile.id !== userId)

      if (isDuplicated) {
        return NextResponse.json({ error: '이미 사용 중인 이름입니다.' }, { status: 409 })
      }

      updates.username = nextUsername
    }

    if (nextCharacterType !== undefined) {
      if (!isCharacterType(nextCharacterType)) {
        return NextResponse.json({ error: '유효한 캐릭터를 선택해주세요.' }, { status: 400 })
      }

      updates.character_type = nextCharacterType
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)

    if (updateError) {
      return NextResponse.json({ error: '프로필을 저장하지 못했습니다.' }, { status: 500 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (error instanceof Error && error.message === 'PROFILE_NOT_FOUND') {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
