import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
  created_at?: string
  updated_at?: string
}

interface WorkLogStore {
  currentLog: WorkLog | null
  isLoading: boolean
  error: string | null
  lastSavedAt: Date | null
  isDirty: boolean
  checkInDate: string | null // 출근 날짜 저장

  // Actions
  loadTodayLog: (checkInDate?: string) => Promise<void>
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
  clearError: () => void
  setDirty: (dirty: boolean) => void
  setCheckInDate: (date: string) => void
}

const getToday = () => {
  // Use consistent date formatting
  return new Date().toISOString().split('T')[0]
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

export const useWorkLogStore = create<WorkLogStore>()(
  persist(
    (set, get) => ({
      currentLog: null,
      isLoading: false,
      error: null,
      lastSavedAt: null,
      isDirty: false,
      checkInDate: null,

      loadTodayLog: async (checkInDate?: string) => {
        set({ isLoading: true, error: null })
        
        // Use checkInDate if provided, otherwise use stored checkInDate, fallback to today
        const targetDate = checkInDate || get().checkInDate || getToday()
        
        // Store the checkInDate
        if (checkInDate) {
          set({ checkInDate })
        }
        
        try {
          const response = await fetch(`/api/work-logs?date=${targetDate}`)
          
          if (!response.ok) {
            throw new Error('Failed to fetch work log')
          }

          const { logs } = await response.json()
          
          if (logs && logs.length > 0) {
            // Use the first log for the target date
            const todayLog = logs[0]
            set({ 
              currentLog: {
                ...todayLog,
                todos: todayLog.todos || [],
                completed_todos: todayLog.completed_todos || [],
                roi_high: todayLog.roi_high || '',
                roi_low: todayLog.roi_low || '',
                tomorrow_priority: todayLog.tomorrow_priority || '',
                feedback: todayLog.feedback || ''
              },
              isDirty: false 
            })
          } else {
            // Create new log for the target date
            get().createNewLog(targetDate)
          }
        } catch (error) {
          console.error('Error loading work log:', error)
          set({ error: 'Failed to load work log' })
          // Create new log on error
          get().createNewLog(targetDate)
        } finally {
          set({ isLoading: false })
        }
      },

      createNewLog: (date?: string) => {
        const targetDate = date || get().checkInDate || getToday()
        const newLog = createEmptyLog(targetDate)
        set({ currentLog: newLog, isDirty: true })
      },

      updateField: (field, value) => {
        const { currentLog } = get()
        if (!currentLog) return

        set({
          currentLog: { ...currentLog, [field]: value },
          isDirty: true
        })
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

        set({
          currentLog: {
            ...currentLog,
            todos: [...currentLog.todos, newTodo]
          },
          isDirty: true
        })
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

        set({
          currentLog: {
            ...currentLog,
            todos: currentLog.todos.filter(t => t.id !== id),
            completed_todos: currentLog.completed_todos.filter(t => t.id !== id)
          },
          isDirty: true
        })
      },

      moveTodoToCompleted: (id) => {
        const { currentLog } = get()
        if (!currentLog) return

        const todo = currentLog.todos.find(t => t.id === id)
        if (!todo) return

        set({
          currentLog: {
            ...currentLog,
            todos: currentLog.todos.filter(t => t.id !== id),
            completed_todos: [...currentLog.completed_todos, { ...todo, completed: true }]
          },
          isDirty: true
        })
      },

      moveCompletedToTodo: (id) => {
        const { currentLog } = get()
        if (!currentLog) return

        const completedTodo = currentLog.completed_todos.find(t => t.id === id)
        if (!completedTodo) return

        set({
          currentLog: {
            ...currentLog,
            completed_todos: currentLog.completed_todos.filter(t => t.id !== id),
            todos: [...currentLog.todos, { ...completedTodo, completed: false }]
          },
          isDirty: true
        })
      },

      updateTodoText: (id, text) => {
        const { currentLog } = get()
        if (!currentLog) return

        set({
          currentLog: {
            ...currentLog,
            todos: currentLog.todos.map(t => 
              t.id === id ? { ...t, text } : t
            ),
            completed_todos: currentLog.completed_todos.map(t => 
              t.id === id ? { ...t, text } : t
            )
          },
          isDirty: true
        })
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
        const { currentLog } = get()
        if (!currentLog || !get().isDirty) return

        set({ isLoading: true, error: null })

        try {
          const method = currentLog.id ? 'PATCH' : 'POST'
          const url = currentLog.id 
            ? `/api/work-logs/${currentLog.id}`
            : '/api/work-logs'

          const response = await fetch(url, {
            method,
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              date: currentLog.date,
              todos: currentLog.todos,
              completed_todos: currentLog.completed_todos,
              roi_high: currentLog.roi_high,
              roi_low: currentLog.roi_low,
              tomorrow_priority: currentLog.tomorrow_priority,
              feedback: currentLog.feedback,
              content: `## ✈️ 오늘 할 일\n${currentLog.todos.map(t => `- [${t.completed ? 'x' : ' '}] ${t.text}`).join('\n')}\n\n## ✅ 완료한 일\n${currentLog.completed_todos.map(t => `- [x] ${t.text}`).join('\n')}\n\n## 💡 ROI 자가 진단\n\n1. 오늘 한 일 중 가장 **ROI 높은 일**은?\n→ ${currentLog.roi_high}\n\n2. 오늘 한 일 중 가장 **ROI 낮은 일**은?\n→ ${currentLog.roi_low}\n\n3. 내일 가장 먼저 할 일 (ROI 기준)\n→ ${currentLog.tomorrow_priority}\n\n## ✅ 자가 피드백\n${currentLog.feedback}`
            }),
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to save work log')
          }

          const result = await response.json()
          
          // Update with the returned ID if it's a new log
          if (!currentLog.id && result.id) {
            set({
              currentLog: { ...currentLog, id: result.id },
              isDirty: false,
              lastSavedAt: new Date()
            })
          } else {
            set({ isDirty: false, lastSavedAt: new Date() })
          }
        } catch (error) {
          console.error('Error saving work log:', error)
          set({ error: error instanceof Error ? error.message : 'Failed to save work log' })
        } finally {
          set({ isLoading: false })
        }
      },

      clearError: () => set({ error: null }),
      
      setDirty: (dirty) => set({ isDirty: dirty }),
      
      setCheckInDate: (date) => set({ checkInDate: date })
    }),
    {
      name: 'work-log-storage',
      partialize: (state) => ({
        currentLog: state.currentLog,
        lastSavedAt: state.lastSavedAt,
        checkInDate: state.checkInDate
      })
    }
  )
)