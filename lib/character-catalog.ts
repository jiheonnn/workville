import type { CharacterType } from '@/types/database'

export const AVAILABLE_CHARACTER_TYPES: CharacterType[] = [1, 2, 3, 4, 5, 6, 7, 8]

export function isCharacterType(value: number): value is CharacterType {
  return AVAILABLE_CHARACTER_TYPES.includes(value as CharacterType)
}
