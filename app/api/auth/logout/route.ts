import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/api-client'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createApiClient()
    
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Logout error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Clear all cookies by setting them with Max-Age=0
    const response = NextResponse.json({ success: true })
    
    // Clear Supabase auth cookies
    response.cookies.set('sb-access-token', '', { maxAge: 0 })
    response.cookies.set('sb-refresh-token', '', { maxAge: 0 })
    
    return response
  } catch (error) {
    console.error('Unexpected logout error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Logout failed' 
    }, { status: 500 })
  }
}