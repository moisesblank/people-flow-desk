// ============================================
// 📄 PDF PREVIEW CARD v1.1
// Card visual com preview da primeira página do PDF
// Fallback para ícone genérico se não houver preview
// Suporta signed URLs para bucket privado pdf-previews
// ============================================

import React, { memo, useState } from 'react';
import { FileText, Loader2, AlertCircle, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { usePreviewSignedUrl } from '@/hooks/usePreviewSignedUrl';

// ============================================
// TIPOS
// ============================================

export interface PdfPreviewCardProps {
  /** URL da preview (imagem da primeira página) */
  previewUrl?: string | null;
  /** Título do documento */
  title: string;
  /** Subtítulo opcional (autor, categoria, etc.) */
  subtitle?: string;
  /** Status da preview */
  previewStatus?: 'pending' | 'processing' | 'ready' | 'error' | 'skipped';
  /** Número de páginas (opcional) */
  pageCount?: number;
  /** Callback ao clicar no card */
  onClick?: () => void;
  /** Classes CSS adicionais */
  className?: string;
  /** Tamanho do card */
  size?: 'sm' | 'md' | 'lg';
  /** Mostrar badge de status */
  showStatusBadge?: boolean;
}

// ============================================
// CONSTANTES
// ============================================

const SIZE_CONFIG = {
  sm: {
    card: 'w-32',
    preview: 'h-40',
    title: 'text-xs',
    subtitle: 'text-[10px]',
    icon: 'w-8 h-8',
  },
  md: {
    card: 'w-48',
    preview: 'h-56',
    title: 'text-sm',
    subtitle: 'text-xs',
    icon: 'w-12 h-12',
  },
  lg: {
    card: 'w-64',
    preview: 'h-72',
    title: 'text-base',
    subtitle: 'text-sm',
    icon: 'w-16 h-16',
  },
};

// ============================================
// COMPONENTE: FallbackIcon
// ============================================

const FallbackIcon = memo(function FallbackIcon({ 
  status, 
  iconSize 
}: { 
  status?: string; 
  iconSize: string;
}) {
  if (status === 'processing') {
    return <Loader2 className={cn(iconSize, 'animate-spin text-primary')} />;
  }
  
  if (status === 'error') {
    return <AlertCircle className={cn(iconSize, 'text-destructive')} />;
  }

  return <FileText className={cn(iconSize, 'text-muted-foreground')} />;
});

// ============================================
// COMPONENTE: StatusBadge
// ============================================

const StatusBadge = memo(function StatusBadge({ 
  status 
}: { 
  status?: string;
}) {
  if (!status || status === 'ready') return null;

  const config = {
    pending: { label: 'Pendente', variant: 'secondary' as const },
    processing: { label: 'Gerando...', variant: 'default' as const },
    error: { label: 'Erro', variant: 'destructive' as const },
    skipped: { label: 'Ignorado', variant: 'outline' as const },
  };

  const { label, variant } = config[status as keyof typeof config] || { label: status, variant: 'secondary' as const };

  return (
    <Badge variant={variant} className="absolute top-2 right-2 text-[10px]">
      {label}
    </Badge>
  );
});

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const PdfPreviewCard = memo(function PdfPreviewCard({
  previewUrl,
  title,
  subtitle,
  previewStatus,
  pageCount,
  onClick,
  className,
  size = 'md',
  showStatusBadge = false,
}: PdfPreviewCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const config = SIZE_CONFIG[size];

  // Gerar signed URL dinamicamente (bucket pdf-previews é privado)
  const { signedUrl, isLoading: isLoadingUrl } = usePreviewSignedUrl(previewUrl);

  const hasValidPreview = signedUrl && previewStatus === 'ready' && !imageError && !isLoadingUrl;

  return (
    <Card
      className={cn(
        config.card,
        'group relative overflow-hidden cursor-pointer transition-all duration-300',
        'hover:shadow-lg hover:scale-[1.02] hover:ring-2 hover:ring-primary/20',
        'bg-card border-border',
        className
      )}
      onClick={onClick}
    >
      {/* Preview Area */}
      <div 
        className={cn(
          config.preview,
          'relative flex items-center justify-center',
          'bg-muted/50 overflow-hidden'
        )}
      >
        {/* Status Badge */}
        {showStatusBadge && <StatusBadge status={previewStatus} />}

        {/* Preview Image */}
        {hasValidPreview ? (
          <>
            {(!imageLoaded || isLoadingUrl) && (
              <Skeleton className="absolute inset-0" />
            )}
            <img
              src={signedUrl}
              alt={`Preview de ${title}`}
              className={cn(
                'w-full h-full object-cover object-top transition-opacity duration-300',
                imageLoaded ? 'opacity-100' : 'opacity-0'
              )}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
            />
          </>
        ) : (
          <FallbackIcon status={previewStatus} iconSize={config.icon} />
        )}

        {/* Hover Overlay */}
        <div 
          className={cn(
            'absolute inset-0 bg-black/60 flex items-center justify-center',
            'opacity-0 group-hover:opacity-100 transition-opacity duration-300'
          )}
        >
          <Eye className="w-8 h-8 text-white" />
        </div>
      </div>

      {/* Info Area */}
      <div className="p-3 space-y-1">
        <h4 
          className={cn(
            config.title,
            'font-medium text-foreground line-clamp-2 leading-tight'
          )}
          title={title}
        >
          {title}
        </h4>

        {subtitle && (
          <p 
            className={cn(
              config.subtitle,
              'text-muted-foreground line-clamp-1'
            )}
          >
            {subtitle}
          </p>
        )}

        {pageCount !== undefined && pageCount > 0 && (
          <p className={cn(config.subtitle, 'text-muted-foreground')}>
            {pageCount} {pageCount === 1 ? 'página' : 'páginas'}
          </p>
        )}
      </div>
    </Card>
  );
});

PdfPreviewCard.displayName = 'PdfPreviewCard';

export default PdfPreviewCard;
