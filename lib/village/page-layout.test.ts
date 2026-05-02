import { describe, expect, it } from 'vitest'

import {
  VILLAGE_MAP_COLUMN_CLASS_NAME,
  VILLAGE_PAGE_CONTAINER_CLASS_NAME,
  VILLAGE_PAGE_GRID_CLASS_NAME,
  VILLAGE_WORK_LOG_COLUMN_CLASS_NAME,
} from './page-layout'

describe('village page layout classes', () => {
  it('페이지 컨테이너는 main의 1536px 폭을 다시 container로 제한하지 않습니다', () => {
    expect(VILLAGE_PAGE_CONTAINER_CLASS_NAME).toContain('w-full')
    expect(VILLAGE_PAGE_CONTAINER_CLASS_NAME).not.toContain('container')
  })

  it('큰 화면에서는 팀원 현황을 760px 이하로 제한하고 업무일지가 남은 폭을 가져갑니다', () => {
    expect(VILLAGE_PAGE_GRID_CLASS_NAME).toContain(
      'xl:grid-cols-[minmax(0,min(52%,760px))_minmax(0,1fr)]'
    )
    expect(VILLAGE_PAGE_GRID_CLASS_NAME).not.toContain('xl:grid-cols-5')
  })

  it('두 컬럼은 긴 입력 내용 때문에 그리드 폭을 밀어내지 않도록 min-width를 0으로 둡니다', () => {
    expect(VILLAGE_MAP_COLUMN_CLASS_NAME).toContain('min-w-0')
    expect(VILLAGE_WORK_LOG_COLUMN_CLASS_NAME).toContain('min-w-0')
  })
})
