// ============================================
// INDICADOR DE ANEXOS
// Badge/contador para mostrar em cards e listas
// ============================================

import { useState, useEffect } from 'react';
import { Paperclip, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { EntityType } from '@/hooks/useUniversalAttachments';
import { cn } from '@/lib/utils';

interface AttachmentIndicatorProps {
  entityType: EntityType;
  entityId: string;
  className?: string;
  showZero?: boolean;
  onClick?: () => void;
}

export function AttachmentIndicator({
  entityType,
  entityId,
  className,
  showZero = false,
  onClick
}: AttachmentIndicatorProps) {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCount() {
      if (!entityId) {
        setCount(0);
        setIsLoading(false);
        return;
      }

      try {
        const { count: total, error } = await supabase
          .from('universal_attachments')
          .select('*', { count: 'exact', head: true })
          .eq('entity_type', entityType)
          .eq('entity_id', entityId);

        if (!error) {
          setCount(total || 0);
        }
      } catch (error) {
        console.error('Error fetching attachment count:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCount();
  }, [entityType, entityId]);

  if (isLoading) {
    return (
      <div className={cn("text-muted-foreground", className)}>
        <Loader2 className="h-3 w-3 animate-spin" />
      </div>
    );
  }

  if (count === 0 && !showZero) {
    return null;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge 
          variant="secondary" 
          className={cn(
            "gap-1 cursor-pointer hover:bg-secondary/80 transition-colors",
            className
          )}
          onClick={onClick}
        >
          <Paperclip className="h-3 w-3" />
          {count}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        {count === 0 ? 'Nenhum anexo' : `${count} anexo${count > 1 ? 's' : ''}`}
      </TooltipContent>
    </Tooltip>
  );
}

// Mini indicador (apenas ícone com badge)
export function AttachmentMiniIndicator({
  entityType,
  entityId,
  className
}: Omit<AttachmentIndicatorProps, 'showZero' | 'onClick'>) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    async function fetchCount() {
      if (!entityId) return;

      try {
        const { count: total } = await supabase
          .from('universal_attachments')
          .select('*', { count: 'exact', head: true })
          .eq('entity_type', entityType)
          .eq('entity_id', entityId);

        setCount(total || 0);
      } catch (error) {
        console.error('Error:', error);
      }
    }

    fetchCount();
  }, [entityType, entityId]);

  if (count === 0) return null;

  return (
    <div className={cn("relative inline-flex", className)}>
      <Paperclip className="h-4 w-4 text-muted-foreground" />
      <span className="absolute -top-1 -right-1 h-4 w-4 text-[10px] font-bold bg-primary text-primary-foreground rounded-full flex items-center justify-center">
        {count > 9 ? '9+' : count}
      </span>
    </div>
  );
}
