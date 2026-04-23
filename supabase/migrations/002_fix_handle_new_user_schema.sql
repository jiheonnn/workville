-- # 이유:
-- auth.users 트리거는 public 스키마가 search_path에 없을 수 있어
-- 테이블명을 스키마 없이 참조하면 회원가입 시 relation not found 오류가 발생합니다.
-- 운영 DB와 새 환경 모두 같은 동작을 하도록 함수 정의를 명시적으로 고정합니다.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'username', ''), NEW.email)
  );

  INSERT INTO public.user_status (user_id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';
