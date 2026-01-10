// ============================================
// 🐼 PANDA VIDEO — CONFIGURAÇÃO CANÔNICA
// Fonte única de verdade para Library ID e geração de embed URLs
// ============================================

export const PANDA_LIBRARY_ID = "c3e3c21e-7ce";

export type PandaEmbedParams = URLSearchParams | Record<string, string | number | boolean | null | undefined>;

export function getPandaEmbedUrl(videoId: string, params?: PandaEmbedParams): string {
  if (!params) {
    return `https://player-vz-${PANDA_LIBRARY_ID}.tv.pandavideo.com.br/embed/?v=${videoId}`;
  }

  const searchParams = params instanceof URLSearchParams
    ? params
    : new URLSearchParams(
        Object.entries(params)
          .filter(([, v]) => v !== undefined && v !== null)
          .map(([k, v]) => [k, String(v)])
      );

  const qs = searchParams.toString();
  return `https://player-vz-${PANDA_LIBRARY_ID}.tv.pandavideo.com.br/embed/?v=${videoId}${qs ? `&${qs}` : ""}`;
}
