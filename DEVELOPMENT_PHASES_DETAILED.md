# Workville 상세 개발 단계별 가이드

## 📌 프로젝트 현재 상태
- **시작일**: 2025-01-13
- **현재 단계**: Phase 3 시작 전
- **완료된 작업**: Phase 1, Phase 2 완료

---

## Phase 1: 기초 설정 및 데이터베이스 구축 ✅

### 완료된 작업:
- Next.js 프로젝트 생성 (TypeScript, Tailwind CSS)
- 패키지 설치: @supabase/ssr, zustand
- Supabase 연결 및 환경변수 설정
- 데이터베이스 스키마 적용 (5개 테이블)
- TypeScript 타입 정의 완료

---

## Phase 2: 인증 시스템 및 캐릭터 선택 ✅

### 완료된 작업:
- 인증 미들웨어 구현 (캐릭터 미선택 시 리다이렉트 포함)
- Zustand Auth 스토어 구현
- 로그인/회원가입 페이지 완성
- 캐릭터 선택 페이지 (4종 캐릭터)
- 메인 레이아웃 및 네비게이션 바

---

## Phase 3: 마을 UI 및 캐릭터 애니메이션

### 3.1 마을 레이아웃 구조
```
components/village/
├── VillageLayout.tsx      # 전체 마을 컨테이너
├── Office.tsx            # 중앙 사무실
├── House.tsx             # 개별 집 컴포넌트
├── BreakArea.tsx         # 휴식 공간
└── Character.tsx         # 캐릭터 애니메이션
```

### 3.2 마을 그리드 시스템
```css
/* 마을 레이아웃 (9x7 그리드) */
.village-grid {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  grid-template-rows: repeat(7, 1fr);
}

/* 위치 배치 */
.house-1 { grid-area: 1/2/3/4; }  /* 위 왼쪽 */
.house-2 { grid-area: 1/4/3/6; }  /* 위 중앙왼쪽 */
.house-3 { grid-area: 1/6/3/8; }  /* 위 중앙오른쪽 */
.house-4 { grid-area: 1/8/3/10; } /* 위 오른쪽 */
.office { grid-area: 3/4/5/7; }   /* 중앙 */
.break-area { grid-area: 6/4/8/7; } /* 아래 */
```

### 3.3 캐릭터 애니메이션 시스템
`components/village/Character.tsx`:
```typescript
interface CharacterProps {
  characterType: CharacterType
  status: UserStatus
  position: { x: number, y: number }
  username: string
}

// PNG 2장 교차 애니메이션
// 0.5초마다 이미지 전환
// 상태 변경 시 부드러운 위치 이동 (transition)
```

### 3.4 실시간 위치 업데이트
- 상태별 고정 위치:
  - working: 사무실 내부
  - home: 자신의 집
  - break: 휴식 공간
- CSS transition으로 부드러운 이동

### 3.5 캐릭터 이미지 구조
```
public/characters/
├── character1/
│   ├── working_1.png
│   ├── working_2.png
│   ├── home_1.png
│   ├── home_2.png
│   ├── break_1.png
│   └── break_2.png
└── (character2-4 동일)
```

### ✅ Phase 3 체크리스트
- [ ] 마을 레이아웃 컴포넌트 생성
- [ ] CSS Grid 기반 위치 시스템
- [ ] 캐릭터 애니메이션 컴포넌트
- [ ] 캐릭터 이미지 파일 구조 준비
- [ ] 상태별 위치 매핑 로직
- [ ] 부드러운 전환 애니메이션

---

## Phase 4: 상태 관리 및 실시간 동기화

### 4.1 상태 관리 스토어
`lib/stores/village-store.ts`:
```typescript
interface VillageStore {
  users: Map<string, UserWithStatus>
  currentUserStatus: UserStatus
  setUserStatus: (userId: string, status: UserStatus) => void
  updateCurrentUserStatus: (status: UserStatus) => void
}
```

### 4.2 상태 변경 API
`app/api/status/route.ts`:
- POST: 상태 업데이트
- 근무 시간 계산 로직
- work_sessions 테이블 업데이트

### 4.3 실시간 구독 설정
`hooks/useRealtimeStatus.ts`:
```typescript
// Supabase Realtime 구독
// user_status 테이블 변경 감지
// 실시간 UI 업데이트
```

### 4.4 출근/퇴근 처리 로직
1. **출근 버튼 클릭**:
   - user_status를 'working'으로 변경
   - work_sessions에 새 레코드 생성 (check_in_time)
   - 캐릭터를 사무실로 이동

