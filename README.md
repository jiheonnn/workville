# Workville

팀원들의 근무 상태를 가상 마을로 시각화하는 웹 애플리케이션

## 🚀 시작하기

### 1. 환경 설정

1. `.env.local.example` 파일을 복사하여 `.env.local` 파일을 만듭니다:
```bash
cp .env.local.example .env.local
```

2. Supabase 프로젝트를 생성하고 환경 변수를 설정합니다:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
CRON_SECRET=your_random_cron_secret
```

3. Vercel에 배포할 경우 같은 키 이름으로 환경 변수를 등록합니다:
```bash
npx vercel env add NEXT_PUBLIC_SUPABASE_URL
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
npx vercel env add SUPABASE_SERVICE_ROLE_KEY
npx vercel env add CRON_SECRET
```

Slack Webhook URL은 팀장이 팀 관리 화면에서 팀별로 등록합니다.
`CRON_SECRET`은 12시간 퇴근 리마인드 Cron API 보호에 사용하는 서버 전용 값입니다.

### 2. 데이터베이스 설정

Supabase SQL Editor에서 `supabase/migrations/001_initial_schema.sql` 파일의 내용을 실행합니다.

### 3. 의존성 설치 및 실행

```bash
# 의존성 설치
yarn install

# 개발 서버 실행
yarn dev

# 린트 실행
yarn lint
```

http://localhost:3000 에서 애플리케이션을 확인할 수 있습니다.

`yarn lint`는 Next.js 16부터 제거된 `next lint` 대신 ESLint CLI를 사용합니다.

## 📁 프로젝트 구조

```
workville/
├── app/                    # Next.js App Router
├── components/             # React 컴포넌트
├── lib/                    # 유틸리티 및 설정
│   └── supabase/          # Supabase 클라이언트
├── types/                  # TypeScript 타입 정의
├── public/                 # 정적 파일
│   └── characters/        # 캐릭터 이미지
└── supabase/              # 데이터베이스 마이그레이션
```

## 🛠 기술 스택

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Realtime)
- **State**: Zustand

## 📋 기능

- 실시간 팀원 상태 확인 (출근/퇴근/휴식)
- 도트 아바타 애니메이션
- 근무 시간 추적 및 레벨 시스템
- 업무 일지 작성
- 통계 대시보드
