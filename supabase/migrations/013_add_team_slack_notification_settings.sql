-- 이유:
-- Slack Webhook URL은 팀별 외부 채널로 메시지를 보낼 수 있는 비밀값입니다.
-- 일반 클라이언트가 직접 읽지 못하도록 별도 테이블에 저장하고, 서버의 service role 경로에서만 조회합니다.

CREATE TABLE IF NOT EXISTS public.team_slack_notification_settings (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  webhook_url TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  notify_status_changes BOOLEAN NOT NULL DEFAULT TRUE,
  notify_work_summaries BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  updated_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  CONSTRAINT team_slack_notification_settings_team_id_key UNIQUE (team_id),
  CONSTRAINT team_slack_notification_settings_webhook_url_check
    CHECK (webhook_url ~ '^https://hooks\.slack\.com/services/.+')
);

ALTER TABLE public.team_slack_notification_settings ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS team_slack_notification_settings_team_id_idx
  ON public.team_slack_notification_settings (team_id);
