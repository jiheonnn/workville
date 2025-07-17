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
      className={`relative flex flex-col items-center justify-center transition-all duration-1000 ease-in-out pointer-events-auto`}
      style={{
        gridColumn: position.x,
        gridRow: position.y,
        zIndex: 9999,
      }}
    >
      {/* Username */}
      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold bg-white px-2 py-0.5 rounded shadow text-black whitespace-nowrap">
        {username}
      </div>
      
      {/* Character image */}
      <div className="relative w-20 h-20" style={{ zIndex: 99999 }}>
        {!imageError ? (
          <>
            <Image
              src={imagePath1}
              alt={`${username} - ${status}`}
              width={512}
              height={512}
              className="pixelated absolute inset-0 animate-character-frame-1"
              style={{
                imageRendering: 'pixelated',
              }}
              priority
              onError={handleImageError}
            />
            <Image
              src={imagePath2}
              alt={`${username} - ${status}`}
              width={512}
              height={512}
              className="pixelated absolute inset-0 animate-character-frame-2"
              style={{
                imageRendering: 'pixelated',
              }}
              priority
              onError={handleImageError}
            />
          </>
        ) : (
          <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
            <span className="text-3xl">👤</span>
          </div>
        )}
      </div>
    </div>
  )
}