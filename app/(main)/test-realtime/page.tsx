'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestRealtimePage() {
  const [logs, setLogs] = useState<string[]>([])
  const [status, setStatus] = useState<string>('not connected')

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
    console.log(`[Test] ${message}`)
  }

  useEffect(() => {
    const supabase = createClient()
    addLog('Creating Supabase client...')
    
    // Check WebSocket support
    if (typeof WebSocket !== 'undefined') {
      addLog('WebSocket is supported')
    } else {
      addLog('ERROR: WebSocket is NOT supported!')
    }

    const testConnection = async () => {
      // Test basic query
      try {
        const { data, error } = await supabase
          .from('user_status')
          .select('*')
          .limit(1)
        
        if (error) {
          addLog(`Query error: ${error.message}`)
        } else {
          addLog(`Query success: ${JSON.stringify(data)}`)
        }
      } catch (e) {
        addLog(`Query exception: ${e}`)
      }

      // Test realtime
      const channel = supabase
        .channel('test-realtime')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'user_status' },
          (payload) => {
            addLog(`Realtime event: ${JSON.stringify(payload)}`)
          }
        )
        .subscribe((status) => {
          addLog(`Subscription status: ${status}`)
          setStatus(status)
        })

      // Cleanup
      return () => {
        addLog('Cleaning up subscription...')
        supabase.removeChannel(channel)
      }
    }

    const cleanup = testConnection()
    return () => {
      cleanup.then(fn => fn && fn())
    }
  }, [])

  const triggerUpdate = async () => {
    addLog('Triggering manual update...')
    const response = await fetch('/api/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'working' }),
    })
    const data = await response.json()
    addLog(`API response: ${JSON.stringify(data)}`)
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Realtime Connection Test</h1>
      
      <div className="mb-4">
        <p>Status: <span className="font-bold">{status}</span></p>
        <button 
          onClick={triggerUpdate}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Trigger Status Update
        </button>
      </div>

      <div className="bg-black text-green-400 p-4 rounded font-mono text-sm">
        <h2 className="mb-2">Logs:</h2>
        {logs.map((log, i) => (
          <div key={i}>{log}</div>
        ))}
      </div>
    </div>
  )
}