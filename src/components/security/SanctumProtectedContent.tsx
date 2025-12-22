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

import React, { useEffect, memo, useRef, useState, useCallback } from "react";
import { useSanctumCore } from "@/hooks/useSanctumCore";
import { SanctumWatermark } from "./SanctumWatermark";
import { cn } from "@/lib/utils";
import { Loader2, Shield, AlertTriangle, Lock } from "lucide-react";
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
  resourceId: string;
  resourceType: ResourceType;
  children: React.ReactNode;
  config?: Partial<ProtectionConfig>;
  className?: string;
  onAccessGranted?: () => void;
  onAccessDenied?: (reason: string) => void;
  fallback?: React.ReactNode;
  loading?: boolean;
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
  MozUserSelect: "none",
  WebkitTouchCallout: "none",
  WebkitTapHighlightColor: "transparent",
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export const SanctumProtectedContent = memo(({
  resourceId,
  resourceType,
  children,
  config: userConfig,
  className,
  onAccessGranted,
  onAccessDenied,
  fallback,
  loading = false,
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

  // ============================================
  // VERIFICAÇÃO DE ACESSO
  // ============================================
  useEffect(() => {
    // Simular verificação de acesso
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
      } catch (err) {
        setAccessError("Erro ao verificar acesso.");
        onAccessDenied?.("error");
      }
    };

    checkAccess();
  }, [isLocked, isOwner, riskScore, registerProtectedSurface, onAccessGranted, onAccessDenied]);

  // ============================================
  // BLUR QUANDO INATIVO
  // ============================================
  useEffect(() => {
    if (!config.blurOnInactive || isOwner) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsBlurred(true);
      } else {
        // Delay para desblur (evita screen capture rápido)
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
  }, [config.blurOnInactive, isOwner]);

  // ============================================
  // BLOQUEIO DE IMPRESSÃO
  // ============================================
  useEffect(() => {
    if (!config.blockPrint || isOwner) return;

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
  }, [config.blockPrint, isOwner]);

  // ============================================
  // HANDLER DE PRINT MEDIA
  // ============================================
  useEffect(() => {
    if (!config.blockPrint || isOwner) return;

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
  }, [config.blockPrint, isOwner]);

  // ============================================
  // RENDER DE ERRO
  // ============================================
  if (accessError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] p-8 bg-destructive/5 rounded-lg border border-destructive/20">
        <Lock className="w-16 h-16 text-destructive mb-4" />
        <h3 className="text-lg font-semibold text-destructive mb-2">Acesso Bloqueado</h3>
        <p className="text-sm text-muted-foreground text-center">{accessError}</p>
        {fallback}
      </div>
    );
  }

  // ============================================
  // RENDER DE LOADING
  // ============================================
  if ((loading || !isReady) && config.showLoadingState) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] p-8">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <p className="text-sm text-muted-foreground">Carregando conteúdo protegido...</p>
      </div>
    );
  }

  // ============================================
  // RENDER PRINCIPAL
  // ============================================
  return (
    <div
      ref={containerRef}
      className={cn(
        "sanctum-protected-surface relative",
        isBlurred && !isOwner && "sanctum-blurred",
        className
      )}
      data-sanctum-protected="true"
      data-sanctum-resource={resourceId}
      data-sanctum-type={resourceType}
      style={{
        ...protectionStyles,
        filter: isBlurred && !isOwner ? "blur(20px)" : undefined,
        transition: "filter 0.3s ease-in-out",
      }}
      onDragStart={(e) => {
        if (config.blockDrag && !isOwner) {
          e.preventDefault();
        }
      }}
      onCopy={(e) => {
        if (config.blockCopy && !isOwner) {
          e.preventDefault();
        }
      }}
      onCut={(e) => {
        if (config.blockCopy && !isOwner) {
          e.preventDefault();
        }
      }}
    >
      {/* Badge de segurança */}
      {config.showSecurityBadge && (
        <div className="absolute top-2 right-2 z-50">
          <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 rounded-full text-xs text-primary">
            <Shield className="w-3 h-3" />
            <span>Protegido</span>
          </div>
        </div>
      )}

      {/* Watermark dinâmica (não aparece para owner) */}
      {config.watermark && !isOwner && (
        <SanctumWatermark sessionId={sessionId} />
      )}

      {/* Overlay de blur quando inativo */}
      {isBlurred && !isOwner && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="text-center p-6">
            <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-3" />
            <p className="text-lg font-medium">Conteúdo oculto</p>
            <p className="text-sm text-muted-foreground mt-1">
              Clique na janela para visualizar
            </p>
          </div>
        </div>
      )}

      {/* Conteúdo protegido */}
      <div className="sanctum-content relative z-10">
        {children}
      </div>

      {/* Anti-screenshot overlay (visual noise muito sutil) */}
      {!isOwner && (
        <div
          className="sanctum-anti-screenshot-overlay"
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: "none",
            zIndex: 30,
            background: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 2px,
              rgba(0,0,0,0.01) 2px,
              rgba(0,0,0,0.01) 4px
            )`,
            mixBlendMode: "multiply",
          }}
        />
      )}
    </div>
  );
});

SanctumProtectedContent.displayName = "SanctumProtectedContent";

export default SanctumProtectedContent;
