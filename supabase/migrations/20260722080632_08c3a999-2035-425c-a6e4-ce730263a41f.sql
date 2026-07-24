
DROP POLICY IF EXISTS "Authenticated can lookup classes" ON public.classes;

CREATE OR REPLACE FUNCTION public.join_class(_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  v_uid uuid := auth.uid();
  v_exists boolean;
begin
  if v_uid is null then
    return json_build_object('success', false, 'error', 'Not authenticated');
  end if;
  select exists(select 1 from public.classes where class_code = _code) into v_exists;
  if not v_exists then
    return json_build_object('success', false, 'error', 'No class found with that code');
  end if;
  insert into public.enrollments (class_code, student_id)
    values (_code, v_uid)
    on conflict do nothing;
  return json_build_object('success', true, 'class_code', _code);
end;
$$;

REVOKE ALL ON FUNCTION public.join_class(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_class(text) TO authenticated;
