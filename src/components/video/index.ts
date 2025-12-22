// ============================================
// 🔥 VIDEO COMPONENTS - ÍNDICE CENTRAL
// Exporta todos os componentes de vídeo protegidos
// ============================================

// Player ULTRA DEFINITIVO (ANO 2300) - USE ESTE!
export { UltraFortressPlayer } from "./UltraFortressPlayer";
export type { UltraFortressPlayerProps } from "./UltraFortressPlayer";

// Player Fortress (versão anterior)
export { FortressVideoPlayer } from "./FortressVideoPlayer";
export type { FortressVideoPlayerProps } from "./FortressVideoPlayer";

// Wrapper de proteção
export { 
  FortressPlayerWrapper,
  getFortressYouTubeUrl,
  getFortressPandaUrl,
  FORTRESS_PLAYER_VARS 
} from "./FortressPlayerWrapper";

// Wrapper protegido simples
export { 
  ProtectedVideoWrapper,
  getProtectedYouTubeUrl,
  PROTECTED_PLAYER_VARS 
} from "./ProtectedVideoWrapper";

// ============================================
// RECOMENDAÇÃO DE USO:
// 
// 🥇 UltraFortressPlayer - Para aulas/conteúdo pago
//    - Integração completa com backend
//    - Sessão única, heartbeat, violações
//    - Watermark dinâmica com CPF
//    - DRM via Panda Video
//
// 🥈 FortressVideoPlayer - Para vídeos públicos/preview
//    - Proteção frontend apenas
//    - Sem integração com backend
//
// 🥉 FortressPlayerWrapper - Para wrap de qualquer player
//    - Adiciona camadas de proteção
//    - Use com iframes customizados
// ============================================
