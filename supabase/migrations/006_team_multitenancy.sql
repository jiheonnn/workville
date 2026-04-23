-- 이유:
-- Workville를 전역 사용자 풀 구조에서 팀 멀티테넌시 구조로 전환합니다.
-- 핵심 동작(상태, 근무 세션, 업무일지, 템플릿, 통계)은 모두 활성 팀 기준으로 동작해야 하므로
-- team_id를 명시적으로 저장하고, RLS도 팀 멤버십 기반으로 다시 설계합니다.

CREATE SCHEMA IF NOT EXISTS private;

CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'member')) DEFAULT 'member',
  status TEXT NOT NULL CHECK (status IN ('active', 'removed')) DEFAULT 'active',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

CREATE TABLE IF NOT EXISTS public.team_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'cancelled')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  accepted_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS active_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;

-- 이유:
-- 기존 데이터는 버려도 되는 상태이므로, 전역 구조에서 남아 있는 row를 정리한 뒤
-- 팀 스코프 컬럼을 non-null 제약으로 깔끔하게 전환합니다.
DELETE FROM public.work_log_template;
DELETE FROM public.work_logs;
DELETE FROM public.work_sessions;
DELETE FROM public.user_status;

ALTER TABLE public.work_sessions
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE;

ALTER TABLE public.user_status
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE;

ALTER TABLE public.work_logs
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE;

ALTER TABLE public.work_log_template
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE;

ALTER TABLE public.work_sessions
  ALTER COLUMN team_id SET NOT NULL;

ALTER TABLE public.user_status
  ALTER COLUMN team_id SET NOT NULL;

ALTER TABLE public.work_logs
  ALTER COLUMN team_id SET NOT NULL;

ALTER TABLE public.work_log_template
  ALTER COLUMN team_id SET NOT NULL;

ALTER TABLE public.user_status
  DROP CONSTRAINT IF EXISTS user_status_user_id_key;

DROP INDEX IF EXISTS public.work_logs_user_id_date_key;

CREATE UNIQUE INDEX IF NOT EXISTS team_members_team_id_user_id_key
  ON public.team_members (team_id, user_id);

CREATE UNIQUE INDEX IF NOT EXISTS team_members_active_owner_key
  ON public.team_members (team_id)
  WHERE role = 'owner' AND status = 'active';

CREATE UNIQUE INDEX IF NOT EXISTS team_invites_pending_team_email_key
  ON public.team_invites (team_id, lower(btrim(email)))
  WHERE status = 'pending';

CREATE UNIQUE INDEX IF NOT EXISTS user_status_team_id_user_id_key
  ON public.user_status (team_id, user_id);

CREATE UNIQUE INDEX IF NOT EXISTS work_logs_team_id_user_id_date_key
  ON public.work_logs (team_id, user_id, date);

CREATE UNIQUE INDEX IF NOT EXISTS work_log_template_team_id_key
  ON public.work_log_template (team_id);

CREATE INDEX IF NOT EXISTS team_members_user_id_status_idx
  ON public.team_members (user_id, status, team_id);

CREATE INDEX IF NOT EXISTS team_members_team_id_status_idx
  ON public.team_members (team_id, status, user_id);

CREATE INDEX IF NOT EXISTS team_invites_email_status_idx
  ON public.team_invites (lower(btrim(email)), status);

CREATE INDEX IF NOT EXISTS work_sessions_team_id_user_id_date_idx
  ON public.work_sessions (team_id, user_id, date);

CREATE INDEX IF NOT EXISTS work_logs_team_id_user_id_date_idx
  ON public.work_logs (team_id, user_id, date);

CREATE INDEX IF NOT EXISTS user_status_team_id_idx
  ON public.user_status (team_id);

CREATE OR REPLACE FUNCTION private.is_active_team_member(target_team_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members membership
    WHERE membership.team_id = target_team_id
      AND membership.user_id = (SELECT auth.uid())
      AND membership.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION private.is_team_owner(target_team_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.team_members membership
    WHERE membership.team_id = target_team_id
      AND membership.user_id = (SELECT auth.uid())
      AND membership.role = 'owner'
      AND membership.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION private.current_user_email()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lower(btrim(profile.email))
  FROM public.profiles profile
  WHERE profile.id = (SELECT auth.uid());
$$;

CREATE OR REPLACE FUNCTION private.enforce_team_member_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  active_member_count INTEGER;
BEGIN
  IF NEW.status <> 'active' THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*)
  INTO active_member_count
  FROM public.team_members membership
  WHERE membership.team_id = NEW.team_id
    AND membership.status = 'active'
    AND membership.id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

  IF active_member_count >= 4 THEN
    RAISE EXCEPTION 'team member limit exceeded'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_team_member_limit_before_write ON public.team_members;

CREATE TRIGGER enforce_team_member_limit_before_write
  BEFORE INSERT OR UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION private.enforce_team_member_limit();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, active_team_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'username', ''), NEW.email),
    NULL
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_log_template ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Work sessions are viewable by everyone" ON public.work_sessions;
DROP POLICY IF EXISTS "Users can insert own work sessions" ON public.work_sessions;
DROP POLICY IF EXISTS "Users can update own work sessions" ON public.work_sessions;
DROP POLICY IF EXISTS "User status is viewable by everyone" ON public.user_status;
DROP POLICY IF EXISTS "Users can insert own status" ON public.user_status;
DROP POLICY IF EXISTS "Users can update own status" ON public.user_status;
DROP POLICY IF EXISTS "Work logs are viewable by everyone" ON public.work_logs;
DROP POLICY IF EXISTS "Users can create own work logs" ON public.work_logs;
DROP POLICY IF EXISTS "Users can update own work logs" ON public.work_logs;
DROP POLICY IF EXISTS "Template is viewable by everyone" ON public.work_log_template;
DROP POLICY IF EXISTS "Anyone can update template" ON public.work_log_template;