2. **퇴근 버튼 클릭**:
   - user_status를 'home'으로 변경
   - work_sessions 레코드 업데이트 (check_out_time, duration)
   - 업무 일지 작성 모달 표시
   - 캐릭터를 집으로 이동

3. **휴식 버튼 클릭**:
   - user_status를 'break'로 변경
   - 캐릭터를 휴식 공간으로 이동

### 4.5 온라인/오프라인 표시
- Supabase Presence 활용
- 온라인 유저 실시간 추적
- 오프라인 유저 반투명 처리

### ✅ Phase 4 체크리스트
- [ ] Village 상태 관리 스토어
- [ ] 상태 변경 API 엔드포인트
- [ ] 실시간 구독 훅 구현
- [ ] 출근/퇴근/휴식 버튼 UI
- [ ] 근무 시간 계산 로직
- [ ] 온라인/오프라인 표시

---

## Phase 5: 업무 일지 및 레벨 시스템

### 5.1 업무 일지 모달
`components/work-log/WorkLogModal.tsx`:
- 퇴근 시 자동으로 표시
- 템플릿 기반 에디터
- 저장 후 자동 닫기

### 5.2 템플릿 관리
`components/work-log/TemplateEditor.tsx`:
- 현재 템플릿 표시
- 수정 권한 (모든 유저)
- 실시간 동기화

### 5.3 레벨 계산 시스템
```typescript
// 8시간 = 1레벨
// profiles.total_work_hours 업데이트
// 레벨 = Math.floor(total_work_hours / 8) + 1
```

### 5.4 일지 조회 페이지
`app/(main)/logs/page.tsx`:
- 날짜별 필터링
- 팀원별 필터링
- 캘린더 뷰

### ✅ Phase 5 체크리스트
- [ ] 업무 일지 작성 모달
- [ ] 템플릿 에디터
- [ ] 레벨 계산 로직
- [ ] 일지 조회 페이지
- [ ] 프로필에 레벨 표시

---

## Phase 6: 통계 대시보드 및 최종 마무리

### 6.1 통계 페이지
`app/(main)/stats/page.tsx`:
- 개인 통계:
  - 일별/주별/월별 근무 시간
  - 평균 근무 시간
  - 현재 레벨 및 진행도
- 팀 통계:
  - 팀원별 근무 시간 비교
  - 전체 평균 근무 시간

### 6.2 차트 구현
- Chart.js 또는 Recharts 사용
- 막대 그래프, 라인 차트
- 반응형 디자인

### 6.3 성능 최적화
- 이미지 최적화 (Next/Image)
- 불필요한 리렌더링 방지
- 실시간 구독 최적화

### 6.4 반응형 디자인
- 모바일 뷰 고려
- 터치 인터페이스
- 최소 뷰포트 처리

### 6.5 에러 처리
- 네트워크 에러
- 인증 에러
- 데이터 로딩 상태

### ✅ Phase 6 체크리스트
- [ ] 통계 페이지 구현
- [ ] 차트 라이브러리 통합
- [ ] 성능 최적화
- [ ] 반응형 디자인
- [ ] 에러 바운더리
- [ ] 로딩 스켈레톤
- [ ] 최종 테스트

---

## 🚨 다음 세션 시작 시 확인사항

### 현재 상태 (2025-01-14)
- ✅ Phase 1: 프로젝트 초기 설정 완료
- ✅ Phase 2: 인증 시스템 완료
- 🚧 Phase 3: 마을 UI 및 애니메이션 대기 중

### 환경 설정
- Supabase URL: https://ostawzicicutfljphyvg.supabase.co
- 데이터베이스 테이블 5개 생성 완료
- 인증 플로우 작동 중

### 다음 작업: Phase 3
1. 캐릭터 PNG 이미지 파일 준비 (4캐릭터 x 3상태 x 2프레임)
2. 마을 컴포넌트 생성 (VillageLayout, Office, House, BreakArea)
3. 캐릭터 애니메이션 컴포넌트
4. CSS Grid 레이아웃 시스템

## 📝 트러블슈팅 가이드

### 자주 발생하는 문제
1. **Supabase 연결 오류**
   - 환경 변수 확인
   - RLS 정책 확인

2. **실시간 동기화 안됨**
   - Realtime 구독 상태 확인
   - 네트워크 연결 확인

3. **이미지 로딩 실패**
   - 파일 경로 확인
   - Next/Image 설정 확인

4. **인증 리다이렉트 무한 루프**
   - 미들웨어 설정 확인
   - 세션 상태 확인

---

이 문서를 참고하여 각 Phase를 순차적으로 진행하며, 완료된 작업은 체크리스트에 표시하여 진행 상황을 추적하세요.