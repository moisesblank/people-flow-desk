import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsOptions } from "../_shared/corsConfig.ts";

// LEI VI: CORS dinâmico via allowlist (fallback removido)

serve(async (req) => {
  // CORS seguro via allowlist
  if (req.method === 'OPTIONS') {
    return handleCorsOptions(req);
  }
  
  const corsHeaders = getCorsHeaders(req);

  try {
    const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY");
    const YOUTUBE_CHANNEL_HANDLE = Deno.env.get("YOUTUBE_CHANNEL_HANDLE") || "moises.profquimica";
    
    if (!YOUTUBE_API_KEY) {
      console.log("[YouTube Sync] API Key not configured");
      return new Response(JSON.stringify({ 
        message: "YouTube API Key not configured" 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    console.log("[YouTube Sync] Starting sync for:", YOUTUBE_CHANNEL_HANDLE);
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    
    // 1. Buscar Channel ID pelo handle
    const handleResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=id,snippet,statistics,contentDetails&forHandle=${YOUTUBE_CHANNEL_HANDLE}&key=${YOUTUBE_API_KEY}`
    );
    
    if (!handleResponse.ok) {
      const errorText = await handleResponse.text();
      console.error("[YouTube Sync] Error fetching channel:", errorText);
      throw new Error(`YouTube API error: ${errorText}`);
    }
    
    const channelData = await handleResponse.json();
    
    if (!channelData.items || channelData.items.length === 0) {
      console.error("[YouTube Sync] Channel not found");
      return new Response(JSON.stringify({ 
        error: "Channel not found" 
      }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const channel = channelData.items[0];
    const channelId = channel.id;
    const stats = channel.statistics;
    
    console.log("[YouTube Sync] Channel found:", {
      id: channelId,
      title: channel.snippet.title,
      subscribers: stats.subscriberCount,
      views: stats.viewCount,
      videos: stats.videoCount
    });
    
    // 2. Buscar últimos vídeos
    const videosResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=10&order=date&type=video&key=${YOUTUBE_API_KEY}`
    );
    
    let recentVideos: any[] = [];
    let totalRecentViews = 0;
    
    if (videosResponse.ok) {
      const videosData = await videosResponse.json();
      const videoIds = videosData.items?.map((v: any) => v.id.videoId).join(',');
      
      if (videoIds) {
        // Buscar estatísticas dos vídeos
        const videoStatsResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds}&key=${YOUTUBE_API_KEY}`
        );
        
        if (videoStatsResponse.ok) {
          const videoStatsData = await videoStatsResponse.json();
          recentVideos = videoStatsData.items?.map((v: any) => ({
            videoId: v.id,
            title: v.snippet.title,
            publishedAt: v.snippet.publishedAt,
            views: parseInt(v.statistics.viewCount || '0'),
            likes: parseInt(v.statistics.likeCount || '0'),
            comments: parseInt(v.statistics.commentCount || '0'),
          })) || [];
          
          totalRecentViews = recentVideos.reduce((sum, v) => sum + v.views, 0);
        }
      }
    }
    
    // 3. Salvar métricas no banco
    const metricsData = {
      data: new Date().toISOString(),
      channel_id: channelId,
      channel_name: channel.snippet.title,
      inscritos: parseInt(stats.subscriberCount || '0'),
      visualizacoes_totais: parseInt(stats.viewCount || '0'),
      total_videos: parseInt(stats.videoCount || '0'),
      visualizacoes_recentes: totalRecentViews,
      videos_recentes: recentVideos.length,
      engagement_rate: recentVideos.length > 0 
        ? (recentVideos.reduce((sum, v) => sum + v.likes + v.comments, 0) / totalRecentViews * 100).toFixed(2)
        : 0,
      created_at: new Date().toISOString(),
    };
    
    const { error: insertError } = await supabase
      .from("youtube_metrics")
      .insert(metricsData);
    
    if (insertError) {
      console.error("[YouTube Sync] Error saving metrics:", insertError);
    } else {
      console.log("[YouTube Sync] Metrics saved successfully");
    }
    
    // 4. Salvar vídeos recentes
    for (const video of recentVideos) {
      await supabase.from("youtube_videos").upsert({
        video_id: video.videoId,
        channel_id: channelId,
        titulo: video.title,
        publicado_em: video.publishedAt,
        visualizacoes: video.views,
        likes: video.likes,
        comentarios: video.comments,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "video_id"
      });
    }
    
    console.log("[YouTube Sync] Sync completed successfully");
    
    return new Response(JSON.stringify({ 
      success: true,
      channel: {
        id: channelId,
        name: channel.snippet.title,
        subscribers: stats.subscriberCount,
        totalViews: stats.viewCount,
        videoCount: stats.videoCount,
      },
      recentVideos: recentVideos.length
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[YouTube Sync] Error:", errorMessage);
    return new Response(JSON.stringify({ 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
