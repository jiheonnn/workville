'use client'

import { useState, useCallback, useEffect } from 'react'
import { CharacterType, UserStatus } from '@/lib/types'
import { getCharacterImagePath, getCharacterSpritePaths } from '@/lib/character-utils'
import { logVillageDebug } from '@/lib/village/debug'

interface CharacterProps {
  characterType: CharacterType
  status: UserStatus
  position: { x: number; y: number }
  username: string
}

export function getCharacterContainerClassName() {
  // 이유:
  // 근무 상태 전환은 버튼 클릭 직후 바로 보이는 것이 핵심이므로,
  // 위치 변경에는 시간 기반 transition을 주지 않습니다.
  return 'relative flex flex-col items-center justify-center pointer-events-auto'
}

export default function Character({ characterType, status, position, username }: CharacterProps) {
  const [failedImageKey, setFailedImageKey] = useState<string | null>(null)
  const imageKey = `${characterType}-${status}`
  const imageError = failedImageKey === imageKey

  const imagePath1 = getCharacterImagePath(characterType, status, 1)
  const imagePath2 = getCharacterImagePath(characterType, status, 2)

  // Handle image load error
  const handleImageError = useCallback(() => {
    setFailedImageKey(imageKey)
  }, [imageKey])

  const handleImageLoad = useCallback((frame: 1 | 2) => {
    logVillageDebug('Character: sprite loaded', {
      username,
      status,
      frame,
      x: position.x,
      y: position.y,
    })
  }, [position.x, position.y, status, username])

  useEffect(() => {
    // 이유:
    // 상태 버튼을 누를 때마다 새 스프라이트를 네트워크/디코드로 기다리면
    // 좌표는 바뀌어도 사용자는 "늦게 반응한다"고 느끼게 됩니다.
    // 현재 캐릭터가 사용할 수 있는 모든 상태 프레임을 먼저 캐시에 올려 즉시 교체되게 합니다.
    getCharacterSpritePaths(characterType).forEach((path) => {
      const image = new window.Image()
      image.src = path
    })
  }, [characterType])

  useEffect(() => {
    logVillageDebug('Character: props applied', {
      username,
      status,
      x: position.x,
      y: position.y,
      imageKey,
    })
  }, [imageKey, position.x, position.y, status, username])

  return (
    <div
      className={getCharacterContainerClassName()}
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePath1}
              alt={`${username} - ${status}`}
              width={512}
              height={512}
              className="pixelated absolute inset-0 animate-character-frame-1"
              style={{
                imageRendering: 'pixelated',
              }}
              loading="eager"
              onLoad={() => handleImageLoad(1)}
              onError={handleImageError}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePath2}
              alt={`${username} - ${status}`}
              width={512}
              height={512}
              className="pixelated absolute inset-0 animate-character-frame-2"
              style={{
                imageRendering: 'pixelated',
              }}
              loading="eager"
              onLoad={() => handleImageLoad(2)}
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
