-- 이유:
-- 팀 멀티테넌시 마이그레이션 이후 advisors가 감지한 FK 인덱스와
-- 기존 timestamp 트리거 함수의 mutable search_path 경고를 정리합니다.

CREATE INDEX IF NOT EXISTS profiles_active_team_id_idx
  ON public.profiles (active_team_id);

CREATE INDEX IF NOT EXISTS teams_created_by_idx
  ON public.teams (created_by);

CREATE INDEX IF NOT EXISTS team_invites_invited_by_idx
  ON public.team_invites (invited_by);

CREATE INDEX IF NOT EXISTS user_status_user_id_idx
  ON public.user_status (user_id);

CREATE INDEX IF NOT EXISTS work_log_template_updated_by_idx
  ON public.work_log_template (updated_by);

CREATE INDEX IF NOT EXISTS work_logs_user_id_idx
  ON public.work_logs (user_id);

CREATE INDEX IF NOT EXISTS work_sessions_user_id_idx
  ON public.work_sessions (user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = '';

CREATE OR REPLACE FUNCTION public.update_last_updated_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = '';
