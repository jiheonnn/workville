# Workville Codebase Overview (gemini.md)

## 1. Project Introduction
- **Name:** Workville
- **Description:** 팀원들의 근무 상태를 시각화하고 업무 일지를 관리하며, 개인 및 팀 통계를 제공하는 웹 애플리케이션.
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

### context7 mcp
- 용도: library/API documentation/공식 문서 등 최신 패턴, 대체 메서드, 빠른 예제, best practice 등을 조회해야할 때. 
- Always use context7 when you need code generation, setup or configuration steps, or library/API documentation. 
- 이미 알고있는 간단한 문법 설명 같은 건 찾아보지 않아도 됨. 

## 🧠 AI 동작 규칙
- **맥락이 누락되었다고 가정하지 마세요. 확실하지 않으면 질문하세요.**
- **라이브러리나 함수를 착각하지 마세요.**
- **파일 경로와 모듈 이름이 있는지 항상 확인하세요.**
  - 코드나 테스트에서 참조하기 전에 해당 파일 경로와 모듈 이름이 있는지 확인하세요.
- **명확하지 않은 코드에 주석을 달고** 모든 내용이 중간 수준 개발자도 이해할 수 있도록 하세요.
  - 사소한 코드에도 반드시 주석을 자세하게 작성하세요
  - 복잡한 로직을 작성할 때는 **`# 이유:` 주석을 추가하여 **무엇을** 하는 것이 아니라 왜 그런지 설명하세요.

## 추가 지침
- 항상 한국어로 존댓말로 응답해라
- 사용자의 말에 모호한 부분이 있거나 미확정사항이 있다면 **반드시 나에게 질문을 해야한다.** 모호함이 완전히 해소되고 미확정 사항이 사라질 때 까지 계속 질문한다.
- KISS (Keep It Simple, Stupid), YAGNI (You Aren't Gonna Need It), SOLID(단일 책임 원칙 (SRP), 개방-폐쇄 원칙 (OCP), 리스코프 치환 원칙 (LSP),인터페이스 분리 원칙 (ISP), 의존관계 역전 원칙 (DIP)) 원칙을 지키세요.

## 🧱 코드 구조 및 모듈성
- **코드 길이가 800줄을 넘지 않도록 파일을 생성하세요.** 
  - 파일이 이 제한에 도달하면 모듈이나 도우미 파일로 분할하여 리팩토링하세요. 
- **코드를 작성하기 전, SRP 원칙에 따라 코드가 그 파일에 책임과 기능에 적합한지 검토하세요.
  - 새 파일을 만들어야하는지, 기존 파일을 확장해야하는지 철저히 검토하세요. 향후 불필요한 리팩토링이 생겨서는 안됩니다.**
  - 반드시 SRP를 준수하세요.
- **코드를 기능 또는 책임별로 그룹화하여 명확하게 구분된 모듈로 구성하세요.**
- 클린 아키텍처를 중시하세요. 기술 부채를 쌓지 않도록 유의하세요. 자신의 행동이 기술부채를 쌓지 않는지 자주 검토하세요.


## 테스트 주도 개발 
- 항상 테스트 주도 개발(TDD)을 사용합니다.
- 계산, 로직, 규칙이 들어있는 부분은 반드시 유닛 테스트로 꼼꼼히 짭니다. (ROI가 가장 높음)
- 주요 기능들이 서로 상호작용하는 부분을 통합 테스트로 검증합니다.
- 가장 핵심적인 사용자 흐름 몇 가지만 UI 테스트로 자동화합니다.
- 새로운 기능 추가/ 기능변경/ 요구사항 변경/ 버그 수정이 있을 때 반드시 테스트를 추가/수정합니다.
- **절대 테스트 코드를 고쳐서 문제를 덮는 주먹구구식 해결을 하지마세요. 테스트 실패 원인이 코드 버그인데, 테스트를 수정해서 통과시키면 안됩니다.**
- Red: 실패하는 테스트 작성 (기대 동작 정의), Green: 테스트 통과시키는 최소한의 코드 작성, Refactor: 중복 제거, 구조 개선 순으로 진행합니다.
