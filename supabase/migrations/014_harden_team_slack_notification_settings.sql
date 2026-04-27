-- 이유:
-- Slack Webhook URL 테이블은 service role 서버 경로만 접근해야 합니다.
-- RLS의 기본 차단에만 기대지 않고 명시적인 클라이언트 거부 정책을 추가해 보안 의도를 드러냅니다.

CREATE POLICY "No client access to team slack notification settings"
  ON public.team_slack_notification_settings
  FOR ALL
  TO anon, authenticated
  USING (FALSE)
  WITH CHECK (FALSE);

-- 이유:
-- created_by/updated_by는 profiles FK라 프로필 삭제/검증 시 참조 확인 비용이 생길 수 있습니다.
-- team_id는 unique constraint가 이미 인덱스를 만들기 때문에 별도 중복 인덱스는 제거합니다.
DROP INDEX IF EXISTS public.team_slack_notification_settings_team_id_idx;

CREATE INDEX IF NOT EXISTS team_slack_notification_settings_created_by_idx
  ON public.team_slack_notification_settings (created_by);

CREATE INDEX IF NOT EXISTS team_slack_notification_settings_updated_by_idx
  ON public.team_slack_notification_settings (updated_by);
