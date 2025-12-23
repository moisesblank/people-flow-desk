// ============================================
// 🔥🛡️ DEAD CLICK REPORTER — ZERO CLIQUES MORTOS 🛡️🔥
// Sistema de detecção e log de cliques inválidos
// ============================================

import { supabase } from "@/integrations/supabase/client";

// ============================================
// TIPOS
// ============================================
export interface DeadClickReport {
  elementTag: string;
  elementId?: string;
  elementClass?: string;
  elementText?: string;
  pagePath: string;
  timestamp: string;
  reason: DeadClickReason;
  userId?: string;
  userRole?: string;
  metadata?: Record<string, unknown>;
}

export type DeadClickReason = 
  | "NO_HANDLER"
  | "INVALID_ROUTE"
  | "ROUTE_NOT_FOUND"
  | "ACCESS_DENIED"
  | "DISABLED_ELEMENT"
  | "COMING_SOON"
  | "BROKEN_LINK"
  | "UNKNOWN";

// ============================================
// CACHE PARA EVITAR SPAM
// ============================================
const reportedClicks = new Map<string, number>();
const REPORT_COOLDOWN_MS = 60000; // 1 minuto entre reports do mesmo elemento

// ============================================
// FUNÇÕES
// ============================================

/**
 * Gera hash único para identificar elemento
 */
function getElementHash(element: HTMLElement): string {
  const tag = element.tagName.toLowerCase();
  const id = element.id || "";
  const classes = element.className?.toString()?.slice(0, 50) || "";
  const text = element.textContent?.slice(0, 20) || "";
  return `${tag}-${id}-${classes}-${text}`;
}

/**
 * Reporta um clique morto (dead click)
 */
export async function reportDeadClick(
  element: HTMLElement,
  reason: DeadClickReason,
  metadata?: Record<string, unknown>
): Promise<void> {
  const hash = getElementHash(element);
  const now = Date.now();
  
  // Verificar cooldown
  const lastReport = reportedClicks.get(hash);
  if (lastReport && now - lastReport < REPORT_COOLDOWN_MS) {
    return; // Já reportado recentemente
  }
  
  reportedClicks.set(hash, now);
  
  const report: DeadClickReport = {
    elementTag: element.tagName.toLowerCase(),
    elementId: element.id || undefined,
    elementClass: element.className?.toString()?.slice(0, 100) || undefined,
    elementText: element.textContent?.slice(0, 50)?.trim() || undefined,
    pagePath: window.location.pathname,
    timestamp: new Date().toISOString(),
    reason,
    metadata,
  };
  
  // Log local para debug
  console.warn(`[DeadClick] ${reason}:`, {
    element: `<${report.elementTag}${report.elementId ? ` id="${report.elementId}"` : ""}>`,
    text: report.elementText,
    path: report.pagePath,
  });
  
  // Tentar salvar no banco (silencioso) - apenas se tabela existir
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("dead_click_reports").insert({
      element_selector: `${report.elementTag}${report.elementId ? `#${report.elementId}` : ""}`,
      element_type: report.elementTag,
      element_text: report.elementText || null,
      page_path: report.pagePath,
      action_expected: report.reason,
      issues: [report.reason],
      metadata: report.metadata || {},
    });
  } catch {
    // Silencioso - tabela pode não existir ainda
  }
}

/**
 * Valida se um elemento clicável tem destino válido
 */
export function validateClickableElement(element: HTMLElement): {
  valid: boolean;
  reason?: DeadClickReason;
} {
  const tag = element.tagName.toLowerCase();
  
  // Links
  if (tag === "a") {
    const href = element.getAttribute("href");
    if (!href || href === "#" || href === "javascript:void(0)") {
      return { valid: false, reason: "BROKEN_LINK" };
    }
  }
  
  // Botões
  if (tag === "button" || element.getAttribute("role") === "button") {
    const disabled = element.hasAttribute("disabled") || element.getAttribute("aria-disabled") === "true";
    if (disabled) {
      return { valid: false, reason: "DISABLED_ELEMENT" };
    }
    
    // Verificar se tem onClick ou form
    const hasForm = element.closest("form");
    const type = element.getAttribute("type");
    if (!hasForm && type !== "submit" && type !== "reset") {
      // Pode ser um botão sem handler - será validado pelo React
    }
  }
  
  return { valid: true };
}

/**
 * Instala listener global para detectar dead clicks
 */
export function installDeadClickDetector(): () => void {
  const handler = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (!target) return;
    
    // Verificar se é elemento interativo
    const interactiveElement = target.closest("button, a, [role='button'], [onclick]");
    if (!interactiveElement) return;
    
    const validation = validateClickableElement(interactiveElement as HTMLElement);
    if (!validation.valid && validation.reason) {
      reportDeadClick(interactiveElement as HTMLElement, validation.reason);
    }
  };
  
  document.addEventListener("click", handler, true);
  
  return () => {
    document.removeEventListener("click", handler, true);
  };
}

/**
 * Hook para usar o dead click detector
 */
export function useDeadClickDetector(): void {
  // O detector é instalado globalmente via App.tsx
}
