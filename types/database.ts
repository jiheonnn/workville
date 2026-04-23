export type CharacterType = 1 | 2 | 3 | 4;
export type UserStatus = 'working' | 'home' | 'break';

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  order?: number;
}

// 앱에서 직접 사용하는 주요 도메인 타입들입니다.
// Supabase 스키마 변경 시 이 파일과 실제 DB 스키마를 함께 맞춰야 합니다.
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Partial<Profile>
        Update: Partial<Profile>
      }
      work_sessions: {
        Row: WorkSession
        Insert: Partial<WorkSession>
        Update: Partial<WorkSession>
      }
      user_status: {
        Row: UserStatusRecord
        Insert: Partial<UserStatusRecord>
        Update: Partial<UserStatusRecord>
      }
      work_logs: {
        Row: WorkLog
        Insert: Partial<WorkLog>
        Update: Partial<WorkLog>
      }
      work_log_template: {
        Row: WorkLogTemplate
        Insert: Partial<WorkLogTemplate>
        Update: Partial<WorkLogTemplate>
      }
    }
  }
}

export interface Profile {
  id: string;
  email: string;
  username: string;
  character_type: CharacterType | null;
  level: number;
  total_work_hours: number;
  created_at: string;
}

export interface WorkSession {
  id: string;
  user_id: string;
  check_in_time: string;
  check_out_time: string | null;
  duration_minutes: number | null;
  break_minutes: number;
  last_break_start: string | null;
  date: string;
  created_at: string;
}

export interface UserStatusRecord {
  id: string;
  user_id: string;
  status: UserStatus;
  last_updated: string;
}

export interface WorkLog {
  id: string;
  user_id: string;
  date: string;
  content: string;
  version: number;
  created_at: string;
  updated_at: string;
  todos: TodoItem[];
  completed_todos: TodoItem[];
  roi_high: string;
  roi_low: string;
  tomorrow_priority: string;
  feedback: string;
}

export interface WorkLogTemplate {
  id: string;
  content: string;
  updated_at: string;
  updated_by: string | null;
}
