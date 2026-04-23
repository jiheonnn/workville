alter table public.profiles
drop constraint if exists profiles_character_type_check;

alter table public.profiles
add constraint profiles_character_type_check
check (
  character_type is null
  or (character_type >= 1 and character_type <= 8)
);
