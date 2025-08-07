'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Character from './Character'
import GridCell from './GridCell'
import { UserStatus, CharacterType } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import { useRealtimePresence } from '@/hooks/useRealtimePresence'
import { useVillageStore } from '@/lib/stores/village-store'

interface CharacterData {
  id: string
  username: string
  characterType: CharacterType
  status: UserStatus
  position: { x: number; y: number }
}

export default function VillageMap() {
  const [characters, setCharacters] = useState<CharacterData[]>([])
  const channelRef = useRef<any>(null)
  const { onlineUsers, currentUserStatus } = useVillageStore()
  
  // Initialize presence tracking
  useRealtimePresence()

  // Calculate working and home users
  const workingCount = characters.filter(char => char.status === 'working' || char.status === 'break').length
  const homeCount = characters.filter(char => char.status === 'home').length

  // Grid system: 9x7
  const gridCols = 9
  const gridRows = 7

  // Define special areas
  const specialCells = {
    houses: [
      { x: 2, y: 1, type: 'house', id: 'house-1' },
      { x: 4, y: 1, type: 'house', id: 'house-2' },
      { x: 6, y: 1, type: 'house', id: 'house-3' },
      { x: 8, y: 1, type: 'house', id: 'house-4' },
    ],
    office: { x: 5, y: 4, type: 'office' },
    breakArea: { x: 5, y: 6, type: 'break' },
  }

  // Position mapping based on status
  const getPositionForStatus = (status: UserStatus, characterIndex: number): { x: number; y: number } => {
    switch (status) {
      case 'working':
        // Office positions (center area)
        const officePositions = [
          { x: 4, y: 4 },
          { x: 5, y: 4 },
          { x: 6, y: 4 },
          { x: 5, y: 3 },
        ]
        return officePositions[characterIndex % officePositions.length]
      
      case 'home':
        // House positions (top row)
        const housePositions = specialCells.houses.map(h => ({ x: h.x, y: h.y }))
        return housePositions[characterIndex % housePositions.length]
      
      case 'break':
        // Break area positions (bottom)
        const breakPositions = [
          { x: 4, y: 6 },
          { x: 5, y: 6 },
          { x: 6, y: 6 },
          { x: 5, y: 7 },
        ]
        return breakPositions[characterIndex % breakPositions.length]
      
      default:
        return { x: 5, y: 4 } // Default to office
    }
  }

  // Set up realtime subscription and initial fetch
  useEffect(() => {
    const supabase = createClient()

    // Define fetchUsers inside useEffect to avoid React 19 concurrent rendering issues
    const fetchUsers = async () => {
      console.log('fetchUsers called - Starting...')
      
      try {
        // Use API route instead of direct Supabase query to avoid client-side issues
        const response = await fetch('/api/users')
        
        if (!response.ok) {
          console.error('Failed to fetch users:', response.statusText)
          return
        }

        const { users } = await response.json()
        console.log('Fetched users data:', users)
        
        if (users) {
          // First, filter valid users
          const validUsers = users.filter((user: any) => user.character_type !== null)
          
          // Group users by status to assign positions correctly
          const usersByStatus: Record<UserStatus, typeof validUsers> = {
            working: [],
            home: [],
            break: []
          }
          
          validUsers.forEach((user: any) => {
            // Handle both array and object cases
            let status: UserStatus = 'home'
            if (user.user_status) {
              if (Array.isArray(user.user_status) && user.user_status.length > 0) {
                status = user.user_status[0].status as UserStatus
              } else if (typeof user.user_status === 'object' && 'status' in user.user_status) {
                status = user.user_status.status as UserStatus
              }
            }
            usersByStatus[status].push(user)
          })
          
          // Map users with correct position indices
          const characterData: CharacterData[] = validUsers.map((user: any) => {
            // Handle both array and object cases
            let status: UserStatus = 'home'
            if (user.user_status) {
              if (Array.isArray(user.user_status) && user.user_status.length > 0) {
                status = user.user_status[0].status
              } else if (typeof user.user_status === 'object' && 'status' in user.user_status) {
                status = user.user_status.status as UserStatus
              }
            }
            
            // Find the index of this user within their status group
            const statusIndex = usersByStatus[status].findIndex((u: any) => u.id === user.id)
            const position = getPositionForStatus(status, statusIndex)
            
            return {
              id: user.id,
              username: user.username || 'Anonymous',
              characterType: user.character_type as CharacterType,
              status: status,
              position: position,
            }
          })
          
          console.log('Setting characters:', characterData)
          setCharacters(characterData)
        }
      } catch (error) {
        console.error('Unexpected error in fetchUsers:', error)
      }
    }

    // Initial fetch
    fetchUsers()

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
          // Refetch users when status changes
          fetchUsers()
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
  }, [])

  // Refetch users when current user status changes
  // Removed to prevent duplicate fetching - realtime subscription handles updates

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
                    const house = specialCells.houses.find(h => h.x === x && h.y === y)
                    if (house) cellType = 'house'
                    else if (x === specialCells.office.x && y === specialCells.office.y) cellType = 'office'
                    else if (x === specialCells.breakArea.x && y === specialCells.breakArea.y) cellType = 'break'

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
                  const isOnline = character.status === 'working' || character.status === 'break'
                  return (
                    <Character
                      key={character.id}
                      characterType={character.characterType}
                      status={character.status}
                      position={character.position}
                      username={character.username}
                      isOnline={isOnline}
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