// ============================================
// LEI CONSTITUCIONAL — MODAIS REDIMENSIONÁVEIS v3.0.0
// Status: VIGENTE E IMUTÁVEL | RETROATIVO E PROSPECTIVO
// ATUALIZADO: 2025-01-05 — DIMENSÃO PADRÃO UNIVERSAL 98vw × 98vh
// ============================================

/**
 * 🏛️ LEI CONSTITUCIONAL DOS MODAIS REDIMENSIONÁVEIS v3.0
 * 
 * REGRA SUPREMA: TODOS os modais (Dialog, AlertDialog, Sheet)
 * DEVEM iniciar com 98vw × 98vh (98% da viewport).
 * 
 * Esta lei estabelece que TODOS os modais da plataforma DEVEM:
 * 
 * 1. Iniciar MAXIMIZADOS por padrão (98vw × 98vh)
 * 2. Suportar redimensionamento horizontal (arrastar borda direita)
 * 3. Suportar redimensionamento vertical (arrastar borda inferior)
 * 4. Suportar redimensionamento diagonal (arrastar canto inferior direito)
 * 5. Permitir minimização para tamanho menor via botão
 * 6. Permitir restauração ao tamanho padrão (98vw × 98vh) via botão
 * 
 * ESCOPO:
 * - Retroativo: Todos os modais existentes
 * - Prospectivo: Todos os modais futuros (obrigatório)
 * 
 * IMPLEMENTAÇÃO (FONTE DA VERDADE):
 * - src/components/ui/dialog.tsx — Dialog base (98vw × 98vh)
 * - src/components/ui/alert-dialog.tsx — AlertDialog base (98vw × 98vh)
 * - src/components/ui/resizable-dialog.tsx — Legacy (herda comportamento)
 * 
 * NOTA: O parâmetro defaultSize é IGNORADO. Todos os modais
 * sempre abrem em 98vw × 98vh, sem exceção.
 */

export const MODAL_CONSTITUTION = {
  version: '3.0.0',
  status: 'VIGENTE_E_IMUTAVEL',
  scope: 'RETROATIVO_E_PROSPECTIVO',
  lastUpdated: '2025-01-05',
  
  // REGRA SUPREMA: Dimensão padrão universal
  UNIVERSAL_DEFAULT: {
    width: '98vw',
    height: '98vh',
    startsMaximized: true,
  },
  
  // Requisitos obrigatórios
  MANDATORY_REQUIREMENTS: {
    resizable: {
      horizontal: true,
      vertical: true,
      diagonal: true,
    },
    maximizable: {
      enabled: true,
      behavior: 'STARTS_MAXIMIZED_98VW_98VH',
    },
    viewport_constraints: {
      max_width: '98vw',
      max_height: '98vh',
      default_width: '98vw',
      default_height: '98vh',
      overflow_policy: 'SCROLL_ONLY_WHEN_NEEDED',
    },
  },
  
  // Tamanhos quando minimizado (fallback)
  MINIMIZED_SIZES: {
    dialog: { width: 800, height: 600 },
    alertDialog: { width: 500, height: 300 },
    sheet: { width: 400, height: '100vh' },
  },
  
  // Tamanhos mínimos absolutos
  MIN_SIZES: {
    dialog: { width: 320, height: 200 },
    alertDialog: { width: 320, height: 180 },
    sheet: { width: 280, height: 200 },
  },
  
  // Componentes afetados
  AFFECTED_COMPONENTS: [
    'src/components/ui/dialog.tsx',
    'src/components/ui/alert-dialog.tsx',
    'src/components/ui/resizable-dialog.tsx',
    // Todos os componentes que usam esses primitivos herdam automaticamente
  ],
  
  // Verificações obrigatórias
  VERIFICATION_CHECKLIST: {
    all_existing_modals_resizable: true,
    all_existing_modals_maximizable: true,
    all_future_modals_inherit_behavior: true,
    no_modal_clips_or_hides_content: true,
  },
  
  // Condições de falha
  FAILURE_CONDITIONS: [
    'Modal com tamanho fixo',
    'Modal sem capacidade de redimensionamento',
    'Conteúdo não visível quando modal é expandido',
    'Handles de resize não funcionais',
    'Botão de maximizar não presente ou não funcional',
  ],
} as const;

// Type exports
export type ModalConstitution = typeof MODAL_CONSTITUTION;
export type ModalSize = { width: number; height: number };
export type ResizeDirection = 'right' | 'bottom' | 'corner';
