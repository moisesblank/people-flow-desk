// ============================================
// LEI CONSTITUCIONAL — MODAIS REDIMENSIONÁVEIS v1.0.0
// Status: VIGENTE E IMUTÁVEL | RETROATIVO E PROSPECTIVO
// ============================================

/**
 * 🏛️ LEI CONSTITUCIONAL DOS MODAIS REDIMENSIONÁVEIS
 * 
 * Esta lei estabelece que TODOS os modais (Dialog, AlertDialog, Sheet)
 * da plataforma DEVEM suportar:
 * 
 * 1. Redimensionamento horizontal (arrastar borda direita)
 * 2. Redimensionamento vertical (arrastar borda inferior)
 * 3. Redimensionamento diagonal (arrastar canto inferior direito)
 * 4. Maximização para viewport completa (botão maximize)
 * 5. Restauração ao tamanho original (botão minimize)
 * 
 * ESCOPO:
 * - Retroativo: Todos os modais existentes
 * - Prospectivo: Todos os modais futuros
 * 
 * IMPLEMENTAÇÃO:
 * - src/components/ui/dialog.tsx — Dialog base redimensionável
 * - src/components/ui/alert-dialog.tsx — AlertDialog base redimensionável
 * - src/components/ui/resizable-dialog.tsx — Legacy (manter compatibilidade)
 */

export const MODAL_CONSTITUTION = {
  version: '1.0.0',
  status: 'VIGENTE_E_IMUTAVEL',
  scope: 'RETROATIVO_E_PROSPECTIVO',
  
  // Requisitos obrigatórios
  MANDATORY_REQUIREMENTS: {
    resizable: {
      horizontal: true,
      vertical: true,
      diagonal: true,
    },
    maximizable: {
      enabled: true,
      behavior: 'EXPAND_TO_FULL_VIEWPORT',
    },
    viewport_constraints: {
      max_width: '95vw',
      max_height: '95vh',
      overflow_policy: 'SCROLL_ONLY_WHEN_NEEDED',
    },
  },
  
  // Defaults de tamanho
  DEFAULT_SIZES: {
    dialog: { width: 500, height: 400 },
    alertDialog: { width: 500, height: 300 },
    sheet: { width: 400, height: '100vh' },
  },
  
  // Tamanhos mínimos
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
