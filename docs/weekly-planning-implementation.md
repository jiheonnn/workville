# 주간 업무 계획 기능 구현 계획서

## 📋 기능 개요

팀원들이 매주 금요일에 다음 주의 핵심 목표 3개를 설정하고, 각 목표별로 하위 작업을 분류하여 캘린더에 배치하는 생산성 향상 도구

### 핵심 기능
1. **주간 계획 수립**: 핵심 목표 3개 + 각 목표별 하위 작업 5개 이상
2. **캘린더 뷰**: 7일 단위로 작업을 드래그앤드롭으로 배치
3. **업무일지 연동**: 계획된 작업이 업무일지에 자동 표시
4. **팀 협업**: 모든 팀원이 서로의 계획을 보고 수정 가능
5. **성과 추적**: 달성률 표시 및 통계 대시보드

## 🎯 확정된 기능 사양

### 1. 계획 작성 및 수정
- **작성 시점**: 언제든 가능 (금요일 권장)
- **수정 권한**: 모든 팀원이 모든 계획 수정 가능
- **핵심 목표**: 3개 기본, 주중 추가 가능
- **하위 작업**: 목표당 5개 기본, 추가/삭제 가능
- **계획 없이 시작**: 주를 시작한 후에도 계획 추가 가능

### 2. 캘린더 시스템
- **주 시작**: 월요일
- **주 전환**: 일요일 자정
- **표시 단위**: 7일 (월-일)
- **작업 배치**: 날짜별로만 (시간대 없음)
- **드래그앤드롭**: 다른 날짜로만 이동 가능
- **모바일 지원**: 터치 드래그앤드롭 지원
- **최대 표시**: 하루 5개 작업 (더보기로 전체 보기)

### 3. 업무일지 통합
- **자동 표시**: 오늘 날짜의 계획된 작업이 템플릿 페이지 "오늘 할 일"에 자동 표시
- **상태 처리**:
  - ✓ 체크박스: 완료 처리 → "완료한 일"로 이동
  - X 버튼: 취소 처리 → 달성률 계산에서 제외 (취소선으로 표시)
  - 미처리: 저장시 다음날로 자동 이월
- **추가 작업**: 계획에 없던 작업도 "새로운 할 일 추가"로 등록 가능
- **작업 표시**: 각 작업 옆에 소속 핵심 목표 표시

### 4. 팀 협업 기능
- **가시성**: 팀원별 보기 / 팀 전체 보기 전환 가능
- **식별**: 작업 카드에 아바타(character) + 이름 표시
- **색상 구분**: 팀원별 고유 색상
- **작성자 추적**: 누가 작성/수정했는지 기록

### 5. 성과 측정
- **달성률**: 프로그레스바로 캘린더 외부에 표시
- **계산 방식**: (완료 작업 수 / (전체 작업 수 - 취소 작업 수)) × 100%
- **통계**: 개인별 주간/월간 달성률, 팀 평균 달성률

### 6. 데이터 관리
- **삭제 정책**: 완전 삭제
- **히스토리**: 과거 계획 영구 보관 (취소 작업 포함)
- **온보딩**: 빈 상태시 "첫 주간 계획 작성하기" 플레이스홀더

## 🗄️ 데이터베이스 설계

### 테이블 구조

```sql
-- 1. weekly_goals (핵심 목표)
- id (uuid)
- user_id (uuid) → profiles.user_id
- week_start_date (date) -- 해당 주의 월요일 날짜
- goal_number (int) -- 1, 2, 3
- title (text)
- created_by (uuid) → profiles.user_id
- created_at (timestamp)
- updated_by (uuid) → profiles.user_id
- updated_at (timestamp)

-- 2. weekly_tasks (하위 작업)
- id (uuid)
- goal_id (uuid) → weekly_goals.id
- title (text)
- planned_date (date) -- 계획된 날짜
- status (enum: 'pending', 'completed', 'cancelled', 'deferred')
- completed_at (timestamp)
- cancelled_reason (text)
- created_by (uuid) → profiles.user_id
- created_at (timestamp)
- updated_by (uuid) → profiles.user_id
- updated_at (timestamp)

-- 3. task_history (작업 이력)
- id (uuid)
- task_id (uuid) → weekly_tasks.id
- action (enum: 'created', 'moved', 'completed', 'cancelled', 'deferred')
- from_date (date)
- to_date (date)
- performed_by (uuid) → profiles.user_id
- performed_at (timestamp)

-- 4. daily_actual_tasks (실제 수행 작업)
- id (uuid)
- user_id (uuid) → profiles.user_id
- date (date)
- planned_task_id (uuid) → weekly_tasks.id (nullable)
- title (text) -- 계획에 없던 작업용
- status (enum: 'completed', 'deferred')
- created_at (timestamp)
```

### RLS 정책
- 모든 테이블: 인증된 사용자 전체 읽기/쓰기 권한
- task_history: 읽기 전용

## 🎨 UI/UX 설계

### 페이지 구조

#### 1. `/planning` - 메인 계획 페이지
- **상단**: 주 선택기 (이전 주 / 현재 주 / 다음 주)
- **좌측 사이드바**: 
  - 팀원 목록 (아바타 + 이름)
  - 전체 보기 / 개인별 필터
