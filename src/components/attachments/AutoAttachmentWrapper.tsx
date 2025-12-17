// ============================================
// WRAPPER DE ANEXOS AUTOMÁTICOS
// Detecta entidades e adiciona botão de anexo automaticamente
// Funciona como o Elementor - sem necessidade de código manual
// ============================================

import { useState, useEffect, ReactNode } from 'react';
import { Paperclip, Upload, Eye, Sparkles, X, FileText, Image, File } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { UniversalAttachments } from './UniversalAttachments';
import { EntityType } from '@/hooks/useUniversalAttachments';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface AutoAttachmentWrapperProps {
  entityType: EntityType;
  entityId: string | number | undefined;
  entityLabel?: string;
  children: ReactNode;
  className?: string;
  position?: 'top-right' | 'bottom-right' | 'inline' | 'floating';
  showCount?: boolean;
  compact?: boolean;
}

export function AutoAttachmentWrapper({
  entityType,
  entityId,
  entityLabel,
  children,
  className,
  position = 'top-right',
  showCount = true,
  compact = false,
}: AutoAttachmentWrapperProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [attachmentCount, setAttachmentCount] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const stringId = entityId?.toString();

  useEffect(() => {
    async function fetchCount() {
      if (!stringId) return;
      
      try {
        const { count } = await supabase
          .from('universal_attachments')
          .select('*', { count: 'exact', head: true })
          .eq('entity_type', entityType)
          .eq('entity_id', stringId);
        
        setAttachmentCount(count || 0);
      } catch (error) {
        console.error('Error fetching attachment count:', error);
      }
    }

    fetchCount();
  }, [entityType, stringId, isOpen]);

  if (!stringId) return <>{children}</>;

  const positionClasses = {
    'top-right': 'absolute top-2 right-2',
    'bottom-right': 'absolute bottom-2 right-2',
    'inline': 'inline-flex ml-2',
    'floating': 'fixed bottom-4 right-4 z-50',
  };

  const AttachmentButton = () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={attachmentCount > 0 ? "default" : "outline"}
          size={compact ? "icon" : "sm"}
          className={cn(
            "gap-1.5 transition-all",
            attachmentCount > 0 && "bg-primary/90 hover:bg-primary",
            compact && "h-7 w-7"
          )}
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
        >
          <Paperclip className={cn("h-3.5 w-3.5", !compact && "mr-0.5")} />
          {!compact && showCount && (
            <span className="text-xs">{attachmentCount}</span>
          )}
          {compact && attachmentCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full flex items-center justify-center">
              {attachmentCount > 9 ? '9+' : attachmentCount}
            </span>
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {attachmentCount > 0 
          ? `${attachmentCount} anexo${attachmentCount > 1 ? 's' : ''} - Clique para ver`
          : 'Adicionar anexo'
        }
      </TooltipContent>
    </Tooltip>
  );

  return (
    <div 
      className={cn("relative group", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
      
      {/* Attachment Button - aparece no hover ou se tem anexos */}
      <AnimatePresence>
        {(isHovered || attachmentCount > 0 || position === 'inline') && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={cn(
              position !== 'inline' && positionClasses[position],
              position === 'inline' && 'inline-flex'
            )}
          >
            <AttachmentButton />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Anexos */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Paperclip className="h-5 w-5 text-primary" />
              Anexos {entityLabel && `- ${entityLabel}`}
              {attachmentCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {attachmentCount} arquivo{attachmentCount > 1 ? 's' : ''}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[70vh]">
            <UniversalAttachments
              entityType={entityType}
              entityId={stringId}
              onUpdate={() => {
                // Atualiza contagem quando anexos mudam
                supabase
                  .from('universal_attachments')
                  .select('*', { count: 'exact', head: true })
                  .eq('entity_type', entityType)
                  .eq('entity_id', stringId)
                  .then(({ count }) => setAttachmentCount(count || 0));
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Componente de botão inline para usar em tabelas/listas
export function AttachmentButton({
  entityType,
  entityId,
  entityLabel,
  variant = 'ghost',
  size = 'icon',
}: {
  entityType: EntityType;
  entityId: string | number | undefined;
  entityLabel?: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'sm' | 'icon' | 'default';
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [count, setCount] = useState(0);
  const stringId = entityId?.toString();

  useEffect(() => {
    if (!stringId) return;
    
    supabase
      .from('universal_attachments')
      .select('*', { count: 'exact', head: true })
      .eq('entity_type', entityType)
      .eq('entity_id', stringId)
      .then(({ count: total }) => setCount(total || 0));
  }, [entityType, stringId, isOpen]);

  if (!stringId) return null;

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(true);
            }}
            className="relative"
          >
            <Paperclip className="h-4 w-4" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 text-[10px] font-bold bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                {count > 9 ? '9+' : count}
              </span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {count > 0 ? `${count} anexo${count > 1 ? 's' : ''}` : 'Adicionar anexo'}
        </TooltipContent>
      </Tooltip>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Paperclip className="h-5 w-5 text-primary" />
              Anexos {entityLabel && `- ${entityLabel}`}
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[70vh]">
            <UniversalAttachments
              entityType={entityType}
              entityId={stringId}
              onUpdate={() => {
                supabase
                  .from('universal_attachments')
                  .select('*', { count: 'exact', head: true })
                  .eq('entity_type', entityType)
                  .eq('entity_id', stringId)
                  .then(({ count: total }) => setCount(total || 0));
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
