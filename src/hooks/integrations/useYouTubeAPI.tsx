import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface ChannelStats {
  subscriberCount: string;
  viewCount: string;
  videoCount: string;
  title: string;
  description: string;
  thumbnails: any;
}

interface Video {
  id: string;
  title: string;
  description: string;
  thumbnails: any;
  publishedAt: string;
}

export const useYouTubeAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getChannelStats = async (): Promise<ChannelStats | null> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('youtube-api', {
        body: { action: 'channel_stats' },
      });

      if (fnError) throw fnError;
      if (!data.success) throw new Error(data.error);

      const channel = data.data.items?.[0];
      if (!channel) return null;

      return {
        subscriberCount: channel.statistics.subscriberCount,
        viewCount: channel.statistics.viewCount,
        videoCount: channel.statistics.videoCount,
        title: channel.snippet.title,
        description: channel.snippet.description,
        thumbnails: channel.snippet.thumbnails,
      };
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getLatestVideos = async (maxResults: number = 10): Promise<Video[]> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('youtube-api', {
        body: { action: 'videos', maxResults },
      });

      if (fnError) throw fnError;
      if (!data.success) throw new Error(data.error);

      return data.data.items?.map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnails: item.snippet.thumbnails,
        publishedAt: item.snippet.publishedAt,
      })) || [];
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getVideoDetails = async (videoId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('youtube-api', {
        body: { action: 'video_details', videoId },
      });

      if (fnError) throw fnError;
      if (!data.success) throw new Error(data.error);

      return data.data.items?.[0] || null;
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const searchVideos = async (query: string, maxResults: number = 10) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('youtube-api', {
        body: { action: 'search', query, maxResults },
      });

      if (fnError) throw fnError;
      if (!data.success) throw new Error(data.error);

      return data.data.items || [];
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    getChannelStats,
    getLatestVideos,
    getVideoDetails,
    searchVideos,
  };
};
