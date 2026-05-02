import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import WorkLogDisplay from './WorkLogDisplay'

describe('WorkLogDisplay todo priorities', () => {
  it('오늘 할 일을 우선순위별로 묶어 표시합니다', () => {
    const html = renderToStaticMarkup(
      <WorkLogDisplay
        todos={[
          { id: 'todo-1', text: '중요한 일', completed: false, order: 0, priority: 'high' },
          { id: 'todo-2', text: '기본 일', completed: false, order: 0, priority: 'normal' },
          { id: 'todo-3', text: '나중 일', completed: false, order: 0, priority: 'low' },
        ]}
        completed_todos={[]}
      />
    )

    expect(html).toContain('높음')
    expect(html).toContain('중요한 일')
    expect(html).toContain('보통')
    expect(html).toContain('기본 일')
    expect(html).toContain('낮음')
    expect(html).toContain('나중 일')
  })

  it('priority가 없는 기존 할 일은 보통으로 표시합니다', () => {
    const html = renderToStaticMarkup(
      <WorkLogDisplay
        todos={[{ id: 'todo-1', text: '기존 일', completed: false, order: 0 }]}
        completed_todos={[]}
      />
    )

    expect(html).toContain('보통')
    expect(html).toContain('기존 일')
  })
})
