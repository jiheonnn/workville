# Workville Codebase Overview (gemini.md)

## 1. Project Introduction
- **Name:** Workville
- **Description:** 팀원들의 근무 상태를 시각화하고 업무 일지를 관리하며, 개인 및 팀 통계를 제공하는 웹 애플리케이션. 사이드 프로젝트로 개발중.
- **Technologies:** Next.js, React, Tailwind CSS, Supabase, Zustand, Recharts.

## 2. Architecture
- **Frontend:** Next.js (App Router), React, Tailwind CSS
- **Backend:** Next.js API Routes, Supabase (PostgreSQL, Auth, Realtime, Storage)
- **State Management:** Zustand (for global state like authentication and village data)
- **Database:** Supabase (PostgreSQL)

## 3. Key Features

### 3.1. Authentication & User Management
- **Sign Up/Login:** Email/Password authentication using Supabase Auth.
- **Character Selection:** Users select a character (1-4) which is stored in their profile. This character is used for visual representation in the village map.
- **User Profiles:** Stores `username`, `character_type`, `level`, `total_work_hours`.
- **Middleware:** Handles authentication checks, redirects unauthenticated users, and ensures users have selected a character.

### 3.2. Real-time Status & Village Map
- **User Status:** Users can set their status to 'working', 'home', or 'break'.
- **Real-time Updates:** Supabase Realtime subscriptions are used to update user statuses across clients in real-time.
- **Village Map:** Visual representation of team members on a grid-based map. Characters move based on their status.
  - `working` status: Characters appear in the 'office' area.
  - `home` status: Characters appear in 'house' areas.
  - `break` status: Characters appear in the 'break' area.
- **Character Animation:** Simple frame-based animation for characters.

### 3.3. Work Log Management
- **Work Log Entry:** Users can submit daily work logs.
- **Work Log Template:** A shared, editable template for work log entries, stored in the database and updated in real-time.
- **Team Logs View:** Displays work logs from all team members, with filtering options by user, date range.
- **Calendar View:** Provides a calendar interface to view work logs on specific dates.

### 3.4. Statistics
- **Personal Statistics:**
  - Total work hours, average work hours, work days.
  - Level progression based on total work hours.
  - Daily work hours chart.
  - Day of week average work hours pattern.
- **Team Statistics:**
  - Team total work hours, average hours per member, total members.
  - Comparison of work hours among team members.
  - Team activity timeline (daily total hours and active members).
- **Data Visualization:** Uses Recharts library for various charts.

## 4. Data Flow & State Management
- **Supabase:** Primary data store and real-time engine.
- **Next.js API Routes:** Act as a backend for fetching and updating data, interacting with Supabase.
- **Zustand:** Lightweight state management library for global client-side state (e.g., `auth-store` for user authentication, `village-store` for real-time user statuses and work sessions).
- **Server Components/Client Components:** Next.js App Router structure is utilized, with `use client` for interactive components.

## 5. Database Schema (Supabase)
- **`profiles`:** User profiles linked to `auth.users`.
- **`work_sessions`:** Records of user check-in/check-out times and work durations.
- **`user_status`:** Real-time status of each user (`working`, `home`, `break`).
- **`work_logs`:** Daily work log entries.
- **`work_log_template`:** Shared template for work logs.
- **Row Level Security (RLS):** Implemented for secure data access.
- **Triggers/Functions:** `handle_new_user` for automatic profile and status creation on new user signup; `update_updated_at_column` for timestamp updates.

## 6. Project Structure
- **`app/`:** Next.js App Router structure for pages and API routes.
  - `(auth)/`: Authentication related pages (login, signup, character-select).
  - `(main)/`: Main application pages (village, logs, stats, template).
  - `api/`: Next.js API routes for data operations.
- **`components/`:** Reusable React components.
  - `ui/`: Generic UI components (button, textarea).
  - `village/`: Components for the village map (Character, GridCell, VillageMap).
  - `work-log/`: Components for work log features (CalendarView, TemplateEditor, WorkLogModal).
  - `stats/`: Components for statistics views.
- **`lib/`:** Utility functions and stores.
  - `stores/`: Zustand stores.
  - `supabase/`: Supabase client and server instances.
  - `types.ts`: Custom TypeScript types.
- **`hooks/`:** Custom React hooks (e.g., `useRealtimePresence`).
- **`public/`:** Static assets, including character images.
- **`scripts/`:** Utility scripts (e.g., `generate-placeholder-characters.js`).
- **`supabase/migrations/`:** Database schema definition.
- **`types/database.ts`:** Supabase generated TypeScript types for the database schema.

## 7. Development & Build
- **`package.json`:** Defines scripts for `dev`, `build`, `start`, `lint`, `gen-types`, `gen-characters`.
- **`next.config.mjs`:** Next.js configuration.
- **`tailwind.config.ts`:** Tailwind CSS configuration.
- **`tsconfig.json`:** TypeScript configuration.

