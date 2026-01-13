// ============================================
// 🎥 VIDEO PROVIDER DETECTION (PATCH-ONLY)
// Centraliza detecção de provider e normalização de entradas
// ============================================

export type VideoProvider = 'panda' | 'youtube' | 'vimeo' | 'unknown';

const PANDA_URL_MARKERS = [
  'pandavideo',
  'player.pandavideo',
  'player-vz',
  'mediadelivery.net',
  'b-cdn.net',
  'iframe.mediadelivery.net',
] as const;

export function isPandaUrl(url?: string | null): boolean {
  if (!url) return false;
  const u = url.toLowerCase();
  return PANDA_URL_MARKERS.some((m) => u.includes(m));
}

export function detectVideoProviderFromUrl(url?: string | null): VideoProvider {
  if (!url) return 'unknown';
  const u = url.toLowerCase();
  if (isPandaUrl(u)) return 'panda';
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
  if (u.includes('vimeo.com') || u.includes('player.vimeo.com')) return 'vimeo';
  return 'unknown';
}

/**
 * ============================================
 * 🛡️ PADRÃO SOBERANO v2400 — DETECÇÃO DE VÍDEO COM GUARD DE INTEGRIDADE
 * ============================================
 * Esta função é o PADRÃO ÚNICO para detecção de tipo de vídeo em todo o sistema.
 * 
 * REGRA DE OURO:
 * Se video_provider = 'panda' MAS panda_video_id está vazio E video_url aponta para YouTube,
 * então tratamos como YOUTUBE (evita player Panda receber URL errada).
 * 
 * DEVE SER USADO EM TODO LUGAR que determina qual player renderizar.
 * ============================================
 */
export interface VideoLessonInput {
  video_provider?: string | null;
  panda_video_id?: string | null;
  youtube_video_id?: string | null;
  video_url?: string | null;
}

export function getVideoTypeWithIntegrityGuard(lesson: VideoLessonInput): 'youtube' | 'panda' | 'vimeo' {
  // ✅ Guard de integridade: se video_provider está marcado como 'panda' mas não há panda_video_id,
  // e o video_url aponta para YouTube, devemos tratar como YouTube.
  if (lesson.video_provider === 'panda') {
    if (!lesson.panda_video_id) {
      const detectedFromUrl = detectVideoProviderFromUrl(lesson.video_url);
      if (detectedFromUrl === 'youtube') return 'youtube';
      if (detectedFromUrl === 'vimeo') return 'vimeo';
    }
    return 'panda';
  }

  if (lesson.video_provider === 'youtube') return 'youtube';
  if (lesson.video_provider === 'vimeo') return 'vimeo';

  // Fallback: tentar identificar por URL (dados legados)
  const providerFromUrl = detectVideoProviderFromUrl(lesson.video_url);
  if (providerFromUrl === 'panda') return 'panda';
  if (providerFromUrl === 'vimeo') return 'vimeo';

  // Fallback: UUID válido em panda_video_id indica Panda
  if (lesson.panda_video_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lesson.panda_video_id)) {
    return 'panda';
  }

  // Default: YouTube
  return 'youtube';
}

export function looksLikeUrl(value?: string | null): boolean {
  return !!value && /^https?:\/\//i.test(value);
}

/**
 * Normaliza um "videoId" de Panda.
 * Aceita tanto UUID (id puro) quanto URL de embed (com ?v=...).
 */
export function normalizePandaVideoId(input: string): string {
  if (!input) return '';

  // Se já for URL, tenta extrair o parâmetro v=...
  if (looksLikeUrl(input)) {
    try {
      const url = new URL(input);
      const v = url.searchParams.get('v');
      if (v) return v;
    } catch {
      // ignore
    }

    const m = input.match(/[?&]v=([^&]+)/i);
    if (m?.[1]) return m[1];
  }

  return input;
}
