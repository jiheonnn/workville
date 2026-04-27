-- 이유:
-- 팀장이 특정 팀원에게 "자기 기록을 정정할 수 있는 권한"을 줄 수 있도록
-- 역할(role)과 별개의 세부 권한을 멤버십에 저장합니다.
ALTER TABLE public.team_members
  ADD COLUMN IF NOT EXISTS can_manage_own_records BOOLEAN NOT NULL DEFAULT FALSE;

CREATE OR REPLACE FUNCTION private.prevent_team_member_privilege_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 이유:
  -- 기존 정책은 팀원이 자기 멤버십 row를 수정할 수 있게 허용합니다.
  -- 새 권한 컬럼을 그대로 두면 일반 팀원이 직접 API를 우회해 자기 권한을 켤 수 있으므로,
  -- 팀장이 아닌 사용자의 권한/역할 변경은 DB 레벨에서 차단합니다.
  IF NOT (SELECT private.is_team_owner(OLD.team_id)) THEN
    IF NEW.role IS DISTINCT FROM OLD.role
      OR NEW.can_manage_own_records IS DISTINCT FROM OLD.can_manage_own_records THEN
      RAISE EXCEPTION 'team member privilege escalation is not allowed'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_team_member_privilege_escalation_before_update ON public.team_members;

CREATE TRIGGER prevent_team_member_privilege_escalation_before_update
  BEFORE UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION private.prevent_team_member_privilege_escalation();

CREATE TABLE IF NOT EXISTS public.work_session_edits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  work_session_id UUID NOT NULL REFERENCES public.work_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  edited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  previous_check_in_time TIMESTAMP WITH TIME ZONE NOT NULL,
  previous_check_out_time TIMESTAMP WITH TIME ZONE,
  previous_duration_minutes INTEGER,
  next_check_in_time TIMESTAMP WITH TIME ZONE NOT NULL,
  next_check_out_time TIMESTAMP WITH TIME ZONE NOT NULL,
  next_duration_minutes INTEGER NOT NULL,
  previous_break_minutes INTEGER NOT NULL DEFAULT 0,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

ALTER TABLE public.work_session_edits ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS work_session_edits_team_session_idx
  ON public.work_session_edits (team_id, work_session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS work_session_edits_user_created_idx
  ON public.work_session_edits (user_id, created_at DESC);

DROP POLICY IF EXISTS "Active members can view work session edits" ON public.work_session_edits;
DROP POLICY IF EXISTS "Users can create own work session edits" ON public.work_session_edits;

CREATE POLICY "Active members can view work session edits" ON public.work_session_edits
  FOR SELECT TO authenticated
  USING ((SELECT private.is_active_team_member(team_id)));

CREATE POLICY "Users can create own work session edits" ON public.work_session_edits
  FOR INSERT TO authenticated
  WITH CHECK (
    edited_by = (SELECT auth.uid())
    AND user_id = (SELECT auth.uid())
    AND (SELECT private.is_active_team_member(team_id))
    AND EXISTS (
      SELECT 1
      FROM public.team_members membership
      WHERE membership.team_id = work_session_edits.team_id
        AND membership.user_id = (SELECT auth.uid())
        AND membership.status = 'active'
        AND (
          membership.role = 'owner'
          OR membership.can_manage_own_records = TRUE
        )
    )
  );
