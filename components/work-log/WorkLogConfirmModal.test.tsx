import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { WorkLogConfirmContent } from './WorkLogConfirmModal'

describe('WorkLogConfirmContent', () => {
  it('퇴근 확인 모달에서도 오늘 할 일을 우선순위별로 표시합니다', () => {
    const html = renderToStaticMarkup(
      <WorkLogConfirmContent
        workLog={{
          todos: [
            { id: 'todo-1', text: '중요한 일', completed: false, order: 0, priority: 'high' },
            { id: 'todo-2', text: '기본 일', completed: false, order: 0, priority: 'normal' },
          ],
          completed_todos: [],
          roi_high: '',
          roi_low: '',
          tomorrow_priority: '',
          feedback: '',
        }}
      />
    )

    expect(html).toContain('높음')
    expect(html).toContain('중요한 일')
    expect(html).toContain('보통')
    expect(html).toContain('기본 일')
  })
})
