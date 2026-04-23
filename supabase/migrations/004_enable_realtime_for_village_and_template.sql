DO $$
BEGIN
  -- 이유:
  -- 현재 앱은 postgres_changes로 user_status와 work_log_template을 구독합니다.
  -- publication에 테이블이 빠져 있으면 DB 값은 바뀌어도 클라이언트가 이벤트를 받지 못합니다.
  IF EXISTS (
    SELECT 1
    FROM pg_publication
    WHERE pubname = 'supabase_realtime'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'user_status'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_status;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_publication
    WHERE pubname = 'supabase_realtime'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'work_log_template'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.work_log_template;
  END IF;
END
$$;
