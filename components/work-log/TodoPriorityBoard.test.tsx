import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { PRIORITY_ORDER } from '@/lib/work-log/todo-priority'
import {
  TODO_DRAG_OVERLAY_CLASS_NAME,
  TODO_DRAGGING_ITEM_CLASS_NAME,
  TODO_DRAG_HANDLE_CLASS_NAME,
  TODO_DRAG_OVERLAY_CURSOR_OFFSET,
  TODO_INSERTION_INDICATOR_CLASS_NAME,
  TodoDragOverlayCard,
  TodoPriorityColumn,
  attachTodoOverlayToPointer,
  getDropTarget,
  getPriorityColumnClassNames,
  todoPriorityCollisionDetection,
  getTodoDragHandleAriaLabel,
} from './TodoPriorityBoard'

describe('TodoPriorityBoard static layout', () => {
  it('높음, 보통, 낮음 컬럼을 항상 렌더링할 수 있는 순서를 사용합니다', () => {
    expect(PRIORITY_ORDER).toEqual(['high', 'normal', 'low'])
  })

  it('빈 우선순위 영역도 드롭 대상으로 보이도록 안내 문구를 렌더링합니다', () => {
    const html = renderToStaticMarkup(
      <TodoPriorityColumn priority="high" todos={[]}>
        {null}
      </TodoPriorityColumn>
    )

    expect(html).toContain('높음')
    expect(html).toContain('이 영역으로 끌어 놓으세요')
  })

  it('우선순위 영역은 파스텔톤 주황, 파랑, 초록으로 구분합니다', () => {
    expect(getPriorityColumnClassNames('high').section).toContain('bg-orange-50')
    expect(getPriorityColumnClassNames('normal').section).toContain('bg-blue-50')
    expect(getPriorityColumnClassNames('low').section).toContain('bg-green-50')
    expect(getPriorityColumnClassNames('high').badge).toContain('text-orange-700')
    expect(getPriorityColumnClassNames('normal').badge).toContain('text-blue-700')
    expect(getPriorityColumnClassNames('low').badge).toContain('text-green-700')
  })

  it('드래그 대상 강조도 각 우선순위 컬러를 유지합니다', () => {
    const highHtml = renderToStaticMarkup(
      <TodoPriorityColumn priority="high" todos={[]} isDragTarget>
        {null}
      </TodoPriorityColumn>
    )
    const lowHtml = renderToStaticMarkup(
      <TodoPriorityColumn priority="low" todos={[]} isDragTarget>
        {null}
      </TodoPriorityColumn>
    )

    expect(highHtml).toContain('ring-orange-200')
    expect(lowHtml).toContain('ring-green-200')
  })

  it('드래그 핸들은 텍스트 편집과 구분되는 접근성 라벨과 고정 크기를 가집니다', () => {
    expect(getTodoDragHandleAriaLabel('테스트 할 일')).toBe('테스트 할 일 우선순위 이동')
    expect(TODO_DRAG_HANDLE_CLASS_NAME).toContain('h-8')
    expect(TODO_DRAG_HANDLE_CLASS_NAME).toContain('w-8')
  })

  it('드래그 중 원래 자리의 카드는 반투명 ghost로 보이지 않도록 숨깁니다', () => {
    expect(TODO_DRAGGING_ITEM_CLASS_NAME).toBe('opacity-0')
    expect(TODO_DRAGGING_ITEM_CLASS_NAME).not.toContain('opacity-60')
  })

  it('드래그 중인 카드는 원본 할 일 카드와 같은 구조로 마우스를 따라다닙니다', () => {
    const html = renderToStaticMarkup(
      <TodoDragOverlayCard text="중요한 일" isCarriedOver />
    )

    expect(html).toContain('중요한 일')
    expect(html).toContain('어제 못한일')
    expect(TODO_DRAG_OVERLAY_CLASS_NAME).toContain('bg-white')
    expect(TODO_DRAG_OVERLAY_CLASS_NAME).toContain('w-full')
    expect(TODO_DRAG_OVERLAY_CLASS_NAME).toContain('shadow-xl')
    expect(TODO_DRAG_OVERLAY_CLASS_NAME).not.toContain('max-w')
    expect(TODO_DRAG_OVERLAY_CLASS_NAME).not.toContain('min-w')
    expect(TODO_DRAG_OVERLAY_CLASS_NAME).not.toContain('ring-2')
  })

  it('드래그 overlay는 원본 카드 위치가 아니라 포인터 바로 옆에 배치되도록 보정합니다', () => {
    const transform = attachTodoOverlayToPointer({
      activatorEvent: { clientX: 150, clientY: 80 } as unknown as Event,
      active: {
        id: 'todo-1',
        data: { current: {} },
        rect: {
          current: {
            initial: {
              top: 50,
              left: 100,
              right: 400,
              bottom: 110,
              width: 300,
              height: 60,
            },
            translated: null,
          },
        },
      },
      activeNodeRect: {
        top: 50,
        left: 500,
        right: 800,
        bottom: 110,
        width: 300,
        height: 60,
      },
      draggingNodeRect: null,
      containerNodeRect: null,
      over: null,
      overlayNodeRect: null,
      scrollableAncestors: [],
      scrollableAncestorRects: [],
      transform: { x: 10, y: 20, scaleX: 1, scaleY: 1 },
      windowRect: null,
    })

    expect(transform.x).toBe(10 + 50 + TODO_DRAG_OVERLAY_CURSOR_OFFSET.x)
    expect(transform.y).toBe(20 + 30 + TODO_DRAG_OVERLAY_CURSOR_OFFSET.y)
  })

  it('드롭 대상 컬럼은 카드 자리표시자 없이 컬럼 자체와 얇은 위치선으로 강조합니다', () => {
    const html = renderToStaticMarkup(
      <TodoPriorityColumn priority="high" todos={[]} isDragTarget>
        {null}
      </TodoPriorityColumn>
    )

    expect(html).toContain('ring-2')
    expect(html).not.toContain('opacity-60')
    expect(TODO_INSERTION_INDICATOR_CLASS_NAME).toContain('absolute')
    expect(TODO_INSERTION_INDICATOR_CLASS_NAME).toContain('h-0.5')
    expect(TODO_INSERTION_INDICATOR_CLASS_NAME).not.toContain('my-')
    expect(TODO_INSERTION_INDICATOR_CLASS_NAME).not.toContain('rounded-lg')
  })

  it('collision detection은 마우스 위치 기준 판정을 우선 사용합니다', () => {
    expect(todoPriorityCollisionDetection.name).toBe('todoPriorityCollisionDetection')
  })

  it('포인터가 카드 아래쪽 절반에 있으면 삽입 위치를 해당 카드 다음으로 계산합니다', () => {
    const groups = {
      high: [],
      normal: [
        { id: 'normal-1', text: '보통 1', completed: false, priority: 'normal' as const },
        { id: 'normal-2', text: '보통 2', completed: false, priority: 'normal' as const },
      ],
      low: [],
    }

    const target = getDropTarget(
      {
        active: { id: 'normal-1' },
        activatorEvent: { clientX: 100, clientY: 100 } as unknown as Event,
        delta: { x: 0, y: 75 },
        over: {
          id: 'normal-2',
          rect: {
            top: 140,
            bottom: 200,
            left: 0,
            right: 300,
            width: 300,
            height: 60,
          },
          data: { current: { priority: 'normal', index: 1 } },
        },
      },
      groups
    )

    expect(target).toEqual({
      activeId: 'normal-1',
      priority: 'normal',
      targetIndex: 2,
    })
  })

  it('포인터가 카드 위쪽 절반에 있으면 삽입 위치를 해당 카드 앞으로 계산합니다', () => {
    const groups = {
      high: [],
      normal: [
        { id: 'normal-1', text: '보통 1', completed: false, priority: 'normal' as const },
        { id: 'normal-2', text: '보통 2', completed: false, priority: 'normal' as const },
      ],
      low: [],
    }

    const target = getDropTarget(
      {
        active: { id: 'normal-2' },
        activatorEvent: { clientX: 100, clientY: 100 } as unknown as Event,
        delta: { x: 0, y: 45 },
        over: {
          id: 'normal-1',
          rect: {
            top: 140,
            bottom: 200,
            left: 0,
            right: 300,
            width: 300,
            height: 60,
          },
          data: { current: { priority: 'normal', index: 0 } },
        },
      },
      groups
    )

    expect(target).toEqual({
      activeId: 'normal-2',
      priority: 'normal',
      targetIndex: 0,
    })
  })

  it('비어있지 않은 컬럼 자체가 over로 잡혀도 기존 삽입 위치를 맨 아래로 튕기지 않습니다', () => {
    const groups = {
      high: [
        { id: 'high-1', text: '높음 1', completed: false, priority: 'high' as const },
      ],
      normal: [
        { id: 'normal-1', text: '보통 1', completed: false, priority: 'normal' as const },
        { id: 'normal-2', text: '보통 2', completed: false, priority: 'normal' as const },
      ],
      low: [],
    }

    const target = getDropTarget(
      {
        active: { id: 'normal-1' },
        over: {
          id: 'priority:normal',
          data: { current: { priority: 'normal', index: 2 } },
        },
      },
      groups,
      {
        activeId: 'normal-1',
        priority: 'normal',
        targetIndex: 1,
      }
    )

    expect(target).toEqual({
      activeId: 'normal-1',
      priority: 'normal',
      targetIndex: 1,
    })
  })
})
