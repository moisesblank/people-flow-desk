// ============================================
// 🌌🔥 USE SANCTUM OMEGA ULTRA v3.0 🔥🌌
// Hook de Proteção de Conteúdo Nível NASA
// Ano 2300 - Segurança Máxima
// ============================================

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

// ============================================
// CONFIGURAÇÃO SANCTUM OMEGA
// ============================================
export const SANCTUM_OMEGA_CONFIG = {
  version: "3.0-OMEGA-ULTRA",
  
  // P1-2 FIX: Owner verificado via role='owner', não email
  // ownerEmail removido - usar isOwnerByRole()
  
  // P1-2 FIX: Roles imunes (sem 'funcionario' e 'employee' deprecated)
  immuneRoles: ["owner", "admin", "coordenacao", "suporte", "monitoria", "contabilidade", "marketing", "afiliado"] as const,
  
  // Roles com proteção relaxada (apenas log) - todas são imunes agora
  relaxedRoles: [] as const,
  
  // Thresholds de bloqueio progressivo
  thresholds: {
    warning: 50,
    degraded: 100,
    paused: 200,
    locked_30min: 100,
    locked_6h: 200,
    locked_24h: 300,
    locked_48h: 400,
  },
  
  // Severidade por tipo de violação
  severityMap: {
    context_menu: 2,
    copy_attempt: 3,
    print_attempt: 5,
    devtools_open: 10,
    screenshot_attempt: 15,
    screen_recording: 20,
    drag_attempt: 2,
    keyboard_shortcut: 3,
    visibility_abuse: 5,
    iframe_manipulation: 15,
    multiple_sessions: 10,
    invalid_domain: 25,
    network_tampering: 30,
    unknown: 5,
  } as Record<string, number>,
  
  // TTL da URL assinada em segundos
  signedUrlTTL: 120,
  
  // Intervalo de refresh (80% do TTL)
  refreshInterval: 96000, // 96 segundos
  
  // Bucket transmutado
  transmutedBucket: "ena-assets-transmuted",
  
  // Features
  features: {
    watermarkEnabled: true,
    violationReporting: true,
    devToolsDetection: true,
    screenshotProtection: true,
    printBlocking: true,
    copyBlocking: true,
    contextMenuBlocking: true,
  },
};

// ============================================
// TIPOS
// ============================================
export interface SanctumAssetPage {
  page: number;
  url: string;
  width?: number;
  height?: number;
}

export interface SanctumManifest {
  success: boolean;
  assetId: string;
  title: string;
  description?: string;
  totalPages: number;
  pages: SanctumAssetPage[];
  watermarkSeed: string;
  expiresAt: string;
  isOwner: boolean;
  error?: string;
  errorCode?: string;
}

export interface SanctumState {
  isLoading: boolean;
  isAuthorized: boolean;
  isImmune: boolean;
  isLocked: boolean;
  manifest: SanctumManifest | null;
  error: string | null;
  errorCode: string | null;
  currentPage: number;
  riskScore: number;
}

export interface UseSanctumOmegaReturn extends SanctumState {
  // Actions
  loadAsset: (assetId: string) => Promise<boolean>;
  refreshUrls: () => Promise<boolean>;
  reportViolation: (type: string, metadata?: Record<string, unknown>) => Promise<void>;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
  
  // Getters
  getCurrentPageUrl: () => string | null;
  getWatermarkText: () => string;
  getProtectionLevel: () => "none" | "relaxed" | "full";
}

// ============================================
// FUNÇÕES UTILITÁRIAS
// ============================================
/**
 * @deprecated P1-2: Use isOwnerByRole() instead
 * Retorna SEMPRE FALSE por segurança
 */
function isOwnerEmail(_email?: string | null): boolean {
  return false; // P1-2 SECURITY: Nunca usar email para verificar owner
}

/**
 * ✅ Verificação segura de owner via role
 */
function isOwnerByRole(role?: string | null): boolean {
  return role === 'owner';
}

function isImmuneRole(role?: string | null): boolean {
  if (!role) return false;
  // P1-2 FIX: Remover 'employee' e 'funcionario' (deprecated)
  const IMMUNE_ROLES = ['owner', 'admin', 'coordenacao', 'suporte', 'monitoria', 'contabilidade', 'marketing', 'afiliado'];
  return IMMUNE_ROLES.includes(role);
}

function isRelaxedRole(role?: string | null): boolean {
  if (!role) return false;
  return (SANCTUM_OMEGA_CONFIG.relaxedRoles as readonly string[]).includes(role);
}

