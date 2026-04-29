export type CharacterType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
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
      teams: {
        Row: Team
        Insert: Partial<Team>
        Update: Partial<Team>
      }
      team_members: {
        Row: TeamMember
        Insert: Partial<TeamMember>
        Update: Partial<TeamMember>
      }
      team_invites: {
        Row: TeamInvite
        Insert: Partial<TeamInvite>
        Update: Partial<TeamInvite>
      }
      team_slack_notification_settings: {
        Row: TeamSlackNotificationSetting
        Insert: Partial<TeamSlackNotificationSetting>
        Update: Partial<TeamSlackNotificationSetting>
      }
      work_sessions: {
        Row: WorkSession
        Insert: Partial<WorkSession>
        Update: Partial<WorkSession>
      }
      work_session_reminders: {
        Row: WorkSessionReminder
        Insert: Partial<WorkSessionReminder>
        Update: Partial<WorkSessionReminder>
      }
      work_session_edits: {
        Row: WorkSessionEdit
        Insert: Partial<WorkSessionEdit>
        Update: Partial<WorkSessionEdit>
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
  active_team_id: string | null;
  created_at: string;
}

export interface Team {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
}

export type TeamRole = 'owner' | 'member';
export type TeamMembershipStatus = 'active' | 'removed';

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: TeamRole;
  status: TeamMembershipStatus;
  can_manage_own_records: boolean;
  joined_at: string;
  created_at: string;
}

export type TeamInviteStatus = 'pending' | 'accepted' | 'cancelled';

export interface TeamInvite {
  id: string;
  team_id: string;
  email: string;
  invited_by: string;
  status: TeamInviteStatus;
  created_at: string;
  accepted_at: string | null;
}

export interface TeamSlackNotificationSetting {
  id: string;
  team_id: string;
  webhook_url: string;
  is_enabled: boolean;
  notify_status_changes: boolean;
  notify_work_summaries: boolean;
  notify_checkout_reminders: boolean;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

export interface WorkSession {
  id: string;
  team_id: string;
  user_id: string;
  check_in_time: string;
  check_out_time: string | null;
  duration_minutes: number | null;
  break_minutes: number;
  last_break_start: string | null;
  date: string;
  created_at: string;
}

export type WorkSessionReminderType = 'checkout_12h';

export interface WorkSessionReminder {
  id: string;
  team_id: string;
  work_session_id: string;
  user_id: string;
  reminder_type: WorkSessionReminderType;
  sent_at: string;
  created_at: string;
}

export interface WorkSessionEdit {
  id: string;
  team_id: string;
  work_session_id: string;
  user_id: string;
  edited_by: string;
  previous_check_in_time: string;
  previous_check_out_time: string | null;
  previous_duration_minutes: number | null;
  next_check_in_time: string;
  next_check_out_time: string;
  next_duration_minutes: number;
  previous_break_minutes: number;
  reason: string | null;
  created_at: string;
}

export interface UserStatusRecord {
  id: string;
  team_id: string;
  user_id: string;
  status: UserStatus;
  last_updated: string;
  last_activity_at: string | null;
}

export interface WorkLog {
  id: string;
  team_id: string;
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
  team_id: string;
  content: string;
  updated_at: string;
  updated_by: string | null;
}
