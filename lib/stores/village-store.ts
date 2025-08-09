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

  // Update current user status with Optimistic UI
  updateMyStatus: async (status: UserStatus) => {
    console.log('village-store: updateMyStatus called with:', status)
    
    // Store previous state for rollback
    const previousStatus = get().currentUserStatus
    
    // Optimistic update - immediately update UI
    set({ 
      currentUserStatus: status,
      isLoading: false,  // Don't show loading state for better UX
      error: null 
    })
    console.log('village-store: Optimistic update applied:', status)

    try {
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
        
        // Rollback on failure
        set({ 
          currentUserStatus: previousStatus,
          error: errorData.error || 'Failed to update status'
        })
        
        return false
      }

      const data = await response.json()
      console.log('village-store: API response data:', data)
      
      // If checking out, fetch updated session data after a delay
      // This runs in background without blocking UI
      if (data.previousStatus === 'working' && status === 'home') {
        console.log('village-store: Fetching updated session data in background')
        // Use longer delay since UI is already updated
        setTimeout(() => {
          get().fetchCurrentStatus()
        }, 1000)
      }

      console.log('village-store: Status update successful')
      return true
    } catch (error) {
      console.error('village-store: Error updating status:', error)
      
      // Rollback on network error
      set({ 
        currentUserStatus: previousStatus,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      
      return false
    }
  },
}))