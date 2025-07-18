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

interface VillageStoreData {
  status: UserStatus
  lastUpdated: string | null
  todaySessions: WorkSession[]
  totalDurationMinutes: number
}

interface VillageStore {
  // State
  users: Map<string, UserWithStatus>
  currentUserStatus: UserStatus
  todaySessions: WorkSession[]
  totalDurationMinutes: number
  isLoading: boolean
  error: string | null
  onlineUsers: Set<string>

  // Actions
  setUsers: (users: UserWithStatus[]) => void
  updateUserStatus: (userId: string, status: UserStatus) => void
  setCurrentUserStatus: (status: UserStatus) => void
  setTodaySessions: (sessions: WorkSession[]) => void
  setTotalDurationMinutes: (minutes: number) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setOnlineUsers: (userIds: string[]) => void
  removeOnlineUser: (userId: string) => void

  // API Actions
  fetchCurrentStatus: () => Promise<void>
  updateMyStatus: (status: UserStatus) => Promise<boolean>
}

export const useVillageStore = create<VillageStore>((set, get) => ({
  // Initial state
  users: new Map(),
  currentUserStatus: 'home',
  todaySessions: [],
  totalDurationMinutes: 0,
  isLoading: false,
  error: null,
  onlineUsers: new Set(),

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
  setTodaySessions: (sessions) => set({ todaySessions: sessions }),
  setTotalDurationMinutes: (minutes) => set({ totalDurationMinutes: minutes }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  setOnlineUsers: (userIds) => {
    set({ onlineUsers: new Set(userIds) })
  },

  removeOnlineUser: (userId) => {
    set((state) => {
      const onlineUsers = new Set(state.onlineUsers)
      onlineUsers.delete(userId)
      return { onlineUsers }
    })
  },

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
        todaySessions: data.todaySessions || [],
        totalDurationMinutes: data.totalDurationMinutes || 0,
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
    console.log('village-store: updateMyStatus called with:', status)
    try {
      set({ isLoading: true, error: null })

      console.log('village-store: Making API request to /api/status')
      const response = await fetch('/api/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      console.log('village-store: API response status:', response.status)
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('village-store: API error:', errorData)
        throw new Error(errorData.error || 'Failed to update status')
      }

      const data = await response.json()
      console.log('village-store: API response data:', data)
      
      // Update local state
      set({ 
        currentUserStatus: status,
        isLoading: false 
      })
      
      console.log('village-store: Local state updated to:', status)

      // If checking out, trigger a refetch to get updated session data
      if (data.previousStatus === 'working' && status !== 'working') {
        console.log('village-store: Triggering refetch after checkout')
        setTimeout(() => {
          get().fetchCurrentStatus()
        }, 500)
      }

      console.log('village-store: Status update successful')
      return true
    } catch (error) {
      console.error('village-store: Error updating status:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false 
      })
      return false
    }
  },
}))