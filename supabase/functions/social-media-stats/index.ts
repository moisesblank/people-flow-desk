// ============================================
// MOISÉS MEDEIROS v10.0 - Social Media Stats
// Integração real com YouTube Data API
// Métricas de redes sociais em tempo real
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

interface SocialMediaRequest {
  action: 'fetch_all' | 'fetch_youtube' | 'update_manual' | 'get_stats';
  platform?: string;
  data?: {
    followers?: number;
    engagement_rate?: number;
    growth_rate?: number;
    views_count?: number;
    posts_count?: number;
  };
}

// Buscar estatísticas do YouTube
const YOUTUBE_CHANNEL_HANDLE = Deno.env.get('YOUTUBE_CHANNEL_HANDLE') || '@MoisesMedeiros';

async function fetchYouTubeStats(): Promise<{
  subscribers: number;
  views: number;
  videos: number;
  channelTitle: string;
  thumbnailUrl: string;
}> {
  if (!YOUTUBE_API_KEY) {
    throw new Error('YOUTUBE_API_KEY não configurada');
  }

  const baseUrl = 'https://www.googleapis.com/youtube/v3';
  
  // Buscar canal pelo handle usando forHandle
  const handle = YOUTUBE_CHANNEL_HANDLE.replace('@', '');
  const channelUrl = `${baseUrl}/channels?part=statistics,snippet&forHandle=${handle}&key=${YOUTUBE_API_KEY}`;
  
  console.log('[YouTube] Buscando canal por handle:', handle);
  
  const channelResponse = await fetch(channelUrl);
  const channelData = await channelResponse.json();
  
  if (channelData.error) {
    console.error('YouTube API Error:', channelData.error);
    throw new Error(channelData.error.message);
  }

  // Se não encontrar pelo handle, tentar buscar por username
  if (!channelData.items || channelData.items.length === 0) {
    console.log('[YouTube] Handle não encontrado, tentando username...');
    const userUrl = `${baseUrl}/channels?part=statistics,snippet&forUsername=${handle}&key=${YOUTUBE_API_KEY}`;
    const userResponse = await fetch(userUrl);
    const userData = await userResponse.json();
    
    if (userData.items && userData.items.length > 0) {
      const channel = userData.items[0];
      return {
        subscribers: parseInt(channel.statistics.subscriberCount || '0'),
        views: parseInt(channel.statistics.viewCount || '0'),
        videos: parseInt(channel.statistics.videoCount || '0'),
        channelTitle: channel.snippet.title,
        thumbnailUrl: channel.snippet.thumbnails?.high?.url || ''
      };
    }
    
    // Retornar zeros se não encontrar
    console.log('[YouTube] Canal não encontrado');
    return {
      subscribers: 0,
      views: 0,
      videos: 0,
      channelTitle: 'Canal não encontrado',
      thumbnailUrl: ''
    };
  }

  const channel = channelData.items[0];
  console.log('[YouTube] Canal encontrado:', channel.snippet.title);
  
  return {
    subscribers: parseInt(channel.statistics.subscriberCount || '0'),
    views: parseInt(channel.statistics.viewCount || '0'),
    videos: parseInt(channel.statistics.videoCount || '0'),
    channelTitle: channel.snippet.title,
    thumbnailUrl: channel.snippet.thumbnails?.high?.url || ''
  };
}

