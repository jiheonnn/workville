-- 이유:
-- 업무일지 작성 화면은 "하루 업무일지 1개"를 편집하는 UX입니다.
-- 같은 (user_id, date)에 여러 row가 생기거나, 이전 상태와 병합 저장되면
-- 완료/삭제/되돌리기 같은 편집 동작을 정확히 표현할 수 없습니다.

ALTER TABLE public.work_logs
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

UPDATE public.work_logs
SET version = 1
WHERE version IS NULL;

WITH ranked_work_logs AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, date
      ORDER BY updated_at DESC, created_at DESC, id DESC
    ) AS row_rank
  FROM public.work_logs
)
DELETE FROM public.work_logs work_logs_to_delete
USING ranked_work_logs
WHERE work_logs_to_delete.id = ranked_work_logs.id
  AND ranked_work_logs.row_rank > 1;

CREATE UNIQUE INDEX IF NOT EXISTS work_logs_user_id_date_key
  ON public.work_logs (user_id, date);
