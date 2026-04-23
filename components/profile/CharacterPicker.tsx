'use client'

import Image from 'next/image'

import { AVAILABLE_CHARACTER_TYPES } from '@/lib/character-catalog'
import { getCharacterImagePath, getCharacterLabel } from '@/lib/character-utils'
import type { CharacterType } from '@/types/database'

export function getCharacterPickerCardClassName(isSelected: boolean) {
  return [
    'group relative rounded-2xl border-2 p-4 text-left transition-all duration-200',
    'outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2',
    isSelected
      ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-100'
      : 'border-gray-200 bg-white hover:border-emerald-300 hover:shadow-md',
  ].join(' ')
}

export function getCharacterPickerImageClassName() {
  return 'object-cover scale-125'
}

interface CharacterPickerProps {
  disabled?: boolean
  onChange: (characterType: CharacterType) => void
  value: CharacterType | null
}

export default function CharacterPicker({
  disabled = false,
  onChange,
  value,
}: CharacterPickerProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {AVAILABLE_CHARACTER_TYPES.map((characterType) => {
        const isSelected = value === characterType

        return (
          <button
            key={characterType}
            type="button"
            disabled={disabled}
            onClick={() => onChange(characterType)}
            className={getCharacterPickerCardClassName(isSelected)}
            aria-label={`${getCharacterLabel(characterType)} 선택`}
            aria-pressed={isSelected}
          >
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-teal-100">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.9),_transparent_58%)]" />
              <div className="absolute inset-3 rounded-2xl border border-white/80" />
              <div className="relative h-full w-full">
                <Image
                  src={getCharacterImagePath(characterType, 'normal')}
                  alt={`${getCharacterLabel(characterType)} 미리보기`}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className={getCharacterPickerImageClassName()}
                />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-800">
                {getCharacterLabel(characterType)}
              </span>
              {isSelected && (
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-white">
                  ✓
                </span>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}
