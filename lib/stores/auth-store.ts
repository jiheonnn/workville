import { create } from 'zustand'
import { Profile } from '@/types/database'

interface AuthStore {
  user: Profile | null
  isLoading: boolean
  setUser: (user: Profile | null) => void
  setLoading: (loading: boolean) => void
  loadUserFromServer: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ isLoading: loading }),
  loadUserFromServer: async () => {
    try {
      const response = await fetch('/api/me', { cache: 'no-store' })
      const body = await response.json().catch(() => ({}))

      if (response.status === 401) {
        set({ user: null })
        return
      }

      if (!response.ok) {
        throw new Error(
          typeof body.error === 'string' ? body.error : '프로필을 불러오지 못했습니다.'
        )
      }

      set({
        user:
          body && typeof body === 'object' && 'profile' in body
            ? (body.profile as Profile)
            : null,
      })
    } catch (error) {
      console.error('Failed to load user from server:', error)
      set({ user: null })
    }
  },
}))
