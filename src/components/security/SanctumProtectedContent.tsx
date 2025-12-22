// ============================================
// 🛡️ Ω3: SANCTUM PROTECTED CONTENT WRAPPER v2.0
// PROTEÇÃO VISUAL + ANTI-CÓPIA + BLUR GRADUAL
// ============================================

import React, { memo, useEffect, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { AlertTriangle, Lock, ShieldAlert } from 'lucide-react';

// ============================================
// TIPOS
// ============================================

interface SanctumProtectedContentProps {
  children: ReactNode;
  className?: string;
  /** Props legadas para compatibilidade */
  disableRightClick?: boolean;
  disableSelection?: boolean;
  disableCopy?: boolean;
  /** Desabilitar proteção (para owner/admin) */
  disabled?: boolean;
  /** Mostrar indicador de ameaça */
  showThreatIndicator?: boolean;
  /** Score de ameaça externo (opcional) */
  threatScore?: number;
  /** Se deve aplicar blur */
  shouldBlur?: boolean;
  /** Se pode acessar */
  canAccess?: boolean;
  /** Tempo restante de penalidade */
  remainingPenalty?: number;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const SanctumProtectedContent = memo(function SanctumProtectedContent({
  children,
  className,
  disableRightClick = true,
  disableSelection = true,
  disableCopy = true,
  disabled = false,
  showThreatIndicator = false,
  threatScore = 0,
  shouldBlur = false,
  canAccess = true,
  remainingPenalty,
}: SanctumProtectedContentProps) {
  
  // Aplicar estilos anti-cópia globais
  useEffect(() => {
    if (disabled) return;

    const styleId = 'sanctum-protection-styles';
    let style = document.getElementById(styleId) as HTMLStyleElement | null;
    
    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .sanctum-protected {
          -webkit-user-select: none !important;
          -moz-user-select: none !important;
          -ms-user-select: none !important;
          user-select: none !important;
          -webkit-touch-callout: none !important;
        }
        .sanctum-protected img {
          pointer-events: none !important;
          -webkit-user-drag: none !important;
        }
        .sanctum-protected ::selection {
          background: transparent !important;
        }
        .sanctum-blur-overlay {
          backdrop-filter: blur(20px) !important;
          -webkit-backdrop-filter: blur(20px) !important;
        }
        @media print {
          .sanctum-protected {
            display: none !important;
          }
          body::after {
            content: "Impressão não permitida" !important;
            display: block !important;
            font-size: 48px !important;
            text-align: center !important;
            padding: 100px !important;
          }
        }
      `;
      document.head.appendChild(style);
    }

    return () => {
      // Não remover estilo no cleanup para evitar flickering
    };
  }, [disabled]);

  // Se não pode acessar, mostrar tela de bloqueio
  if (!canAccess) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center min-h-[400px] p-8 bg-destructive/5 border border-destructive/20 rounded-lg",
        className
      )}>
        <Lock className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-xl font-bold text-destructive mb-2">
          Acesso Temporariamente Bloqueado
        </h2>
        <p className="text-muted-foreground text-center max-w-md mb-4">
          Atividade suspeita foi detectada. Por segurança, o acesso foi temporariamente restrito.
        </p>
        {remainingPenalty && (
          <p className="text-sm text-muted-foreground">
            Tempo restante: <strong>{remainingPenalty} minutos</strong>
          </p>
        )}
      </div>
    );
  }

  // Se desabilitado, apenas renderizar children
  if (disabled) {
    return <>{children}</>;
  }

  // Calcular nível para indicador
  const threatLevel = threatScore >= 80 ? 'L4_block' 
    : threatScore >= 50 ? 'L3_logout'
    : threatScore >= 30 ? 'L2_blur'
    : threatScore >= 10 ? 'L1_warning'
    : 'none';

  return (
    <div 
      className={cn(
        "sanctum-protected relative",
        disableSelection && "select-none",
        className
      )}
      onContextMenu={(e) => disableRightClick && e.preventDefault()}
      onCopy={(e) => disableCopy && e.preventDefault()}
      onCut={(e) => disableCopy && e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      {/* Conteúdo */}
      <div className={cn(
        "transition-all duration-300",
        shouldBlur && "blur-lg pointer-events-none"
      )}>
        {children}
      </div>

      {/* Overlay de blur */}
      {shouldBlur && (
        <div className="absolute inset-0 sanctum-blur-overlay flex flex-col items-center justify-center z-50 bg-background/80">
          <ShieldAlert className="w-12 h-12 text-amber-500 mb-4 animate-pulse" />
          <p className="text-lg font-semibold text-foreground mb-2">
            Conteúdo Temporariamente Oculto
          </p>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Comportamento incomum detectado. Aguarde alguns segundos.
          </p>
        </div>
      )}

      {/* Indicador de ameaça (opcional) */}
      {showThreatIndicator && threatLevel !== 'none' && (
        <div className={cn(
          "absolute top-2 right-2 px-2 py-1 rounded text-xs font-mono flex items-center gap-1 z-40",
          threatLevel === 'L1_warning' && "bg-amber-500/20 text-amber-500",
          threatLevel === 'L2_blur' && "bg-orange-500/20 text-orange-500",
          threatLevel === 'L3_logout' && "bg-red-500/20 text-red-500",
          threatLevel === 'L4_block' && "bg-red-700/20 text-red-700",
        )}>
          <AlertTriangle className="w-3 h-3" />
          <span>{threatScore}</span>
        </div>
      )}
    </div>
  );
});

SanctumProtectedContent.displayName = "SanctumProtectedContent";

// ============================================
// WATERMARK COMPONENT
// ============================================

interface SanctumWatermarkProps {
  text: string;
  cpf?: string;
  email?: string;
  timestamp?: string;
  sessionId?: string;
  isOwner?: boolean;
  className?: string;
}

export const SanctumWatermark = memo(function SanctumWatermark({
  text,
  cpf,
  email,
  timestamp,
  sessionId,
  isOwner = false,
  className,
}: SanctumWatermarkProps) {
  // Owner não vê watermark
  if (isOwner || !text) return null;

  // Texto completo da watermark (mascarado por segurança)
  const fullText = [
    cpf && `CPF: ${cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.***.**$4')}`,
    email && email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
    timestamp,
    sessionId && `#${sessionId.slice(0, 8)}`,
  ].filter(Boolean).join(' • ') || text;

  return (
    <div 
      className={cn(
        "absolute inset-0 pointer-events-none select-none z-30 overflow-hidden",
        className
      )}
      style={{ 
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
      }}
      aria-hidden="true"
    >
      {/* Grade diagonal de watermarks */}
      <div className="absolute inset-0 grid grid-cols-3 gap-16 p-8 opacity-[0.04]">
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={i}
            className="text-foreground font-mono text-[10px] whitespace-nowrap transform rotate-[-35deg] select-none"
            style={{ letterSpacing: '0.05em' }}
          >
            {fullText}
          </div>
        ))}
      </div>
      
      {/* Watermark central grande */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03]">
        <div 
          className="text-foreground font-mono text-xl whitespace-nowrap transform rotate-[-35deg] select-none tracking-wider"
        >
          {fullText}
        </div>
      </div>

      {/* Watermark invisível (forense) */}
      <div 
        className="absolute opacity-0 text-[1px]"
        style={{ 
          left: '-9999px',
          color: 'rgba(0,0,0,0.001)',
        }}
        data-watermark={btoa(JSON.stringify({ text, cpf, email, timestamp, sessionId }))}
      >
        {fullText}
      </div>
    </div>
  );
});

SanctumWatermark.displayName = "SanctumWatermark";

// ============================================
// EXPORTS
// ============================================

export default SanctumProtectedContent;
