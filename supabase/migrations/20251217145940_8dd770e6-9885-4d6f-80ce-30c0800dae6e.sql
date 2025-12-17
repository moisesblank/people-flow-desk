-- Enable realtime for metrics tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.youtube_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.instagram_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.facebook_ads_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tiktok_metrics;
ALTER PUBLICATION supabase_realtime ADD TABLE public.entradas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alunos;