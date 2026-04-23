-- 이유:
-- 초대받은 사용자는 아직 team_members에 없어서 기본 teams SELECT 정책으로는 팀 이름을 읽을 수 없습니다.
-- 받은 초대 목록에서 팀 이름을 보여주기 위해, "현재 로그인한 이메일로 온 pending invite가 있는 팀"에 한해서만
-- 팀 요약을 조회할 수 있도록 최소 범위의 SELECT 정책을 추가합니다.

CREATE POLICY "Invitees can view invited teams" ON public.teams
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.team_invites invite
      WHERE invite.team_id = teams.id
        AND invite.status = 'pending'
        AND lower(btrim(invite.email)) = (SELECT private.current_user_email())
    )
  );
