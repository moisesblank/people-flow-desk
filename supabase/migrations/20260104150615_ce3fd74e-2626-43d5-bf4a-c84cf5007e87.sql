-- RPC para estatísticas de videoaulas (sem limite de 1000)
CREATE OR REPLACE FUNCTION get_videoaulas_stats()
RETURNS TABLE (
  total_aulas bigint,
  aulas_publicadas bigint,
  aulas_panda bigint,
  aulas_youtube bigint,
  total_views bigint,
  total_minutes bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT 
    COUNT(*)::bigint as total_aulas,
    COUNT(*) FILTER (WHERE is_published = true)::bigint as aulas_publicadas,
    COUNT(*) FILTER (WHERE video_provider = 'panda')::bigint as aulas_panda,
    COUNT(*) FILTER (WHERE video_provider = 'youtube')::bigint as aulas_youtube,
    COALESCE(SUM(views_count), 0)::bigint as total_views,
    COALESCE(SUM(duration_minutes), 0)::bigint as total_minutes
  FROM lessons;
$$;