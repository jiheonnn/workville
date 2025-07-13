'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { CharacterType, UserStatus } from '@/lib/types'

interface CharacterProps {
  characterType: CharacterType
  status: UserStatus
  position: { x: number; y: number }
  username: string
}

export default function Character({ characterType, status, position, username }: CharacterProps) {
  const [currentFrame, setCurrentFrame] = useState(1)

  // Toggle between frame 1 and 2 every 500ms for animation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFrame(prev => prev === 1 ? 2 : 1)
    }, 500)

    return () => clearInterval(interval)
  }, [])

  // Build the image path
  const imagePath = `/characters/${characterType}/${status}_${currentFrame}.png`

  return (
    <div
      className="absolute flex flex-col items-center transition-all duration-1000 ease-in-out"
      style={{
        gridColumn: position.x,
        gridRow: position.y,
        transform: 'translate(-50%, -50%)',
        left: '50%',
        top: '50%',
      }}
    >
      {/* Character image */}
      <div className="relative w-16 h-16">
        <Image
          src={imagePath}
          alt={`${username} - ${status}`}
          width={64}
          height={64}
          className="pixelated"
          style={{
            imageRendering: 'pixelated',
          }}
          unoptimized
        />
      </div>
      
      {/* Username */}
      <div className="text-xs font-semibold mt-1 bg-white px-2 py-0.5 rounded shadow">
        {username}
      </div>
    </div>
  )
}