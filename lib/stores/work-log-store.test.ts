import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useWorkLogStore } from './work-log-store'

const createMockResponse = (body: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json',
    },
    ...init,
  })

const resetStore = () => {
  useWorkLogStore.setState({
    currentLog: null,
    isLoading: false,
    error: null,
    lastSavedAt: null,
    isDirty: false,
    checkInDate: null,
    lastSessionDate: null,
  })
}

describe('useWorkLogStore saveToDB', () => {
  beforeEach(() => {
    resetStore()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('저장 응답이 늦게 와도 그 사이의 최신 수정 내용을 덮어쓰지 않습니다', async () => {
    let resolveResponse: ((value: Response) => void) | null = null

    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>((resolve) => {
        resolveResponse = resolve
      }))
    )

    useWorkLogStore.setState({
      currentLog: {
        date: '2026-04-23',
        todos: [{ id: 'todo-1', text: '초기 내용', completed: false, order: 0 }],
        completed_todos: [],
        roi_high: '',
        roi_low: '',
        tomorrow_priority: '',
        feedback: '',
      },
      isDirty: true,
    })

    const savePromise = useWorkLogStore.getState().saveToDB()
    useWorkLogStore.getState().updateTodoText('todo-1', '저장 중 수정한 최신 내용')

    resolveResponse?.(
      createMockResponse({
        log: {
          id: 'log-1',
          version: 1,
          updated_at: '2026-04-23T01:00:00.000Z',
        },
      })
    )

    await savePromise

    const state = useWorkLogStore.getState()
    expect(state.currentLog?.todos[0].text).toBe('저장 중 수정한 최신 내용')
    expect(state.currentLog?.id).toBe('log-1')
    expect(state.currentLog?.version).toBe(1)
    expect(state.isDirty).toBe(true)
  })

  it('충돌 응답을 받으면 로컬 draft를 유지하고 자동 저장을 멈출 수 있는 상태를 남깁니다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        createMockResponse(
          {
            error: '다른 곳에서 먼저 수정되었습니다.',
            currentLog: {
              id: 'log-1',
              version: 3,
            },
          },
          { status: 409 }
        )
      )
    )

    useWorkLogStore.setState({
      currentLog: {
        id: 'log-1',
        date: '2026-04-23',
        version: 2,
        todos: [{ id: 'todo-1', text: '내 로컬 draft', completed: false, order: 0 }],
        completed_todos: [],
        roi_high: '',
        roi_low: '',
        tomorrow_priority: '',
        feedback: '',
      },
      isDirty: true,
    })

    await useWorkLogStore.getState().saveToDB()

    const state = useWorkLogStore.getState()
    expect(state.currentLog?.todos[0].text).toBe('내 로컬 draft')
    expect(state.isDirty).toBe(true)
    expect(state.error).toContain('먼저 수정')
    expect(state.hasConflict).toBe(true)
  })
})