- **중앙 영역**:
  - 3개 핵심 목표 카드 (프로그레스바 포함)
  - 각 목표별 하위 작업 리스트
  - 작업 추가 버튼
- **우측 캘린더**:
  - 7일 그리드 (월-일)
  - 드래그 가능한 작업 카드
  - 하루 5개까지 표시, 더보기 버튼

#### 2. `/planning/dashboard` - 팀 통계
- **개인 통계**: 주간/월간 달성률 차트
- **팀 통계**: 평균 달성률, 최고 성과자
- **트렌드**: 시간별 달성률 추이

#### 3. `/planning/history` - 과거 계획
- **목록 뷰**: 주별 계획 목록
- **상세 뷰**: 선택한 주의 계획 및 달성 결과
- **필터**: 기간, 팀원, 달성률 범위

### 컴포넌트 구조

```
components/
├── planning/
│   ├── WeekSelector.tsx        // 주 선택 네비게이션
│   ├── GoalCard.tsx            // 핵심 목표 카드
│   ├── TaskItem.tsx            // 하위 작업 아이템
│   ├── TaskCalendar.tsx        // 7일 캘린더 뷰
│   ├── TaskCard.tsx            // 드래그 가능한 작업 카드
│   ├── TeamSidebar.tsx         // 팀원 필터 사이드바
│   ├── ProgressBar.tsx         // 달성률 프로그레스바
│   └── EmptyPlanning.tsx       // 빈 상태 플레이스홀더
├── dashboard/
│   ├── PersonalStats.tsx       // 개인 통계
│   ├── TeamStats.tsx           // 팀 통계
│   └── TrendChart.tsx          // 추이 차트
└── template/
    └── PlannedTasksSection.tsx // 업무일지 연동 섹션
```

## 🔧 구현 단계

### Phase 1: 데이터베이스 (Day 1)
1. Supabase 테이블 생성 (weekly_goals, weekly_tasks, task_history, daily_actual_tasks)
2. RLS 정책 설정
3. 초기 데이터 시드 (테스트용)

### Phase 2: 기본 CRUD (Day 2-3)
1. 주간 계획 페이지 레이아웃 (`/planning`)
2. 핵심 목표 CRUD API
3. 하위 작업 CRUD API
4. Zustand store 설정 (`planning-store.ts`)

### Phase 3: 캘린더 기능 (Day 4-5)
1. 7일 캘린더 그리드 구현
2. 드래그앤드롭 기능 (react-beautiful-dnd 또는 dnd-kit)
3. 모바일 터치 지원
4. 작업 이동시 DB 업데이트

### Phase 4: 업무일지 연동 (Day 6)
1. 템플릿 페이지 수정
2. 계획된 작업 자동 로드
3. 완료/취소/이월 처리 로직
4. daily_actual_tasks 테이블 연동

### Phase 5: 팀 협업 기능 (Day 7)
1. 팀원 필터링
2. 아바타 + 이름 표시
3. 작성자/수정자 추적
4. 실시간 업데이트 (Supabase Realtime)

### Phase 6: 통계 및 대시보드 (Day 8)
1. 달성률 계산 로직
2. 개인/팀 통계 페이지
3. 차트 구현 (recharts 또는 chart.js)

### Phase 7: 히스토리 (Day 9)
1. 과거 계획 조회 페이지
2. 페이지네이션
3. 필터링 기능

### Phase 8: 최적화 및 마무리 (Day 10)
1. 성능 최적화
2. 에러 처리
3. 로딩 상태
4. 테스트

## 🚀 기술 스택

### 사용할 라이브러리
- **드래그앤드롭**: @dnd-kit/sortable (모바일 지원 우수)
- **날짜 처리**: date-fns
- **차트**: recharts
- **상태 관리**: zustand (기존 프로젝트와 통일)
- **아이콘**: lucide-react (기존 사용중)

### API 엔드포인트
- Supabase MCP 직접 사용 (별도 API 라우트 불필요)

## 📝 중요 고려사항

### 1. 성능 최적화
- 초기 구현은 단순하게
- 데이터 증가시 페이지네이션 적용
- 6개월 이상 데이터는 나중에 아카이빙 고려

### 2. 사용자 경험
- 드래그앤드롭 시각적 피드백
- 자동 저장 with debounce
- 낙관적 업데이트 (Optimistic UI)

### 3. 엣지 케이스
- 주말 작업 처리
- 공휴일 고려
- 다중 사용자 동시 편집

### 4. 확장 가능성
- 작업별 예상 시간 (향후 추가)
- AI 기반 계획 추천 (향후 추가)
- 외부 캘린더 연동 (향후 추가)

## 🎯 성공 지표

1. **사용성**: 계획 작성 시간 < 10분
2. **참여율**: 팀원 80% 이상 매주 계획 작성
3. **달성률**: 평균 70% 이상 작업 완료
4. **만족도**: 생산성 향상 체감

## 🔄 업데이트 로그

- 2025-08-15: 초기 계획서 작성
- 핵심 기능 정의 완료
- 데이터베이스 스키마 설계
- UI/UX 구조 확정
- 구현 단계별 계획 수립