'use client'

import { useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { CharacterType, UserStatus } from '@/lib/types'

interface CharacterProps {
  characterType: CharacterType
  status: UserStatus
  position: { x: number; y: number }
  username: string
  isOnline?: boolean
}

export default function Character({ characterType, status, position, username, isOnline = true }: CharacterProps) {
  const [imageError, setImageError] = useState(false)

  // Reset error state when characterType or status changes
  useEffect(() => {
    setImageError(false)
  }, [characterType, status])

  // Build the image paths for both animation frames
  const imagePath1 = characterType 
    ? `/characters/character${characterType}/${status}_1.png`
    : `/characters/character1/${status}_1.png` // Default to character1 if null
  
  const imagePath2 = characterType 
    ? `/characters/character${characterType}/${status}_2.png`
    : `/characters/character1/${status}_2.png` // Default to character1 if null

  // Handle image load error
  const handleImageError = useCallback(() => {
    setImageError(true)
  }, [])

  return (
    <div
      className={`flex flex-col items-center justify-center transition-all duration-1000 ease-in-out z-20 pointer-events-auto ${!isOnline ? 'opacity-50' : ''}`}
      style={{
        gridColumn: position.x,
        gridRow: position.y,
      }}
    >
      {/* Character image */}
      <div className="relative w-16 h-16">
        {!imageError ? (
          <>
            <Image
              src={imagePath1}
              alt={`${username} - ${status}`}
              width={64}
              height={64}
              className="pixelated absolute inset-0 animate-character-frame-1"
              style={{
                imageRendering: 'pixelated',
              }}
              onError={handleImageError}
            />
            <Image
              src={imagePath2}
              alt={`${username} - ${status}`}
              width={64}
              height={64}
              className="pixelated absolute inset-0 animate-character-frame-2"
              style={{
                imageRendering: 'pixelated',
              }}
              onError={handleImageError}
            />
          </>
        ) : (
          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
            <span className="text-2xl">👤</span>
          </div>
        )}
      </div>
      
      {/* Username */}
      <div className="text-xs font-semibold mt-1 bg-white px-2 py-0.5 rounded shadow">
        {username}
      </div>
    </div>
  )
}