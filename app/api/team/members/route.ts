import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: members, error } = await supabase
      .from('profiles')
      .select('id, username, character_type')
      .order('username')

    if (error) {
      console.error('Error fetching team members:', error)
      return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 })
    }

    return NextResponse.json({
      members: members?.map(member => ({
        id: member.id,
        username: member.username,
        characterType: member.character_type
      })) || []
    })
  } catch (error) {
    console.error('Error in team members API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}