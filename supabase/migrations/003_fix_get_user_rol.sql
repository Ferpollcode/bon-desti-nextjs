-- Fix: stack depth limit exceeded en RLS
-- get_user_rol() con security invoker dispara el RLS de profiles,
-- que llama de nuevo a get_user_rol() → recursión infinita.
-- security definer hace que la función corra como su dueño (postgres),
-- salteando el RLS de profiles y cortando la recursión.

create or replace function get_user_rol()
returns text
language sql
security definer
stable
set search_path = ''
as $$
  select rol from public.profiles where id = (select auth.uid())
$$;
