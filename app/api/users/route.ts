import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/api-client'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createApiClient()
    
    // Get all users with their profiles and statuses
    const { data: users, error } = await supabase
      .from('profiles')
      .select(`
        id,
        username,
        character_type,
        user_status (
          status
        )
      `)

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    return NextResponse.json({ users })

  } catch (error) {
    console.error('API Users GET error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}