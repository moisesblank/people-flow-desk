// ============================================
// 🌌🔥 SANCTUM OMEGA ULTRA - UTILITIES 🔥🌌
// Funções utilitárias de proteção de conteúdo
// Ano 2300 - Segurança Nível NASA
// ============================================

import { supabase } from "@/integrations/supabase/client";

// ============================================
// CONSTANTES
// ============================================
/**
 * @deprecated P1-2 FIX: OWNER_EMAIL removido. 
 * Usar RPC check_is_owner() ou role='owner' para verificações seguras.
 */
// export const OWNER_EMAIL = "moisesblank@gmail.com"; // REMOVIDO - NÃO USAR

export const SANCTUM_BUCKETS = {
  RAW: "ena-assets-raw",
  TRANSMUTED: "ena-assets-transmuted",
} as const;

export const VIOLATION_TYPES = {
  CONTEXT_MENU: "context_menu",
  COPY_ATTEMPT: "copy_attempt",
  PRINT_ATTEMPT: "print_attempt",
  DEVTOOLS_OPEN: "devtools_open",
  SCREENSHOT_ATTEMPT: "screenshot_attempt",
  SCREEN_RECORDING: "screen_recording",
  DRAG_ATTEMPT: "drag_attempt",
  KEYBOARD_SHORTCUT: "keyboard_shortcut",
  VISIBILITY_ABUSE: "visibility_abuse",
  IFRAME_MANIPULATION: "iframe_manipulation",
  MULTIPLE_SESSIONS: "multiple_sessions",
  INVALID_DOMAIN: "invalid_domain",
  NETWORK_TAMPERING: "network_tampering",
} as const;

export const SEVERITY_LEVELS = {
  LOW: 1,
  MEDIUM: 5,
  HIGH: 10,
  CRITICAL: 20,
  EXTREME: 50,
} as const;

// ============================================
// FUNÇÕES DE VERIFICAÇÃO
// ============================================

/**
 * @deprecated P1-2 FIX: Use isOwnerByRole() para verificação segura
 * Esta função retorna SEMPRE FALSE por segurança.
 * A autorização REAL deve vir do banco via user_roles.role='owner'
 */
export function isOwnerEmail(_email?: string | null): boolean {
  // P1-2 SECURITY: Nunca usar email para verificar owner
  return false;
}

/**
 * ✅ Verificação segura de owner via role (preferir esta)
 */
export function isOwnerByRole(role?: string | null): boolean {
  return role === 'owner';
}

/**
 * Verifica se o usuário está bloqueado
 */
export async function checkUserLock(userId: string): Promise<{
  isLocked: boolean;
  lockedUntil?: Date;
  reason?: string;
}> {
  try {
    const { data, error } = await supabase
      .from("sanctum_risk_state")
      .select("locked_until, lock_reason")
      .eq("user_id", userId)
      .single();
    
    if (error && error.code !== "PGRST116") {
      console.error("[Sanctum] Error checking lock:", error);
    }
    
    if (!data?.locked_until) {
      return { isLocked: false };
    }
    
    const lockedUntil = new Date(data.locked_until);
    const isLocked = lockedUntil > new Date();
    
    return {
      isLocked,
      lockedUntil: isLocked ? lockedUntil : undefined,
      reason: isLocked ? data.lock_reason : undefined,
    };
  } catch (err) {
    console.error("[Sanctum] Exception checking lock:", err);
    return { isLocked: false };
  }
}

/**
 * Obtém o score de risco do usuário
 */
export async function getUserRiskScore(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from("sanctum_risk_state")
      .select("risk_score")
      .eq("user_id", userId)
      .single();
    
    if (error && error.code !== "PGRST116") {
      console.error("[Sanctum] Error getting risk score:", error);
    }
    
    return data?.risk_score || 0;
  } catch (err) {
    console.error("[Sanctum] Exception getting risk score:", err);
    return 0;
  }
}

/**
 * Obtém estatísticas do SANCTUM (apenas admin/owner)
 */
export interface SanctumStats {
  totalAssets: number;
  readyAssets: number;
  totalViolations: number;
  violationsToday: number;
  lockedUsers: number;
  highRiskUsers: number;
}

export async function getSanctumStats(): Promise<SanctumStats | null> {
  try {
    const { data, error } = await supabase.rpc("fn_get_sanctum_stats");
    
    if (error) {
      console.error("[Sanctum] Error getting stats:", error);
      return null;
    }
    
    if (!data || typeof data !== 'object') {
      return null;
    }
    
    // Type assertion with validation
    const stats = data as Record<string, unknown>;
    
    return {
      totalAssets: Number(stats.totalAssets) || 0,
      readyAssets: Number(stats.readyAssets) || 0,
      totalViolations: Number(stats.totalViolations) || 0,
      violationsToday: Number(stats.violationsToday) || 0,
      lockedUsers: Number(stats.lockedUsers) || 0,
      highRiskUsers: Number(stats.highRiskUsers) || 0,
    };
  } catch (err) {
    console.error("[Sanctum] Exception getting stats:", err);
    return null;
  }
}

