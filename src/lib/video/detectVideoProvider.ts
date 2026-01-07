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
