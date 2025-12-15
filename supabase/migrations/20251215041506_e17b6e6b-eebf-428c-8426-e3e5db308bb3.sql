-- Enable realtime for tables not yet added
DO $$
BEGIN
  -- Try adding students
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.students;
  EXCEPTION WHEN duplicate_object THEN
    NULL; -- Table already added
  END;
  
  -- Try adding payments
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  
  -- Try adding calendar_tasks
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.calendar_tasks;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
  
  -- Try adding user_roles
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;
  EXCEPTION WHEN duplicate_object THEN
    NULL;
  END;
END $$;