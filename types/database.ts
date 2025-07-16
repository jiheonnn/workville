export type CharacterType = 1 | 2 | 3 | 4;
export type UserStatus = 'working' | 'home' | 'break';

// Database type placeholder - replace with generated types from Supabase
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
  created_at: string;
}

export interface WorkLogTemplate {
  id: string;
  content: string;
  updated_at: string;
  updated_by: string | null;
}