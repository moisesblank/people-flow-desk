// ============================================
// MOISÉS MEDEIROS v13.0 - MASTER MODE WRAPPER
// Wrapper global para o sistema de edição MASTER
// Integra todos os componentes de edição em tempo real
// + Menu Contextual (Adicionar, Duplicar, Remover)
// Owner: moisesblank@gmail.com
// ============================================

import { useEffect, useCallback, useState } from 'react';
import { useGodMode } from '@/contexts/GodModeContext';
import { useRealtimeEquivalences } from '@/hooks/useRealtimeEquivalences';
import { useInstantDuplication, useDuplicationListener } from '@/hooks/useInstantDuplication';
import { RealtimeEditOverlay } from './RealtimeEditOverlay';
import { PasteIndicator } from './PasteIndicator';
import { MasterContextMenu } from './MasterContextMenu';
import { MasterAddModal } from './MasterAddModal';
import { EditModeToggle } from '@/components/editor/EditModeToggle';
import { toast } from 'sonner';

interface MasterModeWrapperProps {
  children: React.ReactNode;
}

export function MasterModeWrapper({ children }: MasterModeWrapperProps) {
  const { isOwner, isActive, toggle } = useGodMode();
  const { forceGlobalSync } = useRealtimeEquivalences();
  const { isOwner: canDuplicate } = useInstantDuplication();
  
  // Estado para modal de adicionar
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalType, setAddModalType] = useState<string>('');

  // Listener para abrir modal de adicionar
  useEffect(() => {
    const handleOpenAddModal = (e: CustomEvent) => {
      setAddModalType(e.detail.entityType || 'task');
      setAddModalOpen(true);
    };
    
    window.addEventListener('master-open-add-modal', handleOpenAddModal as EventListener);
    return () => window.removeEventListener('master-open-add-modal', handleOpenAddModal as EventListener);
  }, []);

  // Listener para duplicações - atualizar UI
  useDuplicationListener(useCallback((event) => {
    console.log('🔮 Item duplicado:', event);
    
    // Forçar sync global após duplicação
    forceGlobalSync();
    
    // Scroll para o novo item se possível
    setTimeout(() => {
      const newElement = document.querySelector(`[data-id="${event.newId}"]`);
      if (newElement) {
        newElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        newElement.classList.add('highlight-new');
        setTimeout(() => newElement.classList.remove('highlight-new'), 2000);
      }
    }, 100);
  }, [forceGlobalSync]));

  // Adicionar estilos globais para o modo master
  useEffect(() => {
    const styleId = 'master-mode-global-styles';
    let styleEl = document.getElementById(styleId);
    
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    styleEl.textContent = `
      /* Highlight para novos itens duplicados */
      .highlight-new {
        animation: highlight-pulse 2s ease-out;
        outline: 2px solid hsl(280 80% 50%) !important;
        outline-offset: 2px;
      }
      
      @keyframes highlight-pulse {
        0% {
          background-color: hsl(280 80% 50% / 0.3);
          transform: scale(1.02);
        }
        100% {
          background-color: transparent;
          transform: scale(1);
        }
      }
      
      /* Indicador de elemento editável com data-editable-key */
      [data-editable-key] {
        position: relative;
      }
      
      body.godmode-active [data-editable-key]::before {
        content: attr(data-editable-key);
        position: absolute;
        top: -18px;
        left: 0;
        font-size: 8px;
        background: hsl(280 80% 50%);
        color: white;
        padding: 1px 4px;
        border-radius: 2px;
        opacity: 0;
        transition: opacity 0.2s;
        pointer-events: none;
        z-index: 1000;
      }
      
      body.godmode-active [data-editable-key]:hover::before {
        opacity: 1;
      }
      
      /* Indicador de elemento duplicável */
      [data-duplicable="true"] {
        position: relative;
      }
      
      body.godmode-active [data-duplicable="true"]::after {
        content: '📋';
        position: absolute;
        top: 4px;
        right: 4px;
        font-size: 12px;
        opacity: 0;
        transition: opacity 0.2s;
        pointer-events: none;
      }
      
      body.godmode-active [data-duplicable="true"]:hover::after {
        opacity: 0.7;
      }
      
      /* Animação de loading para elementos reativos */
      .reactive-loading {
        position: relative;
        overflow: hidden;
      }
      
      .reactive-loading::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(
          90deg,
          transparent,
          hsl(280 80% 50% / 0.1),
          transparent
        );
        animation: loading-shimmer 1.5s infinite;
      }
      
      @keyframes loading-shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
      
      /* Transição suave para atualizações */
      [data-reactive] {
        transition: all 0.3s ease-out;
      }
      
      [data-reactive].updating {
        color: hsl(280 80% 50%);
      }
    `;

    return () => {
      styleEl?.remove();
    };
  }, []);

  // Listener de eventos globais
  useEffect(() => {
    const handleGlobalSync = () => {
      console.log('🔄 Sincronização global recebida');
    };

    const handleEquivalenceUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      console.log('📡 Atualização de equivalência:', customEvent.detail);
    };

    window.addEventListener('global-sync', handleGlobalSync);
    window.addEventListener('equivalence-update', handleEquivalenceUpdate);

    return () => {
      window.removeEventListener('global-sync', handleGlobalSync);
      window.removeEventListener('equivalence-update', handleEquivalenceUpdate);
    };
  }, []);

  return (
    <>
      {children}
      
      {/* Botão de toggle do modo master */}
      {isOwner && (
        <EditModeToggle
          isEditMode={isActive}
          canEdit={isOwner}
          onToggle={toggle}
          isGodMode={isActive}
        />
      )}
      
      {/* Overlay de edição em tempo real */}
      <RealtimeEditOverlay />
      
      {/* Menu contextual (clique direito) */}
      <MasterContextMenu />
      
      {/* Modal para adicionar novos itens */}
      <MasterAddModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        entityType={addModalType}
        onSuccess={() => forceGlobalSync()}
      />
      
      {/* Indicador de área de transferência */}
      {canDuplicate && <PasteIndicator />}
    </>
  );
}

// HOC para envolver páginas com funcionalidade de edição
export function withMasterMode<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return function WrappedComponent(props: P) {
    return (
      <MasterModeWrapper>
        <Component {...props} />
      </MasterModeWrapper>
    );
  };
}
