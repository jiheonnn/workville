# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Workville is a team visualization tool that displays team members' work status as a virtual village with animated pixel-art characters. Team members can check in/out, take breaks, write work logs, and track their work hours with a leveling system.

## Development Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Architecture & Key Patterns

### Tech Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Database**: Supabase (PostgreSQL + Realtime + Auth)
- **State**: Zustand for client state
- **Styling**: Tailwind CSS 4

### Database Schema
- `profiles`: User profiles with character selection and level tracking
- `work_sessions`: Check-in/out times and duration tracking
- `user_status`: Real-time status (working/home/break)
- `work_logs`: Daily work logs with markdown content
- `work_log_template`: Shared template for all users

### Authentication Flow
1. Supabase Auth handles email/password authentication
2. Middleware (`middleware.ts`) protects routes and enforces character selection
3. New users must select a character before accessing the main app
4. Profile and status records are auto-created via database triggers

### Key Architectural Decisions
- **Server/Client Split**: Use server components by default, "use client" only for interactivity
- **Real-time Updates**: Supabase Realtime subscriptions for live status updates
- **Character System**: 4 character types, 3 states (working/home/break), 2 animation frames each
- **Grid Layout**: 9x7 CSS grid for village positioning (4 houses top, office center, break area bottom)

## Current Development Status

✅ **Completed**:
- Basic project setup with all dependencies
- Database schema with RLS policies
- Authentication system with protected routes
- Character selection flow

🚧 **Next Phase (Phase 3)**:
- Create village UI components (`components/village/`)
- Implement character animation system (PNG sprite cycling)
- Set up CSS grid layout for village

## Important Implementation Notes

### Supabase MCP Integration
When working with the database, use the Supabase MCP tool for direct database operations:
- `mcp__supabase__execute_sql` for queries
- `mcp__supabase__apply_migration` for schema changes

### Character Animation System
- Each character needs 6 PNG files: `{status}_{frame}.png`
- Animation cycles between 2 frames every 0.5 seconds
- Position transitions use CSS transitions for smooth movement

### State Management
- Use Zustand stores in `lib/stores/`
- Auth state is managed in `auth-store.ts`
- Village state will be in `village-store.ts` (to be created)

### Work Session Logic
- Check-in creates new `work_sessions` record
- Check-out updates record with duration and triggers work log modal
- Level calculation: `Math.floor(total_work_hours / 8) + 1`

## Environment Setup

Required environment variables in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://ostawzicicutfljphyvg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zdGF3emljaWN1dGZsanBoeXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE5NjU5MzgsImV4cCI6MjA2NzU0MTkzOH0.lOqxVfFKhHAdPtoCcw2ZZXwgVHQm6i74hkuATx9gEEU
``` 