// ============================================
// FUNÇÕES DE PROTEÇÃO
// ============================================

/**
 * Detecta DevTools aberto
 */
export function detectDevTools(): boolean {
  const threshold = 160;
  const widthDiff = window.outerWidth - window.innerWidth > threshold;
  const heightDiff = window.outerHeight - window.innerHeight > threshold;
  
  // Detecção via console timing
  let devtoolsOpen = false;
  const start = performance.now();
  console.log("%c", "font-size:0;padding:0;margin:0;");
  const end = performance.now();
  if (end - start > 100) {
    devtoolsOpen = true;
  }
  
  return widthDiff || heightDiff || devtoolsOpen;
}

/**
 * Gera hash SHA-256 de uma string
 */
export async function sha256Hash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Gera fingerprint do dispositivo (básico)
 */
export async function generateDeviceFingerprint(): Promise<string> {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency || 0,
    navigator.platform,
  ];
  
  const raw = components.join("|");
  return sha256Hash(raw);
}

/**
 * Bloqueia ações de cópia/impressão
 */
export function setupContentProtection(onViolation?: (type: string) => void): () => void {
  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    onViolation?.(VIOLATION_TYPES.CONTEXT_MENU);
  };
  
  const handleKeyDown = (e: KeyboardEvent) => {
    // 🚨 F12/DEVTOOLS LIBERADOS POR ORDEM DO OWNER (2026-01-06)
    const blocked = [
      e.ctrlKey && e.key === "s",
      e.ctrlKey && e.key === "p",
      // e.ctrlKey && e.key === "c", // Copy permitido
      e.ctrlKey && e.key === "u",
      // e.ctrlKey && e.shiftKey && e.key === "I", // DevTools permitido
      // e.key === "F12", // DevTools permitido
      // e.key === "PrintScreen", // PrintScreen permitido
    ];
    
    if (blocked.some(Boolean)) {
      e.preventDefault();
      onViolation?.(VIOLATION_TYPES.KEYBOARD_SHORTCUT);
    }
  };
  
  const handleCopy = (e: ClipboardEvent) => {
    e.preventDefault();
    onViolation?.(VIOLATION_TYPES.COPY_ATTEMPT);
  };
  
  const handleBeforePrint = () => {
    onViolation?.(VIOLATION_TYPES.PRINT_ATTEMPT);
  };
  
  const handleDragStart = (e: DragEvent) => {
    e.preventDefault();
    onViolation?.(VIOLATION_TYPES.DRAG_ATTEMPT);
  };
  
  // Add listeners
  document.addEventListener("contextmenu", handleContextMenu);
  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("copy", handleCopy);
  window.addEventListener("beforeprint", handleBeforePrint);
  document.addEventListener("dragstart", handleDragStart);
  
  // Return cleanup function
  return () => {
    document.removeEventListener("contextmenu", handleContextMenu);
    document.removeEventListener("keydown", handleKeyDown);
    document.removeEventListener("copy", handleCopy);
    window.removeEventListener("beforeprint", handleBeforePrint);
    document.removeEventListener("dragstart", handleDragStart);
  };
}

/**
 * Formata tempo restante de bloqueio
 */
export function formatLockTime(lockedUntil: Date): string {
  const now = new Date();
  const diffMs = lockedUntil.getTime() - now.getTime();
  
  if (diffMs <= 0) return "Desbloqueado";
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes} minutos`;
}

// ============================================
// CSS ANTI-SCREENSHOT
// ============================================
export const antiScreenshotCSS = `
  .sanctum-protected {
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    -webkit-touch-callout: none;
  }
  
  @media print {
    .sanctum-protected {
      display: none !important;
    }
    body::after {
      content: "Impressão não permitida - Conteúdo protegido";
      display: block;
      font-size: 24px;
      text-align: center;
      padding: 50px;
    }
  }
`;

export default {
  // OWNER_EMAIL removido - usar role='owner'
  SANCTUM_BUCKETS,
  VIOLATION_TYPES,
  SEVERITY_LEVELS,
  isOwnerEmail, // deprecated - retorna false
  isOwnerByRole,
  checkUserLock,
  getUserRiskScore,
  getSanctumStats,
  detectDevTools,
  sha256Hash,
  generateDeviceFingerprint,
  setupContentProtection,
  formatLockTime,
  antiScreenshotCSS,
};
