// ============================================
// 📦 CONTEXTS - Barrel Export v2.0
// ============================================
// MIGRAÇÃO: GodMode e Clipboard → Zustand Stores
// Os hooks agora vêm de @/stores para evitar re-renders
// ============================================

export { AppProviders } from './AppProviders';

// ⚡ MIGRADOS PARA ZUSTAND (preferir import de @/stores)
// Re-export para compatibilidade retroativa
export { useGodMode } from '@/stores/godModeStore';
export { useDuplicationClipboard } from '@/stores/clipboardStore';

// Providers legados (ainda funcionam mas NÃO são mais usados no AppProviders)
export { GodModeProvider } from './GodModeContext';
export { DuplicationClipboardProvider } from './DuplicationClipboardContext';

// ⚡ Contexts ainda ativos
export { ReactiveFinanceProvider, useReactiveFinance } from './ReactiveFinanceContext';
export { LiveSheetProvider, useLiveSheet } from './LiveSheetContext';
export { AttachmentProvider, useAttachmentContext, useRegisterEntity } from './AttachmentContext';
