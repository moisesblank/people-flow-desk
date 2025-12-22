import { useState, useEffect, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getFortressYouTubeUrl } from "@/components/video";

// ============================================
// TYPES
// ============================================
export interface ChannelStats {
  channelId: string;
  title: string;
  description: string;
  customUrl: string;
  thumbnails: any;
  subscriberCount: number;
  viewCount: number;
  videoCount: number;
  bannerUrl?: string;
}

export interface YouTubeVideo {
  videoId: string;
  title: string;
  description: string;
  thumbnails: any;
  publishedAt: string;
  duration?: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isLive: boolean;
  isUpcoming: boolean;
  liveDetails?: any;
}

export interface LiveStream {
  videoId: string;
  title: string;
  description: string;
  thumbnails: any;
  scheduledStartTime?: string;
  actualStartTime?: string;
  concurrentViewers: number;
  activeLiveChatId?: string;
  embedUrl: string;
  watchUrl: string;
}

export interface LiveStatus {
  isLive: boolean;
  currentLive: LiveStream | null;
  upcomingLives: LiveStream[];
}

// ============================================
// HOOK PRINCIPAL
// ============================================
export const useYouTubeLive = () => {
  const queryClient = useQueryClient();

  // ----------------------------------------
  // API Call Helper
  // ----------------------------------------
  const callYouTubeAPI = async (action: string, params: Record<string, any> = {}) => {
    const { data, error } = await supabase.functions.invoke('youtube-live', {
      body: { action, ...params },
    });

    if (error) throw error;
    if (!data.success) throw new Error(data.error);
    
    return data.data;
  };

  // ----------------------------------------
  // GET CHANNEL STATS
  // ----------------------------------------
  const useChannelStats = () => {
    return useQuery({
      queryKey: ['youtube-channel-stats'],
      queryFn: () => callYouTubeAPI('get_channel_stats'),
      staleTime: 5 * 60 * 1000, // 5 minutos
      refetchInterval: 10 * 60 * 1000, // Atualiza a cada 10 minutos
    });
  };

  // ----------------------------------------
  // GET VIDEOS
  // ----------------------------------------
  const useVideos = (maxResults = 10) => {
    return useQuery({
      queryKey: ['youtube-videos', maxResults],
      queryFn: () => callYouTubeAPI('get_videos', { maxResults }),
      staleTime: 5 * 60 * 1000,
    });
  };

  // ----------------------------------------
  // GET LIVE STATUS (com polling)
  // ----------------------------------------
  const useLiveStatus = (enabled = true) => {
    return useQuery({
      queryKey: ['youtube-live-status'],
      queryFn: () => callYouTubeAPI('check_live_status'),
      enabled,
      staleTime: 30 * 1000, // 30 segundos
      refetchInterval: 60 * 1000, // Atualiza a cada 1 minuto
    });
  };

  // ----------------------------------------
  // GET CURRENT LIVE
  // ----------------------------------------
  const useCurrentLive = () => {
    return useQuery({
      queryKey: ['youtube-current-live'],
      queryFn: () => callYouTubeAPI('get_current_live'),
      staleTime: 30 * 1000,
      refetchInterval: 30 * 1000, // Atualiza viewers a cada 30s
    });
  };

  // ----------------------------------------
  // GET UPCOMING LIVES
  // ----------------------------------------
  const useUpcomingLives = () => {
    return useQuery({
      queryKey: ['youtube-upcoming-lives'],
      queryFn: () => callYouTubeAPI('get_upcoming_lives'),
      staleTime: 5 * 60 * 1000,
    });
  };

  // ----------------------------------------
  // GET VIDEO DETAILS
  // ----------------------------------------
  const useVideoDetails = (videoId: string | null) => {
    return useQuery({
      queryKey: ['youtube-video', videoId],
      queryFn: () => callYouTubeAPI('get_video_details', { videoId }),
      enabled: !!videoId,
      staleTime: 60 * 1000,
    });
  };

  // ----------------------------------------
  // GET LIVE STREAMS
  // ----------------------------------------
  const useLiveStreams = () => {
    return useQuery({
      queryKey: ['youtube-live-streams'],
      queryFn: () => callYouTubeAPI('get_live_streams'),
      staleTime: 30 * 1000,
      refetchInterval: 60 * 1000,
    });
  };

  // ----------------------------------------
  // SYNC CHANNEL (mutation)
  // ----------------------------------------
  const useSyncChannel = () => {
    return useMutation({
      mutationFn: () => callYouTubeAPI('sync_channel'),
      onSuccess: () => {
        toast.success('Canal sincronizado com sucesso!');
        queryClient.invalidateQueries({ queryKey: ['youtube'] });
      },
      onError: (error: any) => {
        toast.error(`Erro ao sincronizar: ${error.message}`);
      },
    });
  };

  // ----------------------------------------
  // GET LIVES FROM DATABASE
  // ----------------------------------------
  const useLivesFromDB = () => {
    return useQuery({
      queryKey: ['youtube-lives-db'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('youtube_lives')
          .select('*')
          .order('scheduled_start', { ascending: true });
        
        if (error) throw error;
        return data;
      },
      staleTime: 30 * 1000,
    });
  };

  // ----------------------------------------
  // GET METRICS FROM DATABASE
  // ----------------------------------------
  const useMetricsFromDB = () => {
    return useQuery({
      queryKey: ['youtube-metrics-db'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('youtube_metrics')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(30);
        
        if (error) throw error;
        return data;
      },
      staleTime: 5 * 60 * 1000,
    });
  };

  // ----------------------------------------
  // REALTIME SUBSCRIPTION FOR LIVES
  // ----------------------------------------
  const useRealtimeLives = (onUpdate: (payload: any) => void) => {
    useEffect(() => {
      const channel = supabase
        .channel('youtube_lives_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'youtube_lives' },
          (payload) => {
            queryClient.invalidateQueries({ queryKey: ['youtube-lives-db'] });
            onUpdate(payload);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }, [onUpdate, queryClient]);
  };

  return {
    // Hooks para dados da API
    useChannelStats,
    useVideos,
    useLiveStatus,
    useCurrentLive,
    useUpcomingLives,
    useVideoDetails,
    useLiveStreams,
    
    // Mutations
    useSyncChannel,
    
    // Hooks para dados do banco
    useLivesFromDB,
    useMetricsFromDB,
    
    // Realtime
    useRealtimeLives,
    
    // Helper direto
    callYouTubeAPI,
  };
};

// ============================================
// HOOK SIMPLIFICADO PARA COMPONENTES
// ============================================
export const useYouTubeChannel = () => {
  const { useChannelStats, useLiveStatus } = useYouTubeLive();
  
  const channelQuery = useChannelStats();
  const liveQuery = useLiveStatus();

  return {
    channel: channelQuery.data as ChannelStats | undefined,
    liveStatus: liveQuery.data as LiveStatus | undefined,
    isLoading: channelQuery.isLoading || liveQuery.isLoading,
    error: channelQuery.error || liveQuery.error,
    refetch: () => {
      channelQuery.refetch();
      liveQuery.refetch();
    },
  };
};

// ============================================
// HOOK PARA PLAYER DE LIVE
// ============================================
export const useYouTubeLivePlayer = (videoId?: string) => {
  const { useVideoDetails, useCurrentLive } = useYouTubeLive();
  
  const currentLiveQuery = useCurrentLive();
  const videoQuery = useVideoDetails(videoId || null);

  const activeLive = currentLiveQuery.data as LiveStream | null;
  const videoDetails = videoQuery.data as YouTubeVideo | null;

  // Se não foi passado videoId, usa a live ativa
  const targetVideoId = videoId || activeLive?.videoId;

  return {
    videoId: targetVideoId,
    isLive: !!activeLive || videoDetails?.isLive,
    concurrentViewers: activeLive?.concurrentViewers || 0,
    title: activeLive?.title || videoDetails?.title,
    // ✅ FORTRESS: URL protegida com parâmetros de segurança
    embedUrl: targetVideoId ? getFortressYouTubeUrl(targetVideoId, true) : null,
    watchUrl: targetVideoId ? `https://www.youtube.com/watch?v=${targetVideoId}` : null,
    isLoading: currentLiveQuery.isLoading,
    refetch: currentLiveQuery.refetch,
  };
};
