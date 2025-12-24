import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsOptions } from "../_shared/corsConfig.ts";

// Fallback CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const YOUTUBE_API_KEY = Deno.env.get('YOUTUBE_API_KEY');
const CHANNEL_ID = 'UCmoises.profquimica'; // Será substituído pelo ID real

interface YouTubeRequest {
  action: 'channel_stats' | 'videos' | 'video_details' | 'search';
  channelId?: string;
  videoId?: string;
  query?: string;
  maxResults?: number;
}

const handler = async (req: Request): Promise<Response> => {
  // CORS seguro via allowlist
  if (req.method === 'OPTIONS') {
    return handleCorsOptions(req);
  }
  
  const secureHeaders = getCorsHeaders(req);

  try {
    if (!YOUTUBE_API_KEY) {
      throw new Error('YOUTUBE_API_KEY not configured');
    }

    const { action, channelId, videoId, query, maxResults = 10 }: YouTubeRequest = await req.json();
    
    let apiUrl = '';
    const baseUrl = 'https://www.googleapis.com/youtube/v3';

    switch (action) {
      case 'channel_stats':
        // Primeiro, buscar o ID do canal pelo username/handle
        const channelSearchUrl = `${baseUrl}/search?part=snippet&type=channel&q=moises.profquimica&key=${YOUTUBE_API_KEY}`;
        const channelSearchResponse = await fetch(channelSearchUrl);
        const channelSearchData = await channelSearchResponse.json();
        
        let realChannelId = channelId;
        if (channelSearchData.items && channelSearchData.items.length > 0) {
          realChannelId = channelSearchData.items[0].snippet.channelId;
        }
        
        apiUrl = `${baseUrl}/channels?part=statistics,snippet,contentDetails&id=${realChannelId}&key=${YOUTUBE_API_KEY}`;
        break;

      case 'videos':
        // Buscar vídeos do canal
        const searchChannelUrl = `${baseUrl}/search?part=snippet&type=channel&q=moises.profquimica&key=${YOUTUBE_API_KEY}`;
        const searchChannelRes = await fetch(searchChannelUrl);
        const searchChannelData = await searchChannelRes.json();
        
        let targetChannelId = channelId;
        if (searchChannelData.items && searchChannelData.items.length > 0) {
          targetChannelId = searchChannelData.items[0].snippet.channelId;
        }
        
        apiUrl = `${baseUrl}/search?part=snippet&channelId=${targetChannelId}&type=video&order=date&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}`;
        break;

      case 'video_details':
        if (!videoId) throw new Error('videoId is required');
        apiUrl = `${baseUrl}/videos?part=statistics,snippet,contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`;
        break;

      case 'search':
        if (!query) throw new Error('query is required');
        apiUrl = `${baseUrl}/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}`;
        break;

      default:
        throw new Error('Invalid action');
    }

    console.log(`YouTube API request: ${action}`);
    
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.error) {
      console.error('YouTube API error:', data.error);
      throw new Error(data.error.message);
    }

    console.log(`YouTube API response for ${action}:`, JSON.stringify(data).substring(0, 200));

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Error in youtube-api function:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);
