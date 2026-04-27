-- 이유:
-- 12시간 퇴근 리마인드는 팀별 Slack 설정의 일부입니다.
-- 팀장이 기존 Slack 알림과 별도로 켜고 끌 수 있도록 독립 토글을 둡니다.
ALTER TABLE public.team_slack_notification_settings
  ADD COLUMN IF NOT EXISTS notify_checkout_reminders BOOLEAN NOT NULL DEFAULT TRUE;

-- 이유:
-- Vercel Cron은 주기적으로 같은 열린 세션을 다시 볼 수 있습니다.
-- 세션별 리마인드 발송 기록을 저장해 같은 근무 세션에 중복 알림이 가지 않게 합니다.
CREATE TABLE IF NOT EXISTS public.work_session_reminders (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  work_session_id UUID NOT NULL REFERENCES public.work_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('checkout_12h')),
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc'::text, NOW()),
  CONSTRAINT work_session_reminders_session_type_key UNIQUE (work_session_id, reminder_type)
);

ALTER TABLE public.work_session_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No client access to work session reminders"
  ON public.work_session_reminders
  FOR ALL
  TO anon, authenticated
  USING (FALSE)
  WITH CHECK (FALSE);

CREATE INDEX IF NOT EXISTS work_session_reminders_team_sent_idx
  ON public.work_session_reminders (team_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS work_session_reminders_user_sent_idx
  ON public.work_session_reminders (user_id, sent_at DESC);