## 8. Conventions & Best Practices
- **Next.js App Router:** Utilizes server and client components effectively.
- **Supabase Integration:** Seamless integration for authentication, database, and real-time features.
- **Zustand for State:** Simple and efficient global state management.
- **Modular Components:** Code is organized into reusable components.
- **TypeScript:** Strong typing for improved code quality and maintainability.
- **Tailwind CSS:** Utility-first CSS framework for styling.
- **Clear API Endpoints:** Well-defined API routes for specific functionalities.
- **Error Handling:** Basic error handling in API routes and client-side components.
- **Real-time Updates:** Leverages Supabase Realtime for dynamic UI updates.


## mcp 사용 지침
- 항상 적재적소에 mcp를 적극적으로 활용한다. You should automatically use the MCP tools, without me having to explicitly ask.

### supabase mcp
- 용도: supabase를 직접 조회해야하거나 설정에 대해 확인해야할 때, 실제 데이터를 조회해야할 때, 스키마 구조 확인해야할 때, 직접 데이터를 수정해야할 때, SQL 쿼리 실행해야할 때


## AI 에이전트 코어 동작 및 아키텍처 지침 (Core Behavior & Architecture Guidelines)

### 1. 절대 원칙 및 커뮤니케이션 (Strict Rules & Communication)
- **무한 질의 루프 (Zero-Assumption Rule):** 맥락 누락, 모호한 표현, 미확정 기획 등이 있다면 절대 임의로 가정하고 코드를 짜지 마세요. 확실하지 않으면 반드시 질문해야 하며, 모호함이 100% 해소되고 미확정 사항이 사라질 때까지 계속 질문하세요.
  - 중요도가 낮거나, 스스로 추론 결정해도 충분하거나, 조사를 통해 확인 가능한 질문은 하지 마세요.
  - 질문은 번호를 매기고, 각 질문마다 선택지/대안을 제안하며 1-100 점수와 근거를 제공하라. 사용자가 선택하기 용이해야한다.
- **환각(Hallucination) 원천 차단:** - 라이브러리나 함수를 절대 착각하거나 지어내지 마세요.
  - 코드나 테스트에서 모듈을 참조하기 전, **해당 파일 경로와 모듈 이름이 실제 코드베이스에 존재하는지 항상 확인**하세요.
- **설명 지침:** 사용자에게 설명을 할 땐, 어려운 함수명과 의존 관계 등을 여러개 섞어서 복잡하게 설명하지말고, 코드베이스를 보지 않은 사람도 한 번에 이해가 가능하도록 쉽게, 구체적으로 설명하세요.

