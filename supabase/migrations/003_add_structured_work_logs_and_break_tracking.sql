-- # 이유:
-- 현재 앱은 구조화된 업무일지 필드(todos, feedback 등)와
-- 근무 세션 휴식 추적 필드(break_minutes, last_break_start)를 전제로 동작합니다.
-- 초기 스키마에는 이 컬럼들이 없어 업무일지/상태 API가 연쇄적으로 실패하므로,
-- 실제 런타임 계약에 맞춰 스키마를 확장합니다.

ALTER TABLE public.work_logs
  ADD COLUMN IF NOT EXISTS todos JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS completed_todos JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS roi_high TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS roi_low TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS tomorrow_priority TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS feedback TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc'::text, NOW());

ALTER TABLE public.work_sessions
  ADD COLUMN IF NOT EXISTS break_minutes INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_break_start TIMESTAMP WITH TIME ZONE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'work_logs'
      AND policyname = 'Users can update own work logs'
  ) THEN
    CREATE POLICY "Users can update own work logs" ON public.work_logs
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS update_work_logs_updated_at ON public.work_logs;

CREATE TRIGGER update_work_logs_updated_at
  BEFORE UPDATE ON public.work_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
