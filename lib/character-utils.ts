import type { CharacterType, UserStatus } from '@/types/database'

type CharacterAnimationStatus = Extract<UserStatus, 'working' | 'home' | 'break'>
const CHARACTER_IMAGE_EXTENSION = 'webp'

const DEFAULT_CHARACTER_TYPE: CharacterType = 1

export function normalizeCharacterType(characterType: CharacterType | null | undefined): CharacterType {
  return characterType ?? DEFAULT_CHARACTER_TYPE
}

export function getCharacterDirectory(characterType: CharacterType | null | undefined) {
  return `character${normalizeCharacterType(characterType)}`
}

export function getCharacterImagePath(
  characterType: CharacterType | null | undefined,
  variant: 'normal'
): string
export function getCharacterImagePath(
  characterType: CharacterType | null | undefined,
  variant: CharacterAnimationStatus,
  frame: 1 | 2
): string
export function getCharacterImagePath(
  characterType: CharacterType | null | undefined,
  variant: 'normal' | CharacterAnimationStatus,
  frame?: 1 | 2
) {
  const directory = getCharacterDirectory(characterType)

  if (variant === 'normal') {
    return `/characters/${directory}/normal.${CHARACTER_IMAGE_EXTENSION}`
  }

  return `/characters/${directory}/${variant}_${frame ?? 1}.${CHARACTER_IMAGE_EXTENSION}`
}

export function getCharacterSpritePaths(characterType: CharacterType | null | undefined) {
  return [
    getCharacterImagePath(characterType, 'normal'),
    getCharacterImagePath(characterType, 'working', 1),
    getCharacterImagePath(characterType, 'working', 2),
    getCharacterImagePath(characterType, 'home', 1),
    getCharacterImagePath(characterType, 'home', 2),
    getCharacterImagePath(characterType, 'break', 1),
    getCharacterImagePath(characterType, 'break', 2),
  ]
}

export function getCharacterEmoji(characterType: CharacterType | null | undefined) {
  const emojis: Record<CharacterType, string> = {
    1: '🔴',
    2: '🔵',
    3: '🟢',
    4: '🟣',
  }

  return emojis[normalizeCharacterType(characterType)]
}

export function getCharacterColor(characterType: CharacterType | null | undefined) {
  const colors: Record<CharacterType, string> = {
    1: '#EF4444',
    2: '#3B82F6',
    3: '#10B981',
    4: '#8B5CF6',
  }

  return colors[normalizeCharacterType(characterType)]
}

export function getCharacterLabel(characterType: CharacterType | null | undefined) {
  return `캐릭터 ${normalizeCharacterType(characterType)}`
}
