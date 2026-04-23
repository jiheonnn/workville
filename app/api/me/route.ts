import { NextResponse } from 'next/server'

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
