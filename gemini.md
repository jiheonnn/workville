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