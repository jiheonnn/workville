import { create } from 'zustand'
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware'
import { getTodayKorea } from '@/lib/utils/date'
import { buildWorkLogContent } from '@/lib/work-log/content'

export interface TodoItem {
  id: string
  text: string
  completed: boolean
  order: number
}

export interface WorkLog {
  id?: string
  user_id?: string
  date: string
  todos: TodoItem[]
  completed_todos: TodoItem[]
  roi_high: string
  roi_low: string
  tomorrow_priority: string
  feedback: string
  version?: number
  created_at?: string
  updated_at?: string
}

interface WorkLogStore {
  currentLog: WorkLog | null
  isLoading: boolean
  isSaving: boolean
  hasConflict: boolean
  error: string | null
  lastSavedAt: Date | null
  isDirty: boolean
  checkInDate: string | null // 출근 날짜 저장
  lastSessionDate: string | null // 마지막 세션 날짜 저장
  localRevision: number
  activeSaveRequestId: number

  // Actions
  loadTodayLog: (checkInDate?: string) => Promise<void>
  fetchLastSessionDate: () => Promise<void>
  createNewLog: (date?: string) => void
  updateField: (field: keyof WorkLog, value: any) => void
  addTodo: (text: string) => void
  toggleTodo: (id: string) => void
  deleteTodo: (id: string) => void
  moveTodoToCompleted: (id: string) => void
  moveCompletedToTodo: (id: string) => void
  updateTodoText: (id: string, text: string) => void
  saveToLocalStorage: () => void
  saveToDB: () => Promise<void>
  flushPendingSave: () => Promise<void>
  clearError: () => void
  setDirty: (dirty: boolean) => void
  setCheckInDate: (date: string) => void
  resetForTeamTransition: () => void
}

const getToday = () => {
  // Use Korean timezone for consistent date formatting
  return getTodayKorea()
}

const createEmptyLog = (date?: string): WorkLog => ({
  date: date || getToday(),
  todos: [],
  completed_todos: [],
  roi_high: '',
  roi_low: '',
  tomorrow_priority: '',
  feedback: ''
})

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
}

const workLogStorage = createJSONStorage(() =>
  typeof window !== 'undefined' ? window.localStorage : noopStorage
)

export const clearPersistedWorkLogState = () => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.removeItem('work-log-storage')
}

const normalizeWorkLog = (workLog: Partial<WorkLog>): WorkLog => ({
  date: workLog.date || getToday(),
  todos: Array.isArray(workLog.todos) ? workLog.todos : [],
  completed_todos: Array.isArray(workLog.completed_todos) ? workLog.completed_todos : [],
  roi_high: workLog.roi_high || '',
  roi_low: workLog.roi_low || '',
  tomorrow_priority: workLog.tomorrow_priority || '',
  feedback: workLog.feedback || '',
  id: workLog.id,
  user_id: workLog.user_id,
  version: workLog.version,
  created_at: workLog.created_at,
  updated_at: workLog.updated_at,
})

