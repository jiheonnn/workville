'use client'

import { useEffect, useState, useCallback } from 'react'
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
  const [currentFrame, setCurrentFrame] = useState(1)
  const [imageError, setImageError] = useState(false)

  // Toggle between frame 1 and 2 every 500ms for animation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFrame(prev => prev === 1 ? 2 : 1)
    }, 500)

    return () => clearInterval(interval)
  }, [])

  // Reset error state when characterType or status changes
  useEffect(() => {
    setImageError(false)
  }, [characterType, status])

  // Build the image path with null check
  const imagePath = characterType 
    ? `/characters/character${characterType}/${status}_${currentFrame}.png`
    : `/characters/character1/${status}_${currentFrame}.png` // Default to character1 if null
  
  // Debug log
  useEffect(() => {
    console.log(`Character ${username}: status=${status}, characterType=${characterType}, imagePath=${imagePath}`)
  }, [status, characterType, username, imagePath])

  // Handle image load error
  const handleImageError = useCallback(() => {
    setImageError(true)
  }, [])

  return (
    <div
      className={`flex flex-col items-center justify-center transition-all duration-1000 ease-in-out z-10 pointer-events-auto ${!isOnline ? 'opacity-50' : ''}`}
      style={{
        gridColumn: position.x,
        gridRow: position.y,
      }}
    >
      {/* Character image */}
      <div className="relative w-16 h-16">
        {!imageError ? (
          <Image
            src={imagePath}
            alt={`${username} - ${status}`}
            width={64}
            height={64}
            className="pixelated"
            style={{
              imageRendering: 'pixelated',
              width: 'auto',
              height: 'auto',
            }}
            priority
            unoptimized
            onError={handleImageError}
          />
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