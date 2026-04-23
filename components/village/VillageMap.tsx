'use client'

import { useEffect, useMemo, useRef } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import Character from './Character'
import GridCell from './GridCell'
import { createClient } from '@/lib/supabase/client'
import { useRealtimePresence } from '@/hooks/useRealtimePresence'
import { useVillageStore } from '@/lib/stores/village-store'
import { logVillageDebug } from '@/lib/village/debug'
import { buildVillageCharacters } from '@/lib/village/map-data'

const SPECIAL_CELLS = {
  houses: [
    { x: 2, y: 1, type: 'house', id: 'house-1' },
    { x: 4, y: 1, type: 'house', id: 'house-2' },
    { x: 6, y: 1, type: 'house', id: 'house-3' },
    { x: 8, y: 1, type: 'house', id: 'house-4' },
  ],
  office: { x: 5, y: 4, type: 'office' },
  breakArea: { x: 5, y: 6, type: 'break' },
} as const

export default function VillageMap() {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const { users, fetchVillageUsers } = useVillageStore()
  
  // Initialize presence tracking
  useRealtimePresence()

  const characters = useMemo(() => buildVillageCharacters(users), [users])

  useEffect(() => {
    logVillageDebug('VillageMap: characters recalculated', {
      count: characters.length,
      statuses: characters.map((character) => ({
        id: character.id,
        status: character.status,
        x: character.position.x,
        y: character.position.y,
      })),
    })
  }, [characters])

  // Calculate working and home users
  const workingCount = characters.filter(char => char.status === 'working' || char.status === 'break').length
  const homeCount = characters.filter(char => char.status === 'home').length

  // Grid system: 9x7
  const gridCols = 9
  const gridRows = 7

  // Set up realtime subscription and initial fetch
  useEffect(() => {
    const supabase = createClient()

    // Initial fetch
    void fetchVillageUsers()

    // Set up realtime subscription
    const channel = supabase
      .channel('user-status-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_status',
        },
        () => {
          // 이유:
          // 내 상태는 store에서 즉시 반영하지만, 다른 팀원 변경은 Realtime 이벤트로 다시 동기화합니다.
          // 두 경로가 같은 store 액션을 쓰도록 맞춰야 화면 기준 데이터가 한 군데로 유지됩니다.
          logVillageDebug('VillageMap: realtime user_status event')
          void fetchVillageUsers()
        }
      )
      .subscribe()

    channelRef.current = channel

    // Cleanup
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [fetchVillageUsers])

  // Show loading state while auth is loading - removed this check
  // The component should still work even if auth is loading

  return (
    <div className="w-full h-full">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 animate-fadeIn" style={{ isolation: 'isolate' }}>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              팀원 현황
            </h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600 font-medium">온라인: {workingCount}명</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                <span className="text-sm text-gray-600 font-medium">오프라인: {homeCount}명</span>
              </div>
            </div>
          </div>
          
          <div className="relative rounded-xl bg-green-50">
            <div 
              className="relative w-full aspect-[9/7] p-6"
              style={{
                minHeight: '500px',
              }}
            >
              {/* Grid layer */}
              <div className="relative grid grid-cols-9 grid-rows-7 gap-1.5 w-full h-full z-0">
                {/* Render grid cells */}
                {Array.from({ length: gridRows }).map((_, row) =>
                  Array.from({ length: gridCols }).map((_, col) => {
                    const x = col + 1
                    const y = row + 1
                    
                    // Check if this is a special cell
                    let cellType: 'grass' | 'house' | 'office' | 'break' = 'grass'
                    const house = SPECIAL_CELLS.houses.find(h => h.x === x && h.y === y)
                    if (house) cellType = 'house'
                    else if (x === SPECIAL_CELLS.office.x && y === SPECIAL_CELLS.office.y) cellType = 'office'
                    else if (x === SPECIAL_CELLS.breakArea.x && y === SPECIAL_CELLS.breakArea.y) cellType = 'break'

                    return (
                      <GridCell
                        key={`${x}-${y}`}
                        x={x}
                        y={y}
                        type={cellType}
                      />
                    )
                  })
                )}
              </div>

              {/* Character layer */}
              <div className="absolute inset-0 grid grid-cols-9 grid-rows-7 gap-1.5 p-6" style={{ zIndex: 9999 }}>
                {/* Render characters */}
                {characters.map((character) => {
                  // Consider users as online if they are working or on break
                  return (
                    <Character
                      key={character.id}
                      characterType={character.characterType}
                      status={character.status}
                      position={character.position}
                      username={character.username}
                    />
                  )
                })}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap gap-4 justify-center">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg border-2 border-yellow-300 shadow-sm"></div>
              <span className="text-sm text-gray-600 font-medium">집 (홈)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg border-2 border-blue-300 shadow-sm"></div>
              <span className="text-sm text-gray-600 font-medium">사무실 (근무중)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg border-2 border-purple-300 shadow-sm"></div>
              <span className="text-sm text-gray-600 font-medium">휴게실 (휴식중)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
