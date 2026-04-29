-- 이유:
-- 자동 휴식/퇴근은 "상태 변경 시각"이 아니라 사용자의 마지막 실제 활동 시각을 기준으로 판단해야 합니다.
-- 기존 row는 last_updated를 초기 활동 시각으로 복사해 배포 직후 열린 세션도 보수적으로 처리합니다.
ALTER TABLE public.user_status
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE;

UPDATE public.user_status
SET last_activity_at = COALESCE(last_activity_at, last_updated, TIMEZONE('utc'::text, NOW()))
WHERE last_activity_at IS NULL;

CREATE INDEX IF NOT EXISTS user_status_last_activity_at_idx
  ON public.user_status (last_activity_at);
