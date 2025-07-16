'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function DebugAuthPage() {
  const [authStatus, setAuthStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      const { data: { session } } = await supabase.auth.getSession()
      
      setAuthStatus({
        user,
        session,
        error,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      })
    } catch (err) {
      setAuthStatus({ error: err })
    } finally {
      setLoading(false)
    }
  }

  const testSignup = async () => {
    const testEmail = `test${Date.now()}@example.com`
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: 'test123456',
    })
    
    console.log('Test signup result:', { data, error })
    alert(`Test signup: ${error ? error.message : 'Success - check console'}`)
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Auth Debug Page</h1>
      
      <div className="mb-4">
        <h2 className="text-xl mb-2">Current Status:</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto">
          {JSON.stringify(authStatus, null, 2)}
        </pre>
      </div>

      <button
        onClick={testSignup}
        className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
      >
        Test Signup
      </button>

      <button
        onClick={checkAuth}
        className="bg-green-500 text-white px-4 py-2 rounded"
      >
        Refresh Status
      </button>
    </div>
  )
}