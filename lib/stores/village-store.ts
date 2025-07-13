import { create } from 'zustand'
import { UserStatus } from '@/lib/types'

interface UserWithStatus {
  id: string
  username: string
  character_type: string
  status: UserStatus
  last_seen: string
}

interface WorkSession {
  check_in_time: string | null
  check_out_time: string | null
  duration_minutes: number | null
}

interface VillageStore {
  // State
  users: Map<string, UserWithStatus>
  currentUserStatus: UserStatus
  todaySession: WorkSession | null
  isLoading: boolean
  error: string | null

  // Actions
  setUsers: (users: UserWithStatus[]) => void
  updateUserStatus: (userId: string, status: UserStatus) => void
  setCurrentUserStatus: (status: UserStatus) => void
  setTodaySession: (session: WorkSession | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // API Actions
  fetchCurrentStatus: () => Promise<void>
  updateMyStatus: (status: UserStatus) => Promise<boolean>
}

export const useVillageStore = create<VillageStore>((set, get) => ({
  // Initial state
  users: new Map(),
  currentUserStatus: 'home',
  todaySession: null,
  isLoading: false,
  error: null,

  // Basic setters
  setUsers: (users) => {
    const userMap = new Map()
    users.forEach(user => {
      userMap.set(user.id, user)
    })
    set({ users: userMap })
  },

  updateUserStatus: (userId, status) => {
    set((state) => {
      const users = new Map(state.users)
      const user = users.get(userId)
      if (user) {
        users.set(userId, { ...user, status })
      }
      return { users }
    })
  },

  setCurrentUserStatus: (status) => set({ currentUserStatus: status }),
  setTodaySession: (session) => set({ todaySession: session }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  // Fetch current user status
  fetchCurrentStatus: async () => {
    try {
      set({ isLoading: true, error: null })
      
      const response = await fetch('/api/status')
      if (!response.ok) {
        throw new Error('Failed to fetch status')
      }

      const data = await response.json()
      set({
        currentUserStatus: data.status,
        todaySession: data.todaySession,
        isLoading: false
      })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false 
      })
    }
  },

  // Update current user status
  updateMyStatus: async (status: UserStatus) => {
    try {
      set({ isLoading: true, error: null })

      const response = await fetch('/api/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        throw new Error('Failed to update status')
      }

      const data = await response.json()
      
      // Update local state
      set({ 
        currentUserStatus: status,
        isLoading: false 
      })

      // If checking out, trigger a refetch to get updated session data
      if (data.previousStatus === 'working' && status !== 'working') {
        setTimeout(() => {
          get().fetchCurrentStatus()
        }, 500)
      }

      return true
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false 
      })
      return false
    }
  },
}))