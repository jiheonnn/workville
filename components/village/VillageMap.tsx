'use client'

import { useEffect, useState } from 'react'
import Character from './Character'
import GridCell from './GridCell'
import { UserStatus, CharacterType } from '@/lib/types'

interface CharacterData {
  id: string
  username: string
  characterType: CharacterType
  status: UserStatus
  position: { x: number; y: number }
}

export default function VillageMap() {
  const [characters, setCharacters] = useState<CharacterData[]>([])

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

  // Fetch users and their statuses from Supabase
  useEffect(() => {
    const fetchUsers = async () => {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      // Get all users with their profiles and statuses
      const { data: users, error } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          character_type,
          user_status!inner (
            status
          )
        `)

      if (error) {
        console.error('Error fetching users:', error)
        return
      }

      if (users) {
        const characterData: CharacterData[] = users.map((user, index) => ({
          id: user.id,
          username: user.username || 'Anonymous',
          characterType: user.character_type as CharacterType,
          status: user.user_status[0]?.status || 'home',
          position: getPositionForStatus(user.user_status[0]?.status || 'home', index),
        }))
        setCharacters(characterData)
      }
    }

    fetchUsers()

    // Set up realtime subscription
    const setupRealtimeSubscription = async () => {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const channel = supabase
        .channel('user-status-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_status',
          },
          (payload) => {
            // Refetch users when status changes
            fetchUsers()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }

    const cleanup = setupRealtimeSubscription()
    return () => {
      cleanup.then(fn => fn && fn())
    }
  }, [])

  return (
    <div className="w-full h-full bg-green-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-center">Workville</h2>
        
        <div 
          className="relative grid grid-cols-9 grid-rows-7 gap-1 w-full aspect-[9/7] bg-green-100 p-4 rounded-lg"
          style={{
            minHeight: '500px',
          }}
        >
          {/* Render grid cells */}
          {Array.from({ length: gridRows }).map((_, row) =>
            Array.from({ length: gridCols }).map((_, col) => {
              const x = col + 1
              const y = row + 1
              
              // Check if this is a special cell
              let cellType = 'grass'
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

          {/* Render characters */}
          {characters.map((character) => (
            <Character
              key={character.id}
              characterType={character.characterType}
              status={character.status}
              position={character.position}
              username={character.username}
            />
          ))}
        </div>
      </div>
    </div>
  )
}