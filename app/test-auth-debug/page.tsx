'use client'

import { useEffect, useState } from 'react'

export default function TestAuthDebugPage() {
  const [authData, setAuthData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAuthStatus()
  }, [])

  const fetchAuthStatus = async () => {
    try {
      const response = await fetch('/api/test-auth')
      const data = await response.json()
      setAuthData(data)
    } catch (error) {
      setAuthData({ error: 'Failed to fetch', message: error })
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-8">Loading...</div>

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Auth Debug Results</h1>
      <pre className="bg-gray-100 p-4 rounded overflow-auto">
        {JSON.stringify(authData, null, 2)}
      </pre>
      
      <button
        onClick={fetchAuthStatus}
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
      >
        Refresh
      </button>
    </div>
  )
}