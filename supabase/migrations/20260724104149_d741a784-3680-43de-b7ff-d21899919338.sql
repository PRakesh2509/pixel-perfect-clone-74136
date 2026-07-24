DROP POLICY IF EXISTS "admins insert jobs" ON public.jobs;
DROP POLICY IF EXISTS "admins update jobs" ON public.jobs;
DROP POLICY IF EXISTS "admins delete jobs" ON public.jobs;

CREATE POLICY "admins insert jobs" ON public.jobs FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "admins update jobs" ON public.jobs FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "admins delete jobs" ON public.jobs FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated, PUBLIC, anon;