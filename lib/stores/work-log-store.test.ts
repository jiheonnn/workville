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

describe('useWorkLogStore team transition reset', () => {
  beforeEach(() => {
    resetStore()
    vi.restoreAllMocks()
  })

  it('팀이 바뀌면 업무일지 관련 로컬 상태를 초기화합니다', () => {
    const removeItem = vi.fn()
    vi.stubGlobal('window', {
      localStorage: {
        removeItem,
      },
    } as unknown as Window & typeof globalThis)

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
      hasConflict: true,
      error: 'conflict',
      checkInDate: '2026-04-23',
      lastSessionDate: '2026-04-23',
      lastSavedAt: new Date('2026-04-23T01:00:00.000Z'),
      localRevision: 3,
      activeSaveRequestId: 9,
    })

    useWorkLogStore.getState().resetForTeamTransition()

    const state = useWorkLogStore.getState()
    expect(removeItem).toHaveBeenCalledWith('work-log-storage')
    expect(state.currentLog).toBeNull()
    expect(state.isDirty).toBe(false)
    expect(state.hasConflict).toBe(false)
    expect(state.error).toBeNull()
    expect(state.checkInDate).toBeNull()
    expect(state.lastSessionDate).toBeNull()
    expect(state.lastSavedAt).toBeNull()
    expect(state.localRevision).toBe(0)
    expect(state.activeSaveRequestId).toBe(0)
  })
})

describe('useWorkLogStore check-in sync', () => {
  beforeEach(() => {
    resetStore()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('출근 직후 같은 날짜의 빈 로그를 들고 있어도 DB의 이월 할 일로 다시 동기화합니다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        createMockResponse({
          session: {
            active: { date: '2026-04-23' },
            last: { date: '2026-04-23' },
            date: '2026-04-23',
          },
          workLog: {
            id: 'log-1',
            date: '2026-04-23',
            todos: [
              {
                id: 'carried-1',
                text: '[어제 못한일] 정산 마무리',
                completed: false,
                order: 0,
                priority: 'high',
              },
            ],
            completed_todos: [],
            roi_high: '',
            roi_low: '',
            tomorrow_priority: '',
            feedback: '',
          },
        })
      )
    )

    useWorkLogStore.setState({
      currentLog: {
        date: '2026-04-23',
        todos: [],
        completed_todos: [],
        roi_high: '',
        roi_low: '',
        tomorrow_priority: '',
        feedback: '',
      },
      isDirty: false,
    })

    await useWorkLogStore.getState().syncAfterCheckIn('2026-04-23')

    expect(fetch).toHaveBeenCalledWith('/api/work-logs/today?date=2026-04-23')
    expect(useWorkLogStore.getState().checkInDate).toBe('2026-04-23')
    expect(useWorkLogStore.getState().currentLog?.todos).toEqual([
      {
        id: 'carried-1',
        text: '[어제 못한일] 정산 마무리',
        completed: false,
        order: 0,
        priority: 'high',
      },
    ])
  })

  it('출근 직전 사용자가 수정 중인 업무일지가 있으면 DB 재조회로 덮어쓰지 않습니다', async () => {
    vi.stubGlobal('fetch', vi.fn())

    useWorkLogStore.setState({
      currentLog: {
        date: '2026-04-23',
        todos: [
          {
            id: 'local-1',
            text: '작성 중인 로컬 할 일',
            completed: false,
            order: 0,
            priority: 'normal',
          },
        ],
        completed_todos: [],
        roi_high: '',
        roi_low: '',
        tomorrow_priority: '',
        feedback: '',
      },
      isDirty: true,
    })

    await useWorkLogStore.getState().syncAfterCheckIn('2026-04-23')

    expect(fetch).not.toHaveBeenCalled()
    expect(useWorkLogStore.getState().checkInDate).toBe('2026-04-23')
    expect(useWorkLogStore.getState().currentLog?.todos[0].text).toBe('작성 중인 로컬 할 일')
    expect(useWorkLogStore.getState().isDirty).toBe(true)
  })
})

