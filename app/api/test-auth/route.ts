import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    console.log('Test Auth - Starting...')
    
    // Check cookies
    const cookieStore = await cookies()
    const allCookies = cookieStore.getAll()
    console.log('Test Auth - Cookies:', allCookies.map(c => ({ name: c.name, value: c.value.substring(0, 20) + '...' })))
    
    // Create Supabase client
    console.log('Test Auth - Creating Supabase client...')
    const supabase = await createClient()
    
    // Get session
    console.log('Test Auth - Getting session...')
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('Test Auth - Session:', session ? 'Found' : 'Not found')
    console.log('Test Auth - Session Error:', sessionError)
    
    // Get user
    console.log('Test Auth - Getting user...')
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('Test Auth - User:', user?.id)
    console.log('Test Auth - User Error:', userError)
    
    return NextResponse.json({
      cookies: allCookies.length,
      hasSession: !!session,
      hasUser: !!user,
      sessionError: sessionError?.message,
      userError: userError?.message,
      userId: user?.id,
      userEmail: user?.email
    })
  } catch (error) {
    console.error('Test Auth - Error:', error)
    return NextResponse.json({ 
      error: 'Failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}