import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface YouTubeLiveRequest {
  action: 
    | 'get_channel_stats' 
    | 'get_videos' 
    | 'get_live_streams' 
    | 'get_current_live'
    | 'get_upcoming_lives'
    | 'get_video_details'
    | 'sync_channel'
    | 'check_live_status'
    | 'get_live_chat';
  videoId?: string;
  maxResults?: number;
  pageToken?: string;
}

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY");
    const YOUTUBE_CHANNEL_HANDLE = Deno.env.get("YOUTUBE_CHANNEL_HANDLE") || "moises.profquimica";
    
    if (!YOUTUBE_API_KEY) {
      console.error("[YouTube Live] API Key not configured");
      return new Response(JSON.stringify({ 
        success: false,
        error: "YouTube API Key not configured" 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { action, videoId, maxResults = 10, pageToken }: YouTubeLiveRequest = await req.json();
    
    console.log(`[YouTube Live] Action: ${action}`);

    // Helper para buscar o Channel ID
    const getChannelId = async (): Promise<string | null> => {
      const response = await fetch(
        `${YOUTUBE_API_BASE}/channels?part=id&forHandle=${YOUTUBE_CHANNEL_HANDLE}&key=${YOUTUBE_API_KEY}`
      );
      const data = await response.json();
      return data.items?.[0]?.id || null;
    };

    switch (action) {
      // ========================================
      // GET CHANNEL STATS - Estatísticas do canal
      // ========================================
      case 'get_channel_stats': {
        const response = await fetch(
          `${YOUTUBE_API_BASE}/channels?part=snippet,statistics,brandingSettings,contentDetails&forHandle=${YOUTUBE_CHANNEL_HANDLE}&key=${YOUTUBE_API_KEY}`
        );
        
        if (!response.ok) {
          throw new Error(`YouTube API error: ${response.status}`);
        }
        
        const data = await response.json();
        const channel = data.items?.[0];
        
        if (!channel) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: "Channel not found" 
          }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const stats = {
          channelId: channel.id,
          title: channel.snippet.title,
          description: channel.snippet.description,
          customUrl: channel.snippet.customUrl,
          thumbnails: channel.snippet.thumbnails,
          subscriberCount: parseInt(channel.statistics.subscriberCount || '0'),
          viewCount: parseInt(channel.statistics.viewCount || '0'),
          videoCount: parseInt(channel.statistics.videoCount || '0'),
          hiddenSubscriberCount: channel.statistics.hiddenSubscriberCount,
          bannerUrl: channel.brandingSettings?.image?.bannerExternalUrl,
          uploadsPlaylistId: channel.contentDetails?.relatedPlaylists?.uploads,
        };

        return new Response(JSON.stringify({ success: true, data: stats }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ========================================
      // GET VIDEOS - Últimos vídeos do canal
      // ========================================
      case 'get_videos': {
        const channelId = await getChannelId();
        if (!channelId) {
          throw new Error("Channel not found");
        }

        // Buscar IDs dos vídeos
        const searchResponse = await fetch(
          `${YOUTUBE_API_BASE}/search?part=snippet&channelId=${channelId}&type=video&order=date&maxResults=${maxResults}${pageToken ? `&pageToken=${pageToken}` : ''}&key=${YOUTUBE_API_KEY}`
        );
        const searchData = await searchResponse.json();
        
        if (!searchData.items?.length) {
          return new Response(JSON.stringify({ 
            success: true, 
            data: { videos: [], nextPageToken: null } 
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Buscar detalhes completos
        const videoIds = searchData.items.map((v: any) => v.id.videoId).join(',');
        const videosResponse = await fetch(
          `${YOUTUBE_API_BASE}/videos?part=snippet,statistics,contentDetails,liveStreamingDetails&id=${videoIds}&key=${YOUTUBE_API_KEY}`
        );
        const videosData = await videosResponse.json();

        const videos = videosData.items?.map((v: any) => ({
          videoId: v.id,
          title: v.snippet.title,
          description: v.snippet.description,
          thumbnails: v.snippet.thumbnails,
          publishedAt: v.snippet.publishedAt,
          channelTitle: v.snippet.channelTitle,
          duration: v.contentDetails.duration,
          viewCount: parseInt(v.statistics?.viewCount || '0'),
          likeCount: parseInt(v.statistics?.likeCount || '0'),
          commentCount: parseInt(v.statistics?.commentCount || '0'),
          isLive: v.snippet.liveBroadcastContent === 'live',
          isUpcoming: v.snippet.liveBroadcastContent === 'upcoming',
          liveDetails: v.liveStreamingDetails || null,
        })) || [];

        return new Response(JSON.stringify({ 
          success: true, 
          data: { 
            videos, 
            nextPageToken: searchData.nextPageToken || null,
            totalResults: searchData.pageInfo?.totalResults || 0
          } 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ========================================
      // GET LIVE STREAMS - Lives ativas e agendadas
      // ========================================
      case 'get_live_streams': {
        const channelId = await getChannelId();
        if (!channelId) {
          throw new Error("Channel not found");
        }

        // Buscar lives ativas
        const liveResponse = await fetch(
          `${YOUTUBE_API_BASE}/search?part=snippet&channelId=${channelId}&type=video&eventType=live&maxResults=5&key=${YOUTUBE_API_KEY}`
        );
        const liveData = await liveResponse.json();

        // Buscar lives agendadas
        const upcomingResponse = await fetch(
          `${YOUTUBE_API_BASE}/search?part=snippet&channelId=${channelId}&type=video&eventType=upcoming&maxResults=10&key=${YOUTUBE_API_KEY}`
        );
        const upcomingData = await upcomingResponse.json();

        // Combinar IDs e buscar detalhes
        const allIds = [
          ...(liveData.items?.map((v: any) => v.id.videoId) || []),
          ...(upcomingData.items?.map((v: any) => v.id.videoId) || [])
        ].join(',');

        let streams: any[] = [];
        
        if (allIds) {
          const detailsResponse = await fetch(
            `${YOUTUBE_API_BASE}/videos?part=snippet,statistics,liveStreamingDetails&id=${allIds}&key=${YOUTUBE_API_KEY}`
          );
          const detailsData = await detailsResponse.json();

          streams = detailsData.items?.map((v: any) => ({
            videoId: v.id,
            title: v.snippet.title,
            description: v.snippet.description,
            thumbnails: v.snippet.thumbnails,
            publishedAt: v.snippet.publishedAt,
            isLive: v.snippet.liveBroadcastContent === 'live',
            isUpcoming: v.snippet.liveBroadcastContent === 'upcoming',
            scheduledStartTime: v.liveStreamingDetails?.scheduledStartTime,
            actualStartTime: v.liveStreamingDetails?.actualStartTime,
            concurrentViewers: parseInt(v.liveStreamingDetails?.concurrentViewers || '0'),
            activeLiveChatId: v.liveStreamingDetails?.activeLiveChatId,
          })) || [];

          // Salvar no banco
          for (const stream of streams) {
            await supabase.from("youtube_lives").upsert({
              video_id: stream.videoId,
              titulo: stream.title,
              descricao: stream.description,
              thumbnail_url: stream.thumbnails?.maxres?.url || stream.thumbnails?.high?.url,
              status: stream.isLive ? 'live' : 'upcoming',
              scheduled_start: stream.scheduledStartTime,
              actual_start: stream.actualStartTime,
              max_viewers: Math.max(stream.concurrentViewers, 0),
              updated_at: new Date().toISOString(),
            }, { onConflict: "video_id" });
          }
        }

        return new Response(JSON.stringify({ 
          success: true, 
          data: {
            live: streams.filter(s => s.isLive),
            upcoming: streams.filter(s => s.isUpcoming),
          }
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ========================================
      // GET CURRENT LIVE - Live ativa atual
      // ========================================
      case 'get_current_live': {
        const channelId = await getChannelId();
        if (!channelId) {
          throw new Error("Channel not found");
        }

        const response = await fetch(
          `${YOUTUBE_API_BASE}/search?part=snippet&channelId=${channelId}&type=video&eventType=live&maxResults=1&key=${YOUTUBE_API_KEY}`
        );
        const data = await response.json();

        if (!data.items?.length) {
          return new Response(JSON.stringify({ 
            success: true, 
            data: null,
            message: "No live stream currently active"
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const liveVideoId = data.items[0].id.videoId;
        
        // Buscar detalhes da live
        const detailsResponse = await fetch(
          `${YOUTUBE_API_BASE}/videos?part=snippet,statistics,liveStreamingDetails&id=${liveVideoId}&key=${YOUTUBE_API_KEY}`
        );
        const detailsData = await detailsResponse.json();
        const live = detailsData.items?.[0];

        if (!live) {
          return new Response(JSON.stringify({ 
            success: true, 
            data: null 
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const liveData = {
          videoId: live.id,
          title: live.snippet.title,
          description: live.snippet.description,
          thumbnails: live.snippet.thumbnails,
          channelTitle: live.snippet.channelTitle,
          publishedAt: live.snippet.publishedAt,
          scheduledStartTime: live.liveStreamingDetails?.scheduledStartTime,
          actualStartTime: live.liveStreamingDetails?.actualStartTime,
          concurrentViewers: parseInt(live.liveStreamingDetails?.concurrentViewers || '0'),
          activeLiveChatId: live.liveStreamingDetails?.activeLiveChatId,
          embedUrl: `https://www.youtube.com/embed/${live.id}?autoplay=1&rel=0`,
          watchUrl: `https://www.youtube.com/watch?v=${live.id}`,
        };

        // Atualizar no banco
        await supabase.from("youtube_lives").upsert({
          video_id: liveData.videoId,
          titulo: liveData.title,
          descricao: liveData.description,
          thumbnail_url: liveData.thumbnails?.maxres?.url || liveData.thumbnails?.high?.url,
          status: 'live',
          actual_start: liveData.actualStartTime,
          max_viewers: liveData.concurrentViewers,
          updated_at: new Date().toISOString(),
        }, { onConflict: "video_id" });

        return new Response(JSON.stringify({ success: true, data: liveData }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ========================================
      // GET UPCOMING LIVES - Lives agendadas
      // ========================================
      case 'get_upcoming_lives': {
        const channelId = await getChannelId();
        if (!channelId) {
          throw new Error("Channel not found");
        }

        const response = await fetch(
          `${YOUTUBE_API_BASE}/search?part=snippet&channelId=${channelId}&type=video&eventType=upcoming&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}`
        );
        const data = await response.json();

        if (!data.items?.length) {
          return new Response(JSON.stringify({ 
            success: true, 
            data: [] 
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const videoIds = data.items.map((v: any) => v.id.videoId).join(',');
        const detailsResponse = await fetch(
          `${YOUTUBE_API_BASE}/videos?part=snippet,liveStreamingDetails&id=${videoIds}&key=${YOUTUBE_API_KEY}`
        );
        const detailsData = await detailsResponse.json();

        const upcomingLives = detailsData.items?.map((v: any) => ({
          videoId: v.id,
          title: v.snippet.title,
          description: v.snippet.description,
          thumbnails: v.snippet.thumbnails,
          scheduledStartTime: v.liveStreamingDetails?.scheduledStartTime,
          embedUrl: `https://www.youtube.com/embed/${v.id}`,
          watchUrl: `https://www.youtube.com/watch?v=${v.id}`,
        })) || [];

        return new Response(JSON.stringify({ success: true, data: upcomingLives }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ========================================
      // GET VIDEO DETAILS - Detalhes de um vídeo
      // ========================================
      case 'get_video_details': {
        if (!videoId) {
          throw new Error("videoId is required");
        }

        const response = await fetch(
          `${YOUTUBE_API_BASE}/videos?part=snippet,statistics,contentDetails,liveStreamingDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`
        );
        const data = await response.json();
        const video = data.items?.[0];

        if (!video) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: "Video not found" 
          }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const videoData = {
          videoId: video.id,
          title: video.snippet.title,
          description: video.snippet.description,
          thumbnails: video.snippet.thumbnails,
          channelId: video.snippet.channelId,
          channelTitle: video.snippet.channelTitle,
          publishedAt: video.snippet.publishedAt,
          duration: video.contentDetails.duration,
          viewCount: parseInt(video.statistics?.viewCount || '0'),
          likeCount: parseInt(video.statistics?.likeCount || '0'),
          commentCount: parseInt(video.statistics?.commentCount || '0'),
          isLive: video.snippet.liveBroadcastContent === 'live',
          isUpcoming: video.snippet.liveBroadcastContent === 'upcoming',
          liveDetails: video.liveStreamingDetails || null,
          embedUrl: `https://www.youtube.com/embed/${video.id}`,
          watchUrl: `https://www.youtube.com/watch?v=${video.id}`,
        };

        return new Response(JSON.stringify({ success: true, data: videoData }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ========================================
      // SYNC CHANNEL - Sincronizar dados do canal
      // ========================================
      case 'sync_channel': {
        const channelId = await getChannelId();
        if (!channelId) {
          throw new Error("Channel not found");
        }

        // 1. Buscar estatísticas do canal
        const channelResponse = await fetch(
          `${YOUTUBE_API_BASE}/channels?part=statistics,snippet&id=${channelId}&key=${YOUTUBE_API_KEY}`
        );
        const channelData = await channelResponse.json();
        const channel = channelData.items?.[0];

        if (!channel) {
          throw new Error("Channel data not found");
        }

        // 2. Buscar últimos vídeos
        const videosResponse = await fetch(
          `${YOUTUBE_API_BASE}/search?part=snippet&channelId=${channelId}&type=video&order=date&maxResults=20&key=${YOUTUBE_API_KEY}`
        );
        const videosData = await videosResponse.json();
        
        const videoIds = videosData.items?.map((v: any) => v.id.videoId).join(',');
        let totalRecentViews = 0;
        let recentVideosCount = 0;

        if (videoIds) {
          const videoStatsResponse = await fetch(
            `${YOUTUBE_API_BASE}/videos?part=statistics,snippet,contentDetails&id=${videoIds}&key=${YOUTUBE_API_KEY}`
          );
          const videoStatsData = await videoStatsResponse.json();

          for (const video of videoStatsData.items || []) {
            const views = parseInt(video.statistics?.viewCount || '0');
            totalRecentViews += views;
            recentVideosCount++;

            // Salvar vídeo no banco
            await supabase.from("youtube_videos").upsert({
              video_id: video.id,
              channel_id: channelId,
              titulo: video.snippet.title,
              descricao: video.snippet.description,
              thumbnail_url: video.snippet.thumbnails?.high?.url,
              publicado_em: video.snippet.publishedAt,
              visualizacoes: views,
              likes: parseInt(video.statistics?.likeCount || '0'),
              comentarios: parseInt(video.statistics?.commentCount || '0'),
              duracao: video.contentDetails.duration,
              is_live: video.snippet.liveBroadcastContent === 'live',
              live_status: video.snippet.liveBroadcastContent,
              updated_at: new Date().toISOString(),
            }, { onConflict: "video_id" });
          }
        }

        // 3. Salvar métricas
        const stats = channel.statistics;
        const engagementRate = totalRecentViews > 0 
          ? ((recentVideosCount / totalRecentViews) * 100).toFixed(2)
          : '0';

        await supabase.from("youtube_metrics").insert({
          channel_id: channelId,
          channel_name: channel.snippet.title,
          inscritos: parseInt(stats.subscriberCount || '0'),
          visualizacoes_totais: parseInt(stats.viewCount || '0'),
          total_videos: parseInt(stats.videoCount || '0'),
          visualizacoes_recentes: totalRecentViews,
          videos_recentes: recentVideosCount,
          engagement_rate: parseFloat(engagementRate),
        });

        return new Response(JSON.stringify({ 
          success: true, 
          data: {
            channelId,
            channelName: channel.snippet.title,
            subscribers: parseInt(stats.subscriberCount || '0'),
            totalViews: parseInt(stats.viewCount || '0'),
            videosSynced: recentVideosCount,
          },
          message: "Channel synced successfully"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ========================================
      // CHECK LIVE STATUS - Verificar status de live
      // ========================================
      case 'check_live_status': {
        const channelId = await getChannelId();
        if (!channelId) {
          throw new Error("Channel not found");
        }

        // Verificar se há live ativa
        const liveResponse = await fetch(
          `${YOUTUBE_API_BASE}/search?part=snippet&channelId=${channelId}&type=video&eventType=live&maxResults=1&key=${YOUTUBE_API_KEY}`
        );
        const liveData = await liveResponse.json();
        const hasLive = (liveData.items?.length || 0) > 0;

        // Verificar próximas lives
        const upcomingResponse = await fetch(
          `${YOUTUBE_API_BASE}/search?part=snippet&channelId=${channelId}&type=video&eventType=upcoming&maxResults=3&key=${YOUTUBE_API_KEY}`
        );
        const upcomingData = await upcomingResponse.json();

        let currentLive = null;
        let upcomingLives: any[] = [];

        if (hasLive) {
          const videoId = liveData.items[0].id.videoId;
          const detailsResponse = await fetch(
            `${YOUTUBE_API_BASE}/videos?part=snippet,liveStreamingDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`
          );
          const detailsData = await detailsResponse.json();
          const live = detailsData.items?.[0];

          if (live) {
            currentLive = {
              videoId: live.id,
              title: live.snippet.title,
              thumbnails: live.snippet.thumbnails,
              concurrentViewers: parseInt(live.liveStreamingDetails?.concurrentViewers || '0'),
              actualStartTime: live.liveStreamingDetails?.actualStartTime,
            };
          }
        }

        if (upcomingData.items?.length) {
          const videoIds = upcomingData.items.map((v: any) => v.id.videoId).join(',');
          const detailsResponse = await fetch(
            `${YOUTUBE_API_BASE}/videos?part=snippet,liveStreamingDetails&id=${videoIds}&key=${YOUTUBE_API_KEY}`
          );
          const detailsData = await detailsResponse.json();

          upcomingLives = detailsData.items?.map((v: any) => ({
            videoId: v.id,
            title: v.snippet.title,
            thumbnails: v.snippet.thumbnails,
            scheduledStartTime: v.liveStreamingDetails?.scheduledStartTime,
          })) || [];
        }

        return new Response(JSON.stringify({ 
          success: true, 
          data: {
            isLive: hasLive,
            currentLive,
            upcomingLives,
          }
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[YouTube Live] Error:", errorMessage);
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
