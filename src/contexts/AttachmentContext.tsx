// ============================================
// CONTEXTO DE ANEXOS AUTOMÁTICOS
// Sistema tipo Elementor - detecta entidades automaticamente
// ============================================

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { EntityType } from '@/hooks/useUniversalAttachments';

interface AttachmentEntity {
  type: EntityType;
  id: string;
  label?: string;
}

interface AttachmentContextType {
  // Entidade ativa para anexos
  activeEntity: AttachmentEntity | null;
  setActiveEntity: (entity: AttachmentEntity | null) => void;
  
  // Registrar entidades da página
  registeredEntities: AttachmentEntity[];
  registerEntity: (entity: AttachmentEntity) => void;
  unregisterEntity: (id: string) => void;
  
  // Modal de anexos
  isAttachmentModalOpen: boolean;
  openAttachmentModal: (entity: AttachmentEntity) => void;
  closeAttachmentModal: () => void;
  
  // Auto-detect mode
  autoDetectEnabled: boolean;
  setAutoDetectEnabled: (enabled: boolean) => void;
}

const AttachmentContext = createContext<AttachmentContextType | undefined>(undefined);

export function AttachmentProvider({ children }: { children: ReactNode }) {
  const [activeEntity, setActiveEntity] = useState<AttachmentEntity | null>(null);
  const [registeredEntities, setRegisteredEntities] = useState<AttachmentEntity[]>([]);
  const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState(false);
  const [autoDetectEnabled, setAutoDetectEnabled] = useState(true);

  const registerEntity = useCallback((entity: AttachmentEntity) => {
    setRegisteredEntities(prev => {
      const exists = prev.find(e => e.id === entity.id && e.type === entity.type);
      if (exists) return prev;
      return [...prev, entity];
    });
  }, []);

  const unregisterEntity = useCallback((id: string) => {
    setRegisteredEntities(prev => prev.filter(e => e.id !== id));
  }, []);

  const openAttachmentModal = useCallback((entity: AttachmentEntity) => {
    setActiveEntity(entity);
    setIsAttachmentModalOpen(true);
  }, []);

  const closeAttachmentModal = useCallback(() => {
    setIsAttachmentModalOpen(false);
    setActiveEntity(null);
  }, []);

  return (
    <AttachmentContext.Provider value={{
      activeEntity,
      setActiveEntity,
      registeredEntities,
      registerEntity,
      unregisterEntity,
      isAttachmentModalOpen,
      openAttachmentModal,
      closeAttachmentModal,
      autoDetectEnabled,
      setAutoDetectEnabled,
    }}>
      {children}
    </AttachmentContext.Provider>
  );
}

export function useAttachmentContext() {
  const context = useContext(AttachmentContext);
  if (!context) {
    throw new Error('useAttachmentContext must be used within AttachmentProvider');
  }
  return context;
}

// Hook para registrar entidades automaticamente
export function useRegisterEntity(type: EntityType, id: string | undefined, label?: string) {
  const { registerEntity, unregisterEntity } = useAttachmentContext();

  React.useEffect(() => {
    if (id) {
      registerEntity({ type, id, label });
      return () => unregisterEntity(id);
    }
  }, [type, id, label, registerEntity, unregisterEntity]);
}
