// ============================================
// 🔥🛡️ VIDEO COMPONENTS - ÍNDICE CENTRAL 🛡️🔥
// Exporta todos os componentes de vídeo protegidos
// ============================================

// ============================================
// 🏆 OMEGA FORTRESS PLAYER v5.0 (DEFINITIVO)
// O player mais avançado — USE ESTE!
// ============================================
export { OmegaFortressPlayer } from "./OmegaFortressPlayer";

// ============================================
// VERSÕES ANTERIORES (mantidas por compatibilidade)
// ============================================

// Player ULTRA (v4.0 SANCTUM Edition)
export { UltraFortressPlayer } from "./UltraFortressPlayer";
export type { UltraFortressPlayerProps } from "./UltraFortressPlayer";

// Player Fortress (v3.0)
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
// 📊 RECOMENDAÇÃO DE USO (v5.0):
// 
// 🏆 OmegaFortressPlayer (v5.0) - DEFINITIVO
//    ✅ Integração TOTAL com backend SANCTUM
//    ✅ Bypass inteligente para agentes/admins
//    ✅ Detecção GRADUAL (não punitiva)
//    ✅ Watermark dinâmica + anti-crop
//    ✅ Sessão única + heartbeat + violações
//    ✅ DRM via Panda Video
//    ✅ Suporte YouTube como fallback
//
// 🥇 UltraFortressPlayer (v4.0) - SANCTUM Edition
//    - Versão anterior do OMEGA
//    - Ainda funcional, mas prefira OMEGA
//
// 🥈 FortressVideoPlayer (v3.0) - Básico
//    - Proteção frontend apenas
//    - Use para vídeos públicos/preview
//
// 🥉 FortressPlayerWrapper - Wrapper genérico
//    - Adiciona camadas de proteção
//    - Use com iframes customizados
// ============================================
