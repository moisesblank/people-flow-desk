-- ============================================
-- TABELA PARA ARMAZENAR CAPÍTULOS DE VÍDEOS
-- Sistema de Capítulos Inteligente v1.0
-- Prof. Moisés Medeiros - 2025
-- ============================================

CREATE TABLE IF NOT EXISTS video_chapters (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    panda_video_id TEXT NOT NULL,
    lesson_title TEXT NOT NULL,
    aula_number INTEGER,
    chapters JSONB NOT NULL DEFAULT '[]',
    is_2025_course BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(panda_video_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_video_chapters_panda_id ON video_chapters(panda_video_id);
CREATE INDEX IF NOT EXISTS idx_video_chapters_2025 ON video_chapters(is_2025_course);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_video_chapters_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS video_chapters_updated_at ON video_chapters;
CREATE TRIGGER video_chapters_updated_at
    BEFORE UPDATE ON video_chapters
    FOR EACH ROW
    EXECUTE FUNCTION update_video_chapters_timestamp();

-- Habilitar RLS (Row Level Security)
ALTER TABLE video_chapters ENABLE ROW LEVEL SECURITY;

-- Política de leitura para todos os usuários autenticados
CREATE POLICY "video_chapters_read_policy" ON video_chapters
    FOR SELECT USING (true);