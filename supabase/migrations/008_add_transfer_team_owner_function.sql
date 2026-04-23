CREATE OR REPLACE FUNCTION public.transfer_team_owner(
  target_team_id UUID,
  current_owner_user_id UUID,
  next_owner_user_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  current_owner_record public.team_members%ROWTYPE;
  next_owner_record public.team_members%ROWTYPE;
BEGIN
  IF current_owner_user_id = next_owner_user_id THEN
    RAISE EXCEPTION 'OWNER_ALREADY_ASSIGNED';
  END IF;

  SELECT *
  INTO current_owner_record
  FROM public.team_members
  WHERE team_id = target_team_id
    AND user_id = current_owner_user_id
    AND role = 'owner'
    AND status = 'active'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'CURRENT_OWNER_NOT_FOUND';
  END IF;

  SELECT *
  INTO next_owner_record
  FROM public.team_members
  WHERE team_id = target_team_id
    AND user_id = next_owner_user_id
    AND status = 'active'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'NEXT_OWNER_NOT_ACTIVE_MEMBER';
  END IF;

  UPDATE public.team_members
  SET role = CASE
    WHEN user_id = current_owner_user_id THEN 'member'
    WHEN user_id = next_owner_user_id THEN 'owner'
    ELSE role
  END
  WHERE team_id = target_team_id
    AND user_id IN (current_owner_user_id, next_owner_user_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.transfer_team_owner(UUID, UUID, UUID) TO authenticated;
