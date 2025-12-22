// ============================================
// 🔥 SISTEMA DE VÍDEO FORTALEZA v3.0 - EXPORTS
// Todos os componentes de proteção de vídeo
// Sistema unificado para 5000+ usuários simultâneos
// ============================================

// ============================================
// 🚀 OMEGA FORTRESS PLAYER (RECOMENDADO)
// Player definitivo com 7 camadas de proteção + SANCTUM 2.0
// ============================================
export { 
  OmegaFortressPlayer,
  type OmegaFortressPlayerProps 
} from "./OmegaFortressPlayer";

// ============================================
// 🛡️ FORTRESS VIDEO PLAYER (LEGADO)
// Player com proteção básica + controles customizados
// ============================================
export { 
  FortressVideoPlayer,
  type FortressVideoPlayerProps 
} from "./FortressVideoPlayer";

// ============================================
// 🔒 FORTRESS PLAYER WRAPPER
// Wrapper de proteção para players customizados
// ============================================
export { 
  FortressPlayerWrapper,
  getFortressYouTubeUrl,
  getFortressPandaUrl,
  FORTRESS_PLAYER_VARS
} from "./FortressPlayerWrapper";

// ============================================
// 📦 PROTECTED VIDEO WRAPPER (BÁSICO)
// Wrapper simples para proteção básica
// ============================================
export { 
  ProtectedVideoWrapper,
  getProtectedYouTubeUrl,
  PROTECTED_PLAYER_VARS
} from "./ProtectedVideoWrapper";

// ============================================
// 📚 GUIA DE USO
// ============================================
/**
 * 🔥 OMEGA FORTRESS PLAYER (PRINCIPAL - USE ESTE!)
 * Player completo com 7 camadas de proteção + SANCTUM 2.0
 * - Sessão única por dispositivo
 * - Heartbeat a cada 30 segundos
 * - Detecção de DevTools, Print Screen, extensões
 * - Watermark dinâmica com nome/CPF
 * - Integração com sistema de roles (owner/admin são imunes)
 * - Suporte a YouTube, Panda Video e Vimeo
 * 
 * import { OmegaFortressPlayer } from "@/components/video";
 * 
 * <OmegaFortressPlayer
 *   videoId="dQw4w9WgXcQ"
 *   type="youtube"
 *   title="Minha Aula"
 *   lessonId="uuid-da-aula"
 *   courseId="uuid-do-curso"
 *   showSecurityBadge
 *   showWatermark
 * />
 * 
 * ─────────────────────────────────────────────
 * 
 * 🛡️ FORTRESS VIDEO PLAYER (LEGADO)
 * Use apenas para compatibilidade com código antigo
 * 
 * import { FortressVideoPlayer } from "@/components/video";
 * 
 * <FortressVideoPlayer
 *   videoId="dQw4w9WgXcQ"
 *   type="youtube"
 *   showWatermark
 *   userData={{ nome: "João", cpf: "12345678901" }}
 * />
 * 
 * ─────────────────────────────────────────────
 * 
 * 🔒 FORTRESS PLAYER WRAPPER
 * Apenas as proteções (para players customizados)
 * 
 * import { FortressPlayerWrapper } from "@/components/video";
 * 
 * <FortressPlayerWrapper showWatermark userData={...}>
 *   <iframe src="..." />
 * </FortressPlayerWrapper>
 * 
 * ─────────────────────────────────────────────
 * 
 * 📊 HIERARQUIA DE PROTEÇÃO:
 * 
 * OMEGA FORTRESS (7 camadas)
 * ├── Camada 1: Sessão Única (anti-compartilhamento)
 * ├── Camada 2: Heartbeat (validação contínua)
 * ├── Camada 3: Watermark Dinâmica (rastreabilidade)
 * ├── Camada 4: Anti-DevTools (F12, Ctrl+Shift+I)
 * ├── Camada 5: Anti-Screenshot (PrintScreen, extensões)
 * ├── Camada 6: Anti-Copy (clique direito, atalhos)
 * └── Camada 7: SANCTUM 2.0 (imunidade por role)
 * 
 * ─────────────────────────────────────────────
 * 
 * 🔐 SANCTUM 2.0 - SISTEMA DE IMUNIDADE:
 * 
 * Roles IMUNES (não sofrem penalidades):
 * - owner
 * - admin
 * - funcionario
 * - suporte
 * - coordenacao
 * 
 * Roles MONITORADOS:
 * - beta (aluno pagante)
 * - aluno_gratuito
 * - viewer
 * 
 * Thresholds de ação:
 * - warn: score >= 30
 * - degrade: score >= 60
 * - pause: score >= 100
 * - revoke: score >= 200 + severidade >= 9
 * 
 */
