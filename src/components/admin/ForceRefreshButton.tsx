// ============================================
// 🔄 ForceRefreshButton — BOTÃO PARA ADMIN
// Força todos os alunos a receberem refresh
// ============================================

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Check, Loader2 } from 'lucide-react';
import { useForceRefreshAll } from '@/hooks/useAppVersionCheck';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ForceRefreshButtonProps {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showLabel?: boolean;
}

export function ForceRefreshButton({ 
  variant = 'outline', 
  size = 'sm',
  className = '',
  showLabel = true
}: ForceRefreshButtonProps) {
  const { forceRefreshAll } = useForceRefreshAll();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    setSuccess(false);
    
    const result = await forceRefreshAll();
    
    setIsLoading(false);
    
    if (result) {
      setSuccess(true);
      toast.success('Atualização enviada!', {
        description: 'Todos os alunos receberão refresh automático em segundos.',
      });
      
      setTimeout(() => setSuccess(false), 3000);
    } else {
      toast.error('Erro ao enviar atualização', {
        description: 'Tente novamente.',
      });
    }
  };

  const button = (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : success ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <RefreshCw className="h-4 w-4" />
      )}
      {showLabel && (
        <span className="ml-2">
          {isLoading ? 'Enviando...' : success ? 'Enviado!' : 'Atualizar Alunos'}
        </span>
      )}
    </Button>
  );

  if (!showLabel) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {button}
          </TooltipTrigger>
          <TooltipContent>
            <p>Forçar atualização para todos os alunos</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}