// Calcular taxa de crescimento comparando com histórico
async function calculateGrowthRate(supabase: any, platform: string, currentFollowers: number): Promise<number> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  
  const { data: history } = await supabase
    .from('social_media_history')
    .select('followers')
    .eq('platform', platform)
    .gte('recorded_at', thirtyDaysAgo)
    .order('recorded_at', { ascending: true })
    .limit(1);

  if (history && history.length > 0 && history[0].followers > 0) {
    const previousFollowers = history[0].followers;
    return ((currentFollowers - previousFollowers) / previousFollowers) * 100;
  }
  
  return 0;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, platform, data }: SocialMediaRequest = await req.json();
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Configuração do Supabase incompleta');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    switch (action) {
      case 'get_stats': {
        // Retornar estatísticas atuais
        const { data: metrics, error } = await supabase
          .from('social_media_metrics')
          .select('*')
          .order('platform');

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, data: metrics }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'fetch_youtube': {
        console.log('[Social] Buscando estatísticas do YouTube...');
        
        const ytStats = await fetchYouTubeStats();
        const growthRate = await calculateGrowthRate(supabase, 'youtube', ytStats.subscribers);
        
        // Calcular engajamento (views / subscribers * 100)
        const engagementRate = ytStats.subscribers > 0 
          ? Math.min((ytStats.views / ytStats.subscribers / ytStats.videos) * 100, 99.9)
          : 0;

        // Atualizar no banco
        const { error: updateError } = await supabase
          .from('social_media_metrics')
          .update({
            followers: ytStats.subscribers,
            subscribers: ytStats.subscribers,
            views_count: ytStats.views,
            videos_count: ytStats.videos,
            engagement_rate: Math.round(engagementRate * 10) / 10,
            growth_rate: Math.round(growthRate * 10) / 10,
            last_fetched_at: new Date().toISOString(),
            extra_data: {
              channel_title: ytStats.channelTitle,
              thumbnail_url: ytStats.thumbnailUrl,
              fetched_at: new Date().toISOString()
            }
          })
          .eq('platform', 'youtube');

        if (updateError) throw updateError;

        // Salvar no histórico
        await supabase
          .from('social_media_history')
          .insert({
            platform: 'youtube',
            followers: ytStats.subscribers,
            engagement_rate: engagementRate,
            views_count: ytStats.views
          });

        console.log('[Social] YouTube atualizado:', ytStats);

        return new Response(JSON.stringify({ 
          success: true, 
          data: {
            platform: 'youtube',
            ...ytStats,
            engagement_rate: engagementRate,
            growth_rate: growthRate
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'fetch_all': {
        console.log('[Social] Buscando todas as estatísticas...');
        
        const results: any = {};

        // YouTube
        try {
          const ytStats = await fetchYouTubeStats();
          const growthRate = await calculateGrowthRate(supabase, 'youtube', ytStats.subscribers);
          const engagementRate = ytStats.subscribers > 0 
            ? Math.min((ytStats.views / ytStats.subscribers / Math.max(ytStats.videos, 1)) * 100, 99.9)
            : 0;

          await supabase
            .from('social_media_metrics')
            .update({
              followers: ytStats.subscribers,
              subscribers: ytStats.subscribers,
              views_count: ytStats.views,
              videos_count: ytStats.videos,
              engagement_rate: Math.round(engagementRate * 10) / 10,
              growth_rate: Math.round(growthRate * 10) / 10,
              last_fetched_at: new Date().toISOString(),
              extra_data: {
                channel_title: ytStats.channelTitle,
                thumbnail_url: ytStats.thumbnailUrl
              }
            })
            .eq('platform', 'youtube');

          await supabase
            .from('social_media_history')
            .insert({
              platform: 'youtube',
              followers: ytStats.subscribers,
              engagement_rate: engagementRate,
              views_count: ytStats.views
            });

          results.youtube = { success: true, ...ytStats };
        } catch (e: any) {
          console.error('[Social] Erro YouTube:', e);
          results.youtube = { success: false, error: e.message };
        }

        // Buscar métricas atualizadas
        const { data: metrics } = await supabase
          .from('social_media_metrics')
          .select('*')
          .order('platform');

        return new Response(JSON.stringify({ 
          success: true, 
          results,
          data: metrics 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'update_manual': {
        if (!platform || !data) {
          throw new Error('Platform e data são obrigatórios');
        }

        console.log(`[Social] Atualizando ${platform} manualmente:`, data);

        const updateData: any = {
          ...data,
          last_fetched_at: new Date().toISOString()
        };

        if (data.followers) {
          updateData.followers = data.followers;
        }

        const { error: updateError } = await supabase
          .from('social_media_metrics')
          .update(updateData)
          .eq('platform', platform);

        if (updateError) throw updateError;

        // Salvar no histórico
        if (data.followers) {
          await supabase
            .from('social_media_history')
            .insert({
              platform,
              followers: data.followers,
              engagement_rate: data.engagement_rate || 0,
              views_count: data.views_count || 0
            });
        }

        return new Response(JSON.stringify({ success: true, message: 'Atualizado com sucesso' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error('Ação inválida');
    }
  } catch (error: any) {
    console.error('[Social] Erro:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