export const useWorkLogStore = create<WorkLogStore>()(
  persist(
    (set, get) => ({
      currentLog: null,
      isLoading: false,
      isSaving: false,
      hasConflict: false,
      error: null,
      lastSavedAt: null,
      isDirty: false,
      checkInDate: null,
      lastSessionDate: null,
      localRevision: 0,
      activeSaveRequestId: 0,

      fetchLastSessionDate: async () => {
        try {
          const response = await fetch('/api/work-sessions/today')
          if (response.ok) {
            const { lastSession } = await response.json()
            if (lastSession?.date) {
              set({ lastSessionDate: lastSession.date })
            }
          }
        } catch (error) {
          console.error('Error fetching last session date:', error)
        }
      },

      loadTodayLog: async (checkInDate?: string | null) => {
        set({ isLoading: true, error: null, hasConflict: false })
        
        try {
          // Use the new unified endpoint
          const targetDate = checkInDate || get().checkInDate || getToday()
          const response = await fetch(`/api/work-logs/today?date=${targetDate}`)
          
          if (!response.ok) {
            throw new Error('Failed to fetch work log')
          }

          const { session, workLog } = await response.json()
          
          // Update session info
          if (session) {
            if (session.date) {
              set({ checkInDate: session.active ? session.date : null, lastSessionDate: session.date })
            }
          }
          
          // Update work log
          if (workLog) {
            set({
              currentLog: normalizeWorkLog(workLog),
              isDirty: false,
              localRevision: 0,
            })
          } else {
            // Fallback: create new log
            get().createNewLog(targetDate)
          }
        } catch (error) {
          console.error('Error loading work log:', error)
          set({ error: 'Failed to load work log' })
          // Create new log on error
          get().createNewLog(checkInDate || getToday())
        } finally {
          set({ isLoading: false })
        }
      },

      createNewLog: (date?: string) => {
        // If no date provided, use checkInDate, lastSessionDate, or today
        const targetDate = date || get().checkInDate || get().lastSessionDate || getToday()
        const newLog = createEmptyLog(targetDate)
        set({
          currentLog: newLog,
          isDirty: false,
          hasConflict: false,
          error: null,
          localRevision: 0,
        })
      },

      updateField: (field, value) => {
        const { currentLog } = get()
        if (!currentLog) return

        set((state) => ({
          currentLog: { ...currentLog, [field]: value },
          isDirty: true,
          localRevision: state.localRevision + 1,
        }))
      },

      addTodo: (text) => {
        const { currentLog } = get()
        if (!currentLog) return

        const newTodo: TodoItem = {
          id: Date.now().toString(),
          text,
          completed: false,
          order: currentLog.todos.length
        }

        set((state) => ({
          currentLog: {
            ...currentLog,
            todos: [...currentLog.todos, newTodo]
          },
          isDirty: true,
          localRevision: state.localRevision + 1,
        }))
      },

      toggleTodo: (id) => {
        const { currentLog } = get()
        if (!currentLog) return

        const todo = currentLog.todos.find(t => t.id === id)
        if (todo) {
          // Move to completed
          get().moveTodoToCompleted(id)
        } else {
          // Move back to todos
          const completedTodo = currentLog.completed_todos.find(t => t.id === id)
          if (completedTodo) {
            get().moveCompletedToTodo(id)
          }
        }
      },

      deleteTodo: (id) => {
        const { currentLog } = get()
        if (!currentLog) return

        set((state) => ({
          currentLog: {
            ...currentLog,
            todos: currentLog.todos.filter(t => t.id !== id),
            completed_todos: currentLog.completed_todos.filter(t => t.id !== id)
          },
          isDirty: true,
          localRevision: state.localRevision + 1,
        }))
      },

      moveTodoToCompleted: (id) => {
        const { currentLog } = get()
        if (!currentLog) return

        const todo = currentLog.todos.find(t => t.id === id)
        if (!todo) return

        set((state) => ({
          currentLog: {
            ...currentLog,
            todos: currentLog.todos.filter(t => t.id !== id),
            completed_todos: [...currentLog.completed_todos, { ...todo, completed: true }]
          },
          isDirty: true,
          localRevision: state.localRevision + 1,
        }))
      },

      moveCompletedToTodo: (id) => {
        const { currentLog } = get()
        if (!currentLog) return

        const completedTodo = currentLog.completed_todos.find(t => t.id === id)
        if (!completedTodo) return

        set((state) => ({
          currentLog: {
            ...currentLog,
            completed_todos: currentLog.completed_todos.filter(t => t.id !== id),
            todos: [...currentLog.todos, { ...completedTodo, completed: false }]
          },
          isDirty: true,
          localRevision: state.localRevision + 1,
        }))
      },

      updateTodoText: (id, text) => {
        const { currentLog } = get()
        if (!currentLog) return

        set((state) => ({
          currentLog: {
            ...currentLog,
            todos: currentLog.todos.map(t => 
              t.id === id ? { ...t, text } : t
            ),
            completed_todos: currentLog.completed_todos.map(t => 
              t.id === id ? { ...t, text } : t
            )
          },
          isDirty: true,
          localRevision: state.localRevision + 1,
        }))
      },

      saveToLocalStorage: () => {
        // Mark as saved locally
        const { currentLog } = get()
        if (currentLog) {
          // Force persist middleware to save
          set({ 
            lastSavedAt: new Date(),
            currentLog: { ...currentLog }
          })
        }
      },

      saveToDB: async () => {
        const { currentLog, isDirty, isSaving, hasConflict, localRevision, activeSaveRequestId } = get()
        if (!currentLog || !isDirty || isSaving || hasConflict) return

        const saveRequestId = activeSaveRequestId + 1
        const snapshotLog = currentLog
        const snapshotRevision = localRevision

        set({
          isSaving: true,
          error: null,
          activeSaveRequestId: saveRequestId,
        })

        try {
          const response = await fetch('/api/work-logs', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              date: snapshotLog.date,
              baseVersion: snapshotLog.version,
              todos: snapshotLog.todos,
              completed_todos: snapshotLog.completed_todos,
              roi_high: snapshotLog.roi_high,
              roi_low: snapshotLog.roi_low,
              tomorrow_priority: snapshotLog.tomorrow_priority,
              feedback: snapshotLog.feedback,
              // 이유:
              // 업무일지 작성 흐름에서는 ROI 자가 진단 섹션을 더 이상 노출하지 않습니다.
              // 저장 본문도 현재 UI와 동일한 구조로 유지해야, 숨겨진 문단이 다시 생기지 않습니다.
              content: buildWorkLogContent({
                todos: snapshotLog.todos,
                completed_todos: snapshotLog.completed_todos,
                feedback: snapshotLog.feedback,
              }),
            }),
          })

          const result = await response.json().catch(() => null)

          if (!response.ok) {
            if (response.status === 409) {
              if (get().activeSaveRequestId !== saveRequestId) {
                return
              }

              set({
                error: result?.error || '다른 곳에서 먼저 수정되었습니다.',
                hasConflict: true,
                isSaving: false,
              })
              return
            }

            throw new Error(result?.error || 'Failed to save work log')
          }

          if (get().activeSaveRequestId !== saveRequestId) {
            return
          }

          const latestState = get()
          const latestLog = latestState.currentLog
          if (!latestLog) return

          const savedLog = result?.log || {}
          const hasNewLocalChanges = latestState.localRevision !== snapshotRevision

          set({
            currentLog: {
              ...latestLog,
              id: savedLog.id ?? latestLog.id,
              user_id: savedLog.user_id ?? latestLog.user_id,
              version: savedLog.version ?? latestLog.version,
              created_at: savedLog.created_at ?? latestLog.created_at,
              updated_at: savedLog.updated_at ?? latestLog.updated_at,
            },
            isDirty: hasNewLocalChanges,
            isSaving: false,
            hasConflict: false,
            error: null,
            lastSavedAt: new Date(),
          })
        } catch (error) {
          console.error('Error saving work log:', error)
          set({
            error: error instanceof Error ? error.message : 'Failed to save work log',
            isSaving: false,
          })
        } finally {
          const latestState = get()
          if (latestState.activeSaveRequestId === saveRequestId && latestState.isSaving) {
            set({ isSaving: false })
          }
        }
      },

      flushPendingSave: async () => {
        const { currentLog, isDirty, isSaving, hasConflict } = get()

        // 이유:
        // village 화면 안에서 업무일지를 쓰다가 같은 앱 내 다른 탭으로 빠르게 이동하면
        // interval 저장 주기를 기다리기 전에 컴포넌트가 언마운트될 수 있습니다.
        // 이 시점에는 진행 중 저장/충돌 상태를 존중하면서 dirty draft만 한 번 즉시 저장합니다.
        if (!currentLog || !isDirty || isSaving || hasConflict) {
          return
        }

        await get().saveToDB()
      },

      clearError: () => set({ error: null }),
      
      setDirty: (dirty) => set({ isDirty: dirty }),
      
      setCheckInDate: (date) => {
        set({ checkInDate: date })
      },

      resetForTeamTransition: () => {
        // 이유:
        // 활성 팀이 바뀌면 이전 팀 기준으로 계산된 세션 날짜와 저장 시각을 그대로 유지하면
        // 새 팀의 업무일지 로딩 기준이 꼬일 수 있습니다.
        // 팀 전환/탈퇴/수락 시점에는 업무일지 관련 로컬 상태를 한 번에 초기화합니다.
        clearPersistedWorkLogState()
        set({
          currentLog: null,
          isLoading: false,
          isSaving: false,
          hasConflict: false,
          error: null,
          lastSavedAt: null,
          isDirty: false,
          checkInDate: null,
          lastSessionDate: null,
          localRevision: 0,
          activeSaveRequestId: 0,
        })
      },
    }),
    {
      name: 'work-log-storage',
      storage: workLogStorage,
      partialize: (state) => ({
        // Don't persist currentLog, only checkInDate and lastSessionDate
        // currentLog should be loaded fresh based on checkInDate or lastSessionDate
        lastSavedAt: state.lastSavedAt,
        checkInDate: state.checkInDate,
        lastSessionDate: state.lastSessionDate,
      })
    }
  )
)
