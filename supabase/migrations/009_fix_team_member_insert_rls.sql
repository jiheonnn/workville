CREATE OR REPLACE FUNCTION private.is_team_creator(target_team_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.teams team
    WHERE team.id = target_team_id
      AND team.created_by = (SELECT auth.uid())
  );
$$;

DROP POLICY IF EXISTS "Owners or invited users can insert memberships" ON public.team_members;

CREATE POLICY "Owners or invited users can insert memberships" ON public.team_members
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT private.is_team_owner(team_id))
    OR (
      (SELECT auth.uid()) = user_id
      AND (SELECT private.is_team_creator(team_id))
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