function generateWatermarkText(user: any, seed: string): string {
  const now = new Date();
  const timestamp = now.toLocaleString("pt-BR", { 
    day: "2-digit", 
    month: "2-digit", 
    hour: "2-digit", 
    minute: "2-digit" 
  });
  
  const name = user?.user_metadata?.nome || user?.email?.split("@")[0] || "Anon";
  const emailMasked = user?.email?.replace(/(.{2}).*(@.*)/, "$1***$2") || "***";
  const seedShort = seed?.slice(0, 8) || "00000000";
  
  return `${name} • ${emailMasked} • ${timestamp} • #${seedShort}`;
}

// ============================================
// HOOK PRINCIPAL
// ============================================
export function useSanctumOmega(): UseSanctumOmegaReturn {
  const { user, role } = useAuth();
  
  // State
  const [state, setState] = useState<SanctumState>({
    isLoading: false,
    isAuthorized: false,
    isImmune: false,
    isLocked: false,
    manifest: null,
    error: null,
    errorCode: null,
    currentPage: 1,
    riskScore: 0,
  });
  
  // Refs
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentAssetIdRef = useRef<string | null>(null);
  const violationCountRef = useRef<number>(0);
  
  // Compute immunity - P1-2 FIX: Preferir role-based check
  const isImmune = useMemo(() => {
    // 1. Primeiro: verificar role (fonte da verdade)
    if (isOwnerByRole(role)) return true;
    if (isImmuneRole(role)) return true;
    // 2. Fallback: email (apenas UX bypass, não segurança)
    if (isOwnerEmail(user?.email)) return true;
    return false;
  }, [user?.email, role]);
  
  const isRelaxed = useMemo(() => {
    if (isImmune) return true;
    return isRelaxedRole(role);
  }, [isImmune, role]);
  
  // Get protection level
  const getProtectionLevel = useCallback((): "none" | "relaxed" | "full" => {
    if (isImmune) return "none";
    if (isRelaxed) return "relaxed";
    return "full";
  }, [isImmune, isRelaxed]);
  
  // ============================================
  // LOAD ASSET
  // ============================================
  const loadAsset = useCallback(async (assetId: string): Promise<boolean> => {
    if (!user?.id) {
      setState(prev => ({ ...prev, error: "Não autenticado", errorCode: "UNAUTHORIZED" }));
      return false;
    }
    
    setState(prev => ({ ...prev, isLoading: true, error: null, errorCode: null }));
    currentAssetIdRef.current = assetId;
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Sessão inválida");
      }
      
      const response = await supabase.functions.invoke("sanctum-asset-manifest", {
        body: { assetId },
      });
      
      if (response.error) {
        console.error("[Sanctum] Edge function error:", response.error);
        throw new Error(response.error.message || "Erro ao carregar asset");
      }
      
      const manifest = response.data as SanctumManifest;
      
      if (!manifest?.success) {
        const errorCode = manifest?.errorCode || "UNKNOWN";
        let errorMsg = manifest?.error || "Erro desconhecido";
        
        if (errorCode === "LOCKED") {
          errorMsg = "Sua conta está temporariamente bloqueada por atividade suspeita.";
          setState(prev => ({ 
            ...prev, 
            isLoading: false, 
            isLocked: true, 
            error: errorMsg, 
            errorCode 
          }));
          return false;
        }
        
        setState(prev => ({ 
          ...prev, 
          isLoading: false, 
          error: errorMsg, 
          errorCode 
        }));
        return false;
      }
      
      // Success
      setState(prev => ({
        ...prev,
        isLoading: false,
        isAuthorized: true,
        isImmune: manifest.isOwner || isImmune,
        manifest,
        currentPage: 1,
        error: null,
        errorCode: null,
      }));
      
      // Setup refresh timer + PATCH-022: jitter anti-herd (0-10s)
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
      
      const jitter = Math.floor(Math.random() * 10000);
      refreshTimerRef.current = setInterval(() => {
        refreshUrls();
      }, SANCTUM_OMEGA_CONFIG.refreshInterval + jitter);
      
      console.log("[Sanctum] Asset loaded successfully:", assetId, "Pages:", manifest.totalPages);
      return true;
      
    } catch (err: any) {
      console.error("[Sanctum] Load error:", err);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err.message || "Erro ao carregar conteúdo",
        errorCode: "LOAD_ERROR",
      }));
      return false;
    }
  }, [user?.id, isImmune]);
  
  // ============================================
  // REFRESH URLS
  // ============================================
  const refreshUrls = useCallback(async (): Promise<boolean> => {
    const assetId = currentAssetIdRef.current;
    if (!assetId || !user?.id) return false;
    
    console.log("[Sanctum] Refreshing signed URLs...");
    return loadAsset(assetId);
  }, [loadAsset, user?.id]);
  
  // ============================================
  // REPORT VIOLATION
  // ============================================
  const reportViolation = useCallback(async (
    type: string, 
    metadata?: Record<string, unknown>
  ): Promise<void> => {
    // Owner bypass
    if (isImmune) {
      console.log("[Sanctum] Violation bypassed (immune):", type);
      return;
    }
    
    const severity = SANCTUM_OMEGA_CONFIG.severityMap[type] || 5;
    violationCountRef.current += 1;
    
    // Relaxed mode: apenas log local
    if (isRelaxed) {
      console.log("[Sanctum] Violation logged (relaxed):", type, severity);
      return;
    }
    
    try {
      const response = await supabase.functions.invoke("sanctum-report-violation", {
        body: {
          violationType: type,
          severity,
          assetId: currentAssetIdRef.current,
          metadata: {
            ...metadata,
            localViolationCount: violationCountRef.current,
            userAgent: navigator.userAgent,
            url: window.location.href,
          },
        },
      });
      
      if (response.data?.locked) {
        setState(prev => ({ ...prev, isLocked: true }));
        toast.error("Acesso bloqueado", {
          description: "Atividade suspeita detectada. Aguarde alguns minutos.",
        });
      } else if (severity >= 10) {
        toast.warning("Ação registrada", {
          description: "Esta ação foi registrada por motivos de segurança.",
        });
      }
      
      setState(prev => ({ 
        ...prev, 
        riskScore: prev.riskScore + severity 
      }));
      
    } catch (err) {
      console.error("[Sanctum] Failed to report violation:", err);
    }
  }, [isImmune, isRelaxed]);
  
  // ============================================
  // NAVIGATION
  // ============================================
  const nextPage = useCallback(() => {
    setState(prev => {
      if (!prev.manifest || prev.currentPage >= prev.manifest.totalPages) return prev;
      return { ...prev, currentPage: prev.currentPage + 1 };
    });
  }, []);
  
  const prevPage = useCallback(() => {
    setState(prev => {
      if (prev.currentPage <= 1) return prev;
      return { ...prev, currentPage: prev.currentPage - 1 };
    });
  }, []);
  
  const goToPage = useCallback((page: number) => {
    setState(prev => {
      if (!prev.manifest || page < 1 || page > prev.manifest.totalPages) return prev;
      return { ...prev, currentPage: page };
    });
  }, []);
  
  // ============================================
  // GETTERS
  // ============================================
  const getCurrentPageUrl = useCallback((): string | null => {
    const { manifest, currentPage } = state;
    if (!manifest?.pages?.length) return null;
    
    const page = manifest.pages.find(p => p.page === currentPage);
    return page?.url || null;
  }, [state]);
  
  const getWatermarkText = useCallback((): string => {
    if (isImmune || !state.manifest?.watermarkSeed) return "";
    return generateWatermarkText(user, state.manifest.watermarkSeed);
  }, [user, state.manifest?.watermarkSeed, isImmune]);
  
  // ============================================
  // CLEANUP
  // ============================================
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
      }
    };
  }, []);
  
  // ============================================
  // PROTECTION EFFECTS
  // ============================================
  useEffect(() => {
    if (!state.isAuthorized || isImmune) return;
    
    // Block context menu
    const handleContextMenu = (e: MouseEvent) => {
      if (SANCTUM_OMEGA_CONFIG.features.contextMenuBlocking) {
        e.preventDefault();
        reportViolation("context_menu");
      }
    };
    
    // Block keyboard shortcuts - 🚨 F12/DEVTOOLS LIBERADOS (2026-01-06)
    const handleKeyDown = (e: KeyboardEvent) => {
      const blocked = [
        e.ctrlKey && e.key === "s",
        e.ctrlKey && e.key === "p",
        // e.ctrlKey && e.key === "c", // Copy permitido
        e.ctrlKey && e.key === "u",
        // e.key === "F12", // DevTools permitido
        // e.key === "PrintScreen", // PrintScreen permitido
      ];
      
      if (blocked.some(Boolean)) {
        e.preventDefault();
        reportViolation("keyboard_shortcut", { key: e.key, ctrl: e.ctrlKey });
      }
    };
    
    // Block print
    const handleBeforePrint = () => {
      if (SANCTUM_OMEGA_CONFIG.features.printBlocking) {
        reportViolation("print_attempt");
      }
    };
    
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("beforeprint", handleBeforePrint);
    
    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("beforeprint", handleBeforePrint);
    };
  }, [state.isAuthorized, isImmune, reportViolation]);
  
  // ============================================
  // RETURN
  // ============================================
  return {
    ...state,
    isImmune,
    loadAsset,
    refreshUrls,
    reportViolation,
    nextPage,
    prevPage,
    goToPage,
    getCurrentPageUrl,
    getWatermarkText,
    getProtectionLevel,
  };
}

export default useSanctumOmega;
