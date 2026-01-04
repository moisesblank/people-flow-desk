-- ============================================
-- HABILITAR REALTIME PARA TABELAS LMS (sem lessons que já existe)
-- ============================================

-- Habilitar REPLICA IDENTITY FULL para capturar dados completos
ALTER TABLE public.courses REPLICA IDENTITY FULL;
ALTER TABLE public.modules REPLICA IDENTITY FULL;
ALTER TABLE public.areas REPLICA IDENTITY FULL;

-- Adicionar tabelas à publicação realtime (lessons já está)
ALTER PUBLICATION supabase_realtime ADD TABLE public.courses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.modules;
ALTER PUBLICATION supabase_realtime ADD TABLE public.areas;