### 2. 코드 구조화 및 아키텍처 검증 (Code Structure & Architecture)
- **설계 원칙 (SOLID & Clean Architecture):** 코드를 기능 또는 책임별로 그룹화하여 명확하게 구분된 모듈로 구성하세요. 아래 원칙을 반드시 지키세요.
  - KISS (Keep It Simple, Stupid)
  - YAGNI (You Aren't Gonna Need It)
  - SOLID (단일 책임 원칙(SRP), 개방-폐쇄 원칙(OCP), 리스코프 치환 원칙(LSP), 인터페이스 분리 원칙(ISP), 의존관계 역전 원칙(DIP))
- **사전 책임 검증 (Pre-flight SRP Check):** 코드를 작성하기 전, 추가하려는 로직이 해당 파일의 책임과 기능(SRP)에 정확히 부합하는지 정밀하게 검토하세요. 향후 불필요한 리팩토링이 발생하지 않도록 새 파일을 만들지, 기존 파일을 확장할지 철저히 평가하세요.
- **파일 크기 제한 (Max 800 Lines):** 단일 파일의 길이가 800줄을 넘지 않도록 생성하세요. 제한에 도달하면 즉시 모듈이나 도우미(Helper) 파일로 분할 리팩토링하세요.
- **기술 부채 방어:** 클린 아키텍처를 중시하고, 자신의 행동이 기술 부채를 쌓지 않는지 자주 자체 검토하세요.

### 3. 문제 해결 및 기술 부채 관리 (Problem Solving & Tech Debt)
- **근본적 해결 (No Quick-Fixes):** 빠르고, 간편하고, 단기적인 해결책이 아닌 항상 근본적이고 장기적인 최선의 해결책을 추구하세요.
- **KISS & YAGNI 준수 (Code Bloat 경계):** 항상 간결하고 명확한 코드를 중시하세요. 또한 비현실적인 예외 상황에 대해 대책을 추가하여 코드 비대화를 유발하지 마세요.
- **레거시/호환성 코드 작성 금지:** 배포되지 않은 기능 또는 사용되지 않는 기능에 대해 하위 호환성(Backwards-compatibility)을 위한 임시방편적인 코드 조각을 만들지 마세요. 해당 기능의 배포 여부를 모른다면 사용자에게 질문하세요.
- **안티패턴 차단 및 제안 (Anti-Pattern Immunity):** - 스스로 새로운 안티패턴을 절대 만들지 마세요.
  - 기존 관련된 기술 부채를 절대 무시하고 지나치지 마세요. 기존 코드베이스에서 안티패턴이나 비효율적인 구조를 발견한다면, 절대 따라 하지 말고 즉시 사용자에게 리팩토링을 제안하세요.

### 4. 주석 작성 (Commenting)
- **대상:** 명확하지 않은 코드에 주석을 달고, 모든 내용이 중간 수준(Mid-level) 개발자도 이해할 수 있도록 하세요.
- **주석의 밀도:** 사소한 코드에도 반드시 주석을 자세하게 작성하세요. 작업이 끝났다면 항상 주석을 충분히 달았는지 점검하세요.
- **`# 이유:` 태그 필수 사용:** 복잡한 로직을 작성할 때는 단순히 '무엇(What)'을 하는지가 아니라 **'왜(Why)' 그런지 설계적 맥락을 설명하는 `# 이유:` 주석을 반드시 추가**하세요.

## TDD (Test-Driven Development) & Testing Strategy (가장 중요)

### 1. Agent Workflow: TDD Lifecycle 
- **[전제 확인]** 새로운 기능 추가, 요구사항 변경, 버그 수정 요청을 받으면 **항상 프로덕션 코드보다 테스트 코드를 먼저 작성 및 수정**합니다.
- **Step 1 (Red):** 기획/요구사항을 바탕으로 실패하는 테스트 코드를 먼저 작성하여 기대 동작을 정의합니다.
- **Step 2 (Green):** 해당 테스트를 통과시키는 최소한의 프로덕션 코드를 작성합니다.
- **Step 3 (Refactor):** 테스트 통과 상태를 유지하며 중복 제거 및 아키텍처 개선을 수행합니다. 코드 수정 후에는 반드시 관련 `*_test.dart`를 찾아 실행하고, 관련 범위의 정적 분석도 함께 확인합니다.

### 2. Layer-Specific Strategy & ROI Optimization
- **Unit Test:** 계산 로직, 비즈니스 규칙, 예외 처리가 포함된 부분은 반드시 유닛 테스트로 꼼촘히 검증합니다 (ROI가 가장 높음). Firebase 및 외부 I/O는 무조건 Mocking 하세요.
- **Integration Test:** 주요 컴포넌트 간의 상호작용 지점을 검증합니다.
- **UI/Widget Test:** 앱의 핵심 사용자 흐름(Core User Flow)만 자동화합니다.
  - **[조건 분기]** UI 텍스트(String)는 자주 변경되므로, 텍스트 일치 여부를 검증하는 UI 테스트는 되도록 작성하지 마세요.

### 3. File Structure & Design Smell Detection
- **1:1 Mapping:** 테스트 파일 경로와 이름은 실제 코드와 완벽히 1:1로 일치해야 합니다 (`*_test.dart`).
  - **[예외 처리: 레거시 코드 대응]** 기존 코드베이스에는 경로와 이름이 일치하지 않는 레거시 테스트가 존재할 수 있습니다. 
    - **디렉토리 단위 테스트 실행:** 특정 기능을 수정했다면, 단일 파일 테스트만 수행하지 말고 해당 도메인의 **테스트 디렉토리 전체를 실행**하여 흩어진 레거시 테스트가 깨지지 않았는지 확인하세요.
    - **레거시 리팩토링 제안:** 1:1 매칭 규칙에 어긋나는 이름이나 잘못된 경로에 위치한 레거시 테스트 파일을 발견할 경우, 무시하지 마세요. 즉시 사용자에게 **"현재 [파일명] 테스트가 실제 코드 경로/이름과 일치하지 않습니다. 유지보수성을 위해 [올바른 경로]로 이동 및 변경하는 리팩토링을 진행할까요?"**라고 먼저 제안하세요.
- **Refactoring Trigger:** 특정 테스트 파일이 너무 길어지거나 Setup이 과도하게 복잡해진다면, 테스트를 억지로 끼워 맞추지 말고 즉시 **실제 프로덕션 코드의 책임 분리(SRP 준수)를 사용자에게 제안**하세요.

### 4. Strict Constraints (절대 금지 사항)
- **테스트 조작 금지:** 테스트 실패 원인이 프로덕션 코드의 버그일 때, 테스트 코드의 단언문(Assertion)이나 로직을 수정하여 억지로 통과시키는 '주먹구구식 덮어쓰기'를 절대 금지합니다. 버그는 반드시 실제 코드의 수정으로 해결해야 합니다.