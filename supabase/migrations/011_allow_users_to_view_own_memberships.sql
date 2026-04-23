-- 이유:
-- 초대 수락 시 기존 removed 멤버십을 재활성화하려면, 현재 사용자가 자기 자신의
-- 비활성 멤버십 row도 조회할 수 있어야 합니다.
-- 기존 정책은 "활성 팀 멤버만 membership SELECT 가능"이라 removed row가 보이지 않아
-- insert 경로로 떨어지고, (team_id, user_id) 유니크 제약 충돌이 발생했습니다.

CREATE POLICY "Users can view own memberships" ON public.team_members
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