CREATE POLICY "Profiles are viewable by same team members" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    (SELECT auth.uid()) = id
    OR EXISTS (
      SELECT 1
      FROM public.team_members viewer
      JOIN public.team_members teammate
        ON viewer.team_id = teammate.team_id
      WHERE viewer.user_id = (SELECT auth.uid())
        AND viewer.status = 'active'
        AND teammate.user_id = profiles.id
        AND teammate.status = 'active'
    )
  );

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "Active members can view teams" ON public.teams
  FOR SELECT TO authenticated
  USING ((SELECT private.is_active_team_member(id)));

CREATE POLICY "Users can create own teams" ON public.teams
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = created_by);

CREATE POLICY "Owners can update teams" ON public.teams
  FOR UPDATE TO authenticated
  USING ((SELECT private.is_team_owner(id)))
  WITH CHECK ((SELECT private.is_team_owner(id)));

CREATE POLICY "Active members can view memberships" ON public.team_members
  FOR SELECT TO authenticated
  USING ((SELECT private.is_active_team_member(team_id)));

CREATE POLICY "Owners or invited users can insert memberships" ON public.team_members
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT private.is_team_owner(team_id))
    OR (
      (SELECT auth.uid()) = user_id
      AND EXISTS (
        SELECT 1
        FROM public.teams team
        WHERE team.id = team_members.team_id
          AND team.created_by = (SELECT auth.uid())
      )
    )
    OR (
      (SELECT auth.uid()) = user_id
      AND EXISTS (
        SELECT 1
        FROM public.team_invites invite
        WHERE invite.team_id = team_members.team_id
          AND invite.status = 'pending'
          AND lower(btrim(invite.email)) = (SELECT private.current_user_email())
      )
    )
  );

CREATE POLICY "Owners or self can update memberships" ON public.team_members
  FOR UPDATE TO authenticated
  USING (
    (SELECT private.is_team_owner(team_id))
    OR (SELECT auth.uid()) = user_id
  )
  WITH CHECK (
    (SELECT private.is_team_owner(team_id))
    OR (SELECT auth.uid()) = user_id
  );

CREATE POLICY "Owners or same email invitee can view invites" ON public.team_invites
  FOR SELECT TO authenticated
  USING (
    (SELECT private.is_team_owner(team_id))
    OR lower(btrim(email)) = (SELECT private.current_user_email())
  );

CREATE POLICY "Owners can create invites" ON public.team_invites
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT private.is_team_owner(team_id))
    AND invited_by = (SELECT auth.uid())
  );

CREATE POLICY "Owners or invitees can update invites" ON public.team_invites
  FOR UPDATE TO authenticated
  USING (
    (SELECT private.is_team_owner(team_id))
    OR lower(btrim(email)) = (SELECT private.current_user_email())
  )
  WITH CHECK (
    (SELECT private.is_team_owner(team_id))
    OR lower(btrim(email)) = (SELECT private.current_user_email())
  );

CREATE POLICY "Active members can view work sessions" ON public.work_sessions
  FOR SELECT TO authenticated
  USING ((SELECT private.is_active_team_member(team_id)));

CREATE POLICY "Users can insert own team-scoped work sessions" ON public.work_sessions
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND (SELECT private.is_active_team_member(team_id))
  );

CREATE POLICY "Users can update own team-scoped work sessions" ON public.work_sessions
  FOR UPDATE TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    AND (SELECT private.is_active_team_member(team_id))
  )
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND (SELECT private.is_active_team_member(team_id))
  );

CREATE POLICY "Active members can view user status" ON public.user_status
  FOR SELECT TO authenticated
  USING ((SELECT private.is_active_team_member(team_id)));

CREATE POLICY "Users can insert own team-scoped status" ON public.user_status
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND (SELECT private.is_active_team_member(team_id))
  );

CREATE POLICY "Users can update own team-scoped status" ON public.user_status
  FOR UPDATE TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    AND (SELECT private.is_active_team_member(team_id))
  )
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND (SELECT private.is_active_team_member(team_id))
  );

CREATE POLICY "Active members can view work logs" ON public.work_logs
  FOR SELECT TO authenticated
  USING ((SELECT private.is_active_team_member(team_id)));

CREATE POLICY "Users can create own team-scoped work logs" ON public.work_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND (SELECT private.is_active_team_member(team_id))
  );

CREATE POLICY "Users can update own team-scoped work logs" ON public.work_logs
  FOR UPDATE TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    AND (SELECT private.is_active_team_member(team_id))
  )
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND (SELECT private.is_active_team_member(team_id))
  );

CREATE POLICY "Active members can view team template" ON public.work_log_template
  FOR SELECT TO authenticated
  USING ((SELECT private.is_active_team_member(team_id)));

CREATE POLICY "Active members can create team template" ON public.work_log_template
  FOR INSERT TO authenticated
  WITH CHECK (
    updated_by = (SELECT auth.uid())
    AND (SELECT private.is_active_team_member(team_id))
  );

CREATE POLICY "Active members can update team template" ON public.work_log_template
  FOR UPDATE TO authenticated
  USING ((SELECT private.is_active_team_member(team_id)))
  WITH CHECK ((SELECT private.is_active_team_member(team_id)));
