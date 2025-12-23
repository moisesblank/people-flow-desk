// ============================================
// 🌌🔥 SANCTUM PROTECTED CONTENT OMEGA — FORTALEZA ABSOLUTA 🔥🌌
// ANO 2300 — PROTEÇÃO NÍVEL NASA PARA CONTEÚDO PREMIUM
// ESTE É O PROJETO DA VIDA DO MESTRE MOISÉS MEDEIROS
// ============================================
//
// 📍 MAPA DE URLs DEFINITIVO:
//   🌐 NÃO PAGANTE: pro.moisesmedeiros.com.br/ + /comunidade
//   👨‍🎓 ALUNO BETA: pro.moisesmedeiros.com.br/alunos (PAGANTE)
//   👔 FUNCIONÁRIO: gestao.moisesmedeiros.com.br/gestao
//   👑 OWNER: TODAS (moisesblank@gmail.com = MASTER)
//
// ============================================

import React, { useEffect, memo, useRef, useState, ReactNode } from "react";
import { useSanctumCore } from "@/hooks/useSanctumCore";
import { SanctumWatermark } from "./SanctumWatermark";
import { cn } from "@/lib/utils";
import { Loader2, Shield, Lock, AlertTriangle, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

// ============================================
// TIPOS E INTERFACES
// ============================================
type ResourceType = "pdf" | "web_text" | "image" | "video" | "ebook" | "worksheet";

interface ProtectionConfig {
  watermark: boolean;
  blockCopy: boolean;
  blockPrint: boolean;
  blockDevTools: boolean;
  blockDrag: boolean;
  blockSelection: boolean;
  blockContextMenu: boolean;
  blurOnInactive: boolean;
  showLoadingState: boolean;
  showSecurityBadge: boolean;
}

interface SanctumProtectedContentProps {
  resourceId?: string;
  resourceType?: ResourceType;
  children: React.ReactNode;
  config?: Partial<ProtectionConfig>;
  className?: string;
  onAccessGranted?: () => void;
  onAccessDenied?: (reason: string) => void;
  fallback?: React.ReactNode;
  loading?: boolean;
  // Props legadas para compatibilidade
  disableRightClick?: boolean;
  disableSelection?: boolean;
  disableCopy?: boolean;
  disabled?: boolean;
  showThreatIndicator?: boolean;
  threatScore?: number;
  shouldBlur?: boolean;
  canAccess?: boolean;
  remainingPenalty?: number;
}

// ============================================
// CONFIGURAÇÃO PADRÃO
// ============================================
const DEFAULT_CONFIG: ProtectionConfig = {
  watermark: true,
  blockCopy: true,
  blockPrint: true,
  blockDevTools: true,
  blockDrag: true,
  blockSelection: true,
  blockContextMenu: true,
  blurOnInactive: true,
  showLoadingState: true,
  showSecurityBadge: false,
};

// ============================================
// ESTILOS DE PROTEÇÃO CSS-IN-JS
// ============================================
const protectionStyles: React.CSSProperties = {
  userSelect: "none",
  WebkitUserSelect: "none",
  msUserSelect: "none",
  MozUserSelect: "none" as React.CSSProperties["MozUserSelect"],
  WebkitTouchCallout: "none",
  WebkitTapHighlightColor: "transparent",
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const SanctumProtectedContent = memo(({
  resourceId = "default",
  resourceType = "web_text",
  children,
  config: userConfig,
  className,
  onAccessGranted,
  onAccessDenied,
  fallback,
  loading = false,
  // Props legadas
  disableRightClick = true,
  disableSelection = true,
  disableCopy = true,
  disabled = false,
  showThreatIndicator = false,
  threatScore: externalThreatScore,
  shouldBlur: externalShouldBlur,
  canAccess: externalCanAccess = true,
  remainingPenalty,
}: SanctumProtectedContentProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isBlurred, setIsBlurred] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);

  // Mesclar configurações
  const config = { ...DEFAULT_CONFIG, ...userConfig };

  // Hook de segurança
  const {
    registerProtectedSurface,
    isOwner,
    isLocked,
    riskScore,
    sessionId,
  } = useSanctumCore({ resourceId, resourceType });

  // Usar valor externo ou interno
  const effectiveThreatScore = externalThreatScore ?? riskScore;
  const effectiveShouldBlur = externalShouldBlur ?? isBlurred;
  const effectiveCanAccess = externalCanAccess && !isLocked;

  // ============================================
  // VERIFICAÇÃO DE ACESSO
  // ============================================
  useEffect(() => {
    if (disabled) {
      setIsReady(true);
      return;
    }

    const checkAccess = async () => {
      try {
        // Se está bloqueado, negar acesso
        if (isLocked) {
          setAccessError("Sua conta foi temporariamente bloqueada.");
          onAccessDenied?.("locked");
          return;
        }

        // Se risco muito alto, alertar
        if (riskScore > 200 && !isOwner) {
          toast.warning("Atividade suspeita detectada. Por favor, não tente copiar o conteúdo.");
        }

        // Registrar acesso
        registerProtectedSurface();

        // Acesso concedido
        setIsReady(true);
        onAccessGranted?.();
      } catch {
        setAccessError("Erro ao verificar acesso.");
        onAccessDenied?.("error");
      }
    };

    checkAccess();
  }, [disabled, isLocked, isOwner, riskScore, registerProtectedSurface, onAccessGranted, onAccessDenied]);

  // ============================================
  // BLUR QUANDO INATIVO
  // ============================================
  useEffect(() => {
    if (!config.blurOnInactive || isOwner || disabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsBlurred(true);
      } else {
        setTimeout(() => setIsBlurred(false), 500);
      }
    };

    const handleBlur = () => {
      setIsBlurred(true);
    };

    const handleFocus = () => {
      setTimeout(() => setIsBlurred(false), 300);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, [config.blurOnInactive, isOwner, disabled]);

  // ============================================
  // BLOQUEIO DE IMPRESSÃO
  // ============================================
  useEffect(() => {
    if (!config.blockPrint || isOwner || disabled) return;

    const handleBeforePrint = () => {
      if (containerRef.current) {
        containerRef.current.style.visibility = "hidden";
      }
    };

    const handleAfterPrint = () => {
      if (containerRef.current) {
        containerRef.current.style.visibility = "visible";
      }
    };

    window.addEventListener("beforeprint", handleBeforePrint);
    window.addEventListener("afterprint", handleAfterPrint);

    return () => {
      window.removeEventListener("beforeprint", handleBeforePrint);
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, [config.blockPrint, isOwner, disabled]);

  // ============================================
  // HANDLER DE PRINT MEDIA
  // ============================================
  useEffect(() => {
    if (!config.blockPrint || isOwner || disabled) return;

    const style = document.createElement("style");
    style.id = "sanctum-print-block";
    style.textContent = `
      @media print {
        [data-sanctum-protected] {
          display: none !important;
          visibility: hidden !important;
        }
        
        body::after {
          content: "⚠️ IMPRESSÃO BLOQUEADA ⚠️\\A\\AEste conteúdo é protegido por direitos autorais.\\A\\AProf. Moisés Medeiros\\Amoisesmedeiros.com.br";
          display: block !important;
          position: fixed !important;
          top: 50% !important;
          left: 50% !important;
          transform: translate(-50%, -50%) !important;
          font-size: 24px !important;
          text-align: center !important;
          padding: 40px !important;
          color: #dc2626 !important;
          font-weight: bold !important;
          white-space: pre-wrap !important;
          z-index: 999999999 !important;
          background: white !important;
          border: 4px solid #dc2626 !important;
          border-radius: 16px !important;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      const existing = document.getElementById("sanctum-print-block");
      if (existing) {
        existing.remove();
      }
    };
  }, [config.blockPrint, isOwner, disabled]);

  // ============================================
  // RENDER DE ERRO / BLOQUEIO
  // ============================================
  if (accessError || !effectiveCanAccess) {
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
          {accessError || "Atividade suspeita foi detectada. Por segurança, o acesso foi temporariamente restrito."}
        </p>
        {remainingPenalty && (
          <p className="text-sm text-muted-foreground">
            Tempo restante: <strong>{remainingPenalty} minutos</strong>
          </p>
        )}
        {fallback}
      </div>
    );
  }

  // ============================================
  // RENDER DE LOADING
  // ============================================
  if ((loading || !isReady) && config.showLoadingState && !disabled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[200px] p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground">
          Carregando conteúdo protegido...
        </p>
      </div>
    );
  }

  // Se desabilitado, apenas renderizar children
  if (disabled) {
    return <>{children}</>;
  }

  // Calcular nível para indicador
  const threatLevel = effectiveThreatScore >= 80 ? 'L4_block' 
    : effectiveThreatScore >= 50 ? 'L3_logout'
    : effectiveThreatScore >= 30 ? 'L2_blur'
    : effectiveThreatScore >= 10 ? 'L1_warning'
    : 'none';

  // ============================================
  // RENDER PRINCIPAL
  // ============================================
  return (
    <div
      ref={containerRef}
      className={cn(
        "sanctum-protected relative",
        disableSelection && "select-none",
        className
      )}
      style={!isOwner ? protectionStyles : undefined}
      data-sanctum-protected="true"
      data-sanctum-session={sessionId}
      data-sanctum-resource={resourceId}
      onContextMenu={(e) => {
        if ((config.blockContextMenu || disableRightClick) && !isOwner) {
          e.preventDefault();
        }
      }}
      onDragStart={(e) => {
        if (config.blockDrag && !isOwner) {
          e.preventDefault();
        }
      }}
      onCopy={(e) => {
        if ((config.blockCopy || disableCopy) && !isOwner) {
          e.preventDefault();
        }
      }}
      onCut={(e) => {
        if ((config.blockCopy || disableCopy) && !isOwner) {
          e.preventDefault();
        }
      }}
    >
      {/* Badge de segurança */}
      {config.showSecurityBadge && (
        <div className="absolute top-2 right-2 z-50">
          <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-full text-xs text-primary">
            <Shield className="w-3 h-3" />
            Protegido
          </div>
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
          <span>{effectiveThreatScore}</span>
        </div>
      )}

      {/* Watermark dinâmica (não aparece para owner) */}
      {config.watermark && !isOwner && (
        <SanctumWatermark sessionId={sessionId} />
      )}

      {/* Overlay de blur quando inativo */}
      {effectiveShouldBlur && !isOwner && (
        <div 
          className="absolute inset-0 z-40 backdrop-blur-xl bg-background/80 flex items-center justify-center"
          style={{ pointerEvents: "all" }}
        >
          <div className="text-center p-6">
            <ShieldAlert className="w-16 h-16 text-amber-500 mx-auto mb-4 animate-pulse" />
            <p className="text-lg font-semibold text-foreground mb-2">
              Conteúdo Temporariamente Oculto
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Comportamento incomum detectado. Aguarde alguns segundos.
            </p>
          </div>
        </div>
      )}

      {/* Conteúdo protegido */}
      <div className={cn(
        "transition-all duration-300",
        effectiveShouldBlur && !isOwner && "blur-lg pointer-events-none"
      )}>
        {children}
      </div>

      {/* Anti-screenshot overlay (visual noise muito sutil) */}
      {!isOwner && (
        <div
          className="absolute inset-0 pointer-events-none z-30"
          style={{
            background: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0,0,0,0.001) 2px,
              rgba(0,0,0,0.001) 4px
            )`,
            mixBlendMode: "overlay",
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
});

SanctumProtectedContent.displayName = "SanctumProtectedContent";

export default SanctumProtectedContent;