describe('useWorkLogStore todo priority', () => {
  beforeEach(() => {
    resetStore()
    vi.restoreAllMocks()
  })

  it('새 할 일은 기본 우선순위 보통으로 추가합니다', () => {
    useWorkLogStore.getState().createNewLog('2026-04-23')

    useWorkLogStore.getState().addTodo('새 할 일')

    expect(useWorkLogStore.getState().currentLog?.todos[0]).toMatchObject({
      text: '새 할 일',
      priority: 'normal',
      order: 0,
    })
  })

  it('DB에서 불러온 기존 할 일에 priority가 없으면 보통으로 정규화합니다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        createMockResponse({
          session: null,
          workLog: {
            date: '2026-04-23',
            todos: [{ id: 'todo-1', text: '기존 할 일', completed: false, order: 0 }],
            completed_todos: [{ id: 'done-1', text: '기존 완료', completed: true, order: 0 }],
            roi_high: '',
            roi_low: '',
            tomorrow_priority: '',
            feedback: '',
          },
        })
      )
    )

    await useWorkLogStore.getState().loadTodayLog('2026-04-23')

    expect(useWorkLogStore.getState().currentLog?.todos[0].priority).toBe('normal')
    expect(useWorkLogStore.getState().currentLog?.completed_todos[0].priority).toBe('normal')
  })

  it('할 일을 다른 우선순위 영역으로 옮기고 대상 영역 안 순서를 재계산합니다', () => {
    useWorkLogStore.setState({
      currentLog: {
        date: '2026-04-23',
        todos: [
          { id: 'todo-1', text: '높음', completed: false, order: 0, priority: 'high' },
          { id: 'todo-2', text: '보통 1', completed: false, order: 0, priority: 'normal' },
          { id: 'todo-3', text: '보통 2', completed: false, order: 1, priority: 'normal' },
        ],
        completed_todos: [],
        roi_high: '',
        roi_low: '',
        tomorrow_priority: '',
        feedback: '',
      },
    })

    useWorkLogStore.getState().updateTodoPriorityAndOrder('todo-1', 'normal', 1)

    expect(useWorkLogStore.getState().currentLog?.todos).toEqual([
      { id: 'todo-2', text: '보통 1', completed: false, order: 0, priority: 'normal' },
      { id: 'todo-1', text: '높음', completed: false, order: 1, priority: 'normal' },
      { id: 'todo-3', text: '보통 2', completed: false, order: 2, priority: 'normal' },
    ])
    expect(useWorkLogStore.getState().isDirty).toBe(true)
  })

  it('완료 처리와 미완료 복귀 과정에서 priority를 유지합니다', () => {
    useWorkLogStore.setState({
      currentLog: {
        date: '2026-04-23',
        todos: [{ id: 'todo-1', text: '중요한 일', completed: false, order: 0, priority: 'high' }],
        completed_todos: [],
        roi_high: '',
        roi_low: '',
        tomorrow_priority: '',
        feedback: '',
      },
    })

    useWorkLogStore.getState().toggleTodo('todo-1')
    expect(useWorkLogStore.getState().currentLog?.completed_todos[0].priority).toBe('high')

    useWorkLogStore.getState().toggleTodo('todo-1')
    expect(useWorkLogStore.getState().currentLog?.todos[0].priority).toBe('high')
  })
})

describe('useWorkLogStore flushPendingSave', () => {
  beforeEach(() => {
    resetStore()
    vi.restoreAllMocks()
  })

  it('dirty 상태에서는 즉시 저장을 시도합니다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        createMockResponse({
          log: {
            id: 'log-1',
            version: 1,
            updated_at: '2026-04-23T01:00:00.000Z',
          },
        })
      )
    )

    useWorkLogStore.setState({
      currentLog: {
        date: '2026-04-23',
        todos: [{ id: 'todo-1', text: '즉시 저장', completed: false, order: 0 }],
        completed_todos: [],
        roi_high: '',
        roi_low: '',
        tomorrow_priority: '',
        feedback: '',
      },
      isDirty: true,
    })

    await useWorkLogStore.getState().flushPendingSave()

    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('충돌 상태에서는 강제로 저장하지 않고 로컬 draft를 유지합니다', async () => {
    vi.stubGlobal('fetch', vi.fn())

    useWorkLogStore.setState({
      currentLog: {
        id: 'log-1',
        date: '2026-04-23',
        version: 2,
        todos: [{ id: 'todo-1', text: '충돌 draft', completed: false, order: 0 }],
        completed_todos: [],
        roi_high: '',
        roi_low: '',
        tomorrow_priority: '',
        feedback: '',
      },
      isDirty: true,
      hasConflict: true,
    })

    await useWorkLogStore.getState().flushPendingSave()

    expect(fetch).not.toHaveBeenCalled()
    expect(useWorkLogStore.getState().currentLog?.todos[0].text).toBe('충돌 draft')
  })
})
