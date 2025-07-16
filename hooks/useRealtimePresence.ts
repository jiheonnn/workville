'use client'

import { useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useVillageStore } from '@/lib/stores/village-store'
import { useAuthStore } from '@/lib/stores/auth-store'

export function useRealtimePresence() {
  const supabase = createClient()
  const { user } = useAuthStore()
  const { setOnlineUsers, removeOnlineUser } = useVillageStore()

  const trackPresence = useCallback(async () => {
    if (!user) return

    const channel = supabase.channel('online-users')

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const onlineUserIds = Object.keys(state).flatMap(key => 
          state[key].map((presence: any) => presence.user_id)
        )
        setOnlineUsers(onlineUserIds)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        const userId = (newPresences[0] as any).user_id
        setOnlineUsers([userId])
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        const userId = (leftPresences[0] as any).user_id
        removeOnlineUser(userId)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          })
        }
      })

    return () => {
      channel.unsubscribe()
    }
  }, [user, supabase, setOnlineUsers, removeOnlineUser])

  useEffect(() => {
    const unsubscribe = trackPresence()
    return () => {
      unsubscribe?.then(fn => fn?.())
    }
  }, [trackPresence])
}