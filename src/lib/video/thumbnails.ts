// ============================================
// 🎬 UNIVERSAL VIDEO THUMBNAILS — YEAR 2300
// Gera URLs de thumbnails para Panda Video e YouTube
// Padrão Netflix: CDN + Lazy Loading + Fallback
// ============================================

/**
 * PANDA VIDEO THUMBNAIL
 * CDN: https://vz-{library_id}.b-cdn.net/{video_id}/thumbnail.jpg
 * Alternativas: thumbnail_0.jpg, thumbnail_1.jpg, thumbnail_2.jpg
 */
const PANDA_LIBRARY_ID = 'd59d6cb7-b9c';
const PANDA_CDN_BASE = `https://vz-${PANDA_LIBRARY_ID}.b-cdn.net`;

/**
 * YOUTUBE THUMBNAIL
 * CDN: https://img.youtube.com/vi/{video_id}/{quality}.jpg
 * Qualidades: maxresdefault (1280x720), hqdefault (480x360), mqdefault (320x180), default (120x90)
 */
const YOUTUBE_CDN_BASE = 'https://img.youtube.com/vi';

export type VideoProvider = 'panda' | 'youtube' | 'unknown';

export interface VideoThumbnailResult {
  url: string;
  provider: VideoProvider;
  fallbackUrl?: string;
}

/**
 * Detecta o provider do vídeo baseado nos campos disponíveis
 */
export function detectVideoProvider(lesson: {
  panda_video_id?: string | null;
  youtube_video_id?: string | null;
  video_url?: string | null;
  video_provider?: string | null;
}): { provider: VideoProvider; videoId: string | null } {
  // 1. Panda Video ID (prioridade máxima)
  if (lesson.panda_video_id) {
    return { provider: 'panda', videoId: lesson.panda_video_id };
  }

  // 2. YouTube Video ID direto
  if (lesson.youtube_video_id) {
    return { provider: 'youtube', videoId: lesson.youtube_video_id };
  }

  // 3. Extrair de video_url
  if (lesson.video_url) {
    const url = lesson.video_url;

    // YouTube patterns
    const ytMatch = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    if (ytMatch) {
      return { provider: 'youtube', videoId: ytMatch[1] };
    }

    // Panda patterns (embed URL)
    const pandaMatch = url.match(
      /pandavideo\.com\.br\/embed\/\?v=([a-f0-9-]{36})/i
    );
    if (pandaMatch) {
      return { provider: 'panda', videoId: pandaMatch[1] };
    }
  }

  return { provider: 'unknown', videoId: null };
}

/**
 * Gera URL de thumbnail para Panda Video
 */
export function getPandaThumbnail(videoId: string): string {
  return `${PANDA_CDN_BASE}/${videoId}/thumbnail.jpg`;
}

/**
 * Gera URL de thumbnail para YouTube
 * @param quality - maxresdefault (HD), hqdefault (HQ), mqdefault (MQ), default (SD)
 */
export function getYouTubeThumbnail(
  videoId: string,
  quality: 'maxresdefault' | 'hqdefault' | 'mqdefault' | 'default' = 'hqdefault'
): string {
  return `${YOUTUBE_CDN_BASE}/${videoId}/${quality}.jpg`;
}

/**
 * FUNÇÃO PRINCIPAL: Gera thumbnail universal para qualquer vídeo
 * Retorna URL do CDN + fallback
 */
export function getUniversalThumbnail(lesson: {
  thumbnail_url?: string | null;
  panda_video_id?: string | null;
  youtube_video_id?: string | null;
  video_url?: string | null;
  video_provider?: string | null;
}): VideoThumbnailResult | null {
  // 1. Se já tem thumbnail manual, usar ela
  if (lesson.thumbnail_url) {
    return {
      url: lesson.thumbnail_url,
      provider: 'unknown',
    };
  }

  // 2. Detectar provider e gerar thumbnail
  const { provider, videoId } = detectVideoProvider(lesson);

  if (!videoId) {
    return null;
  }

  switch (provider) {
    case 'panda':
      return {
        url: getPandaThumbnail(videoId),
        provider: 'panda',
        fallbackUrl: `${PANDA_CDN_BASE}/${videoId}/thumbnail_0.jpg`,
      };

    case 'youtube':
      return {
        url: getYouTubeThumbnail(videoId, 'hqdefault'),
        provider: 'youtube',
        fallbackUrl: getYouTubeThumbnail(videoId, 'mqdefault'),
      };

    default:
      return null;
  }
}

/**
 * Hook-ready: Retorna URL direta ou null
 */
export function getThumbnailUrl(lesson: {
  thumbnail_url?: string | null;
  panda_video_id?: string | null;
  youtube_video_id?: string | null;
  video_url?: string | null;
  video_provider?: string | null;
}): string | null {
  const result = getUniversalThumbnail(lesson);
  return result?.url ?? null;
}
