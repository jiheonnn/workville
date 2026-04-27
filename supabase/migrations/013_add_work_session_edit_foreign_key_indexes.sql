-- 이유:
-- 감사 테이블은 work_sessions/profiles를 외래키로 참조합니다.
-- 삭제/조인 시 FK 검증이 느려지지 않도록 각 FK 선두 컬럼 인덱스를 보강합니다.
CREATE INDEX IF NOT EXISTS work_session_edits_work_session_id_idx
  ON public.work_session_edits (work_session_id);

CREATE INDEX IF NOT EXISTS work_session_edits_edited_by_idx
  ON public.work_session_edits (edited_by);
