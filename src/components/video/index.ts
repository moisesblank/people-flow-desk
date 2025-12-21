// ============================================
// 🔥 SISTEMA DE VÍDEO FORTALEZA - EXPORTS
// Todos os componentes de proteção de vídeo
// ============================================

// Wrapper de Proteção (5 Camadas)
export { 
  FortressPlayerWrapper,
  getFortressYouTubeUrl,
  getFortressPandaUrl,
  FORTRESS_PLAYER_VARS
} from "./FortressPlayerWrapper";

// Player Completo com Controles Customizados
export { 
  FortressVideoPlayer,
  type FortressVideoPlayerProps 
} from "./FortressVideoPlayer";

// Wrapper de Proteção Básico (legado)
export { 
  ProtectedVideoWrapper,
  getProtectedYouTubeUrl,
  PROTECTED_PLAYER_VARS
} from "./ProtectedVideoWrapper";

// ============================================
// GUIA DE USO
// ============================================
/**
 * 🔥 FORTRESS VIDEO PLAYER (RECOMENDADO)
 * Player completo com todas as proteções + controles customizados
 * 
 * import { FortressVideoPlayer } from "@/components/video";
 * 
 * <FortressVideoPlayer
 *   videoId="dQw4w9WgXcQ"
 *   type="youtube"
 *   title="Meu Vídeo"
 *   showWatermark
 *   userData={{ nome: "João", cpf: "12345678901" }}
 * />
 * 
 * ─────────────────────────────────────────────
 * 
 * 🛡️ FORTRESS PLAYER WRAPPER
 * Apenas as proteções (para players customizados)
 * 
 * import { FortressPlayerWrapper } from "@/components/video";
 * 
 * <FortressPlayerWrapper showWatermark userData={...}>
 *   <iframe src="..." />
 * </FortressPlayerWrapper>
 * 
 */
