-- ============================================
-- 20) RLS POLICIES COMPLETAS
-- ============================================
ALTER TABLE public.web_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.web_book_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_book_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_reading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_import_jobs ENABLE ROW LEVEL SECURITY;

-- web_books
DROP POLICY IF EXISTS "web_books_owner_all" ON public.web_books;
CREATE POLICY "web_books_owner_all" ON public.web_books FOR ALL TO authenticated USING (public.fn_is_book_owner());

DROP POLICY IF EXISTS "web_books_beta_read" ON public.web_books;
CREATE POLICY "web_books_beta_read" ON public.web_books FOR SELECT TO authenticated USING (status = 'ready' AND COALESCE(is_published, false) = true AND public.fn_can_access_books());

-- web_book_pages
DROP POLICY IF EXISTS "web_book_pages_owner_all" ON public.web_book_pages;
CREATE POLICY "web_book_pages_owner_all" ON public.web_book_pages FOR ALL TO authenticated USING (public.fn_is_book_owner());

DROP POLICY IF EXISTS "web_book_pages_beta_read" ON public.web_book_pages;
CREATE POLICY "web_book_pages_beta_read" ON public.web_book_pages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.web_books b WHERE b.id = book_id AND b.status = 'ready' AND COALESCE(b.is_published, false) = true) AND public.fn_can_access_books());

-- user_book_progress
DROP POLICY IF EXISTS "user_book_progress_own" ON public.user_book_progress;
CREATE POLICY "user_book_progress_own" ON public.user_book_progress FOR ALL TO authenticated USING (user_id = auth.uid() OR public.fn_is_book_owner());

-- user_annotations
DROP POLICY IF EXISTS "user_annotations_own" ON public.user_annotations;
CREATE POLICY "user_annotations_own" ON public.user_annotations FOR ALL TO authenticated USING (user_id = auth.uid() OR public.fn_is_book_owner());

-- book_chat_threads
DROP POLICY IF EXISTS "book_chat_threads_own" ON public.book_chat_threads;
CREATE POLICY "book_chat_threads_own" ON public.book_chat_threads FOR ALL TO authenticated USING (user_id = auth.uid() OR public.fn_is_book_owner());

-- book_chat_messages
DROP POLICY IF EXISTS "book_chat_messages_own" ON public.book_chat_messages;
CREATE POLICY "book_chat_messages_own" ON public.book_chat_messages FOR ALL TO authenticated USING (user_id = auth.uid() OR public.fn_is_book_owner());

-- book_access_logs
DROP POLICY IF EXISTS "book_access_logs_admin" ON public.book_access_logs;
CREATE POLICY "book_access_logs_admin" ON public.book_access_logs FOR ALL TO authenticated USING (public.fn_is_book_owner());

-- book_reading_sessions
DROP POLICY IF EXISTS "book_reading_sessions_own" ON public.book_reading_sessions;
CREATE POLICY "book_reading_sessions_own" ON public.book_reading_sessions FOR ALL TO authenticated USING (user_id = auth.uid() OR public.fn_is_book_owner());

-- book_ratings
DROP POLICY IF EXISTS "book_ratings_own" ON public.book_ratings;
CREATE POLICY "book_ratings_own" ON public.book_ratings FOR ALL TO authenticated USING (user_id = auth.uid() OR public.fn_is_book_owner());

DROP POLICY IF EXISTS "book_ratings_public_read" ON public.book_ratings;
CREATE POLICY "book_ratings_public_read" ON public.book_ratings FOR SELECT TO authenticated USING (is_public = true);

-- book_import_jobs
DROP POLICY IF EXISTS "book_import_jobs_admin" ON public.book_import_jobs;
CREATE POLICY "book_import_jobs_admin" ON public.book_import_jobs FOR ALL TO authenticated USING (public.fn_is_book_owner());

-- ============================================
-- 21) GRANTS FINAIS
-- ============================================
GRANT SELECT ON public.web_books TO authenticated;
GRANT SELECT ON public.web_book_pages TO authenticated;
GRANT ALL ON public.user_book_progress TO authenticated;
GRANT ALL ON public.user_annotations TO authenticated;
GRANT ALL ON public.book_chat_threads TO authenticated;
GRANT ALL ON public.book_chat_messages TO authenticated;
GRANT ALL ON public.book_reading_sessions TO authenticated;
GRANT ALL ON public.book_ratings TO authenticated;