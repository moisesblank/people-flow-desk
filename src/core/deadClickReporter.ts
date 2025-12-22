// ============================================
// 🔥🛡️ DEAD CLICK REPORTER — ZERO CLIQUES MORTOS 🛡️🔥
// Sistema de detecção e reporte de cliques sem destino
// ============================================

import { supabase } from "@/integrations/supabase/client";

// ============================================
// TIPOS
// ============================================
export interface DeadClickEvent {
  id?: string;
  element_type: string;
  element_text: string;
  element_selector: string;
  page_url: string;
  page_path: string;
  user_id?: string;
  user_role?: string;
  device_info: string;
  timestamp: string;
  stack_trace?: string;
  component_name?: string;
  action_expected?: string;
  resolved: boolean;
}

export interface ClickValidationResult {
  valid: boolean;
  hasHref: boolean;
  hasOnClick: boolean;
  hasNavigation: boolean;
  hasAction: boolean;
  issues: string[];
}

// ============================================
// CONFIGURAÇÃO
// ============================================
const DEAD_CLICK_CONFIG = {
  enabled: true,
  reportToConsole: true,
  reportToDatabase: true,
  debounceMs: 1000,
  maxReportsPerSession: 50,
  ignoreSelectors: [
    "[data-ignore-dead-click]",
    ".ignore-dead-click",
    "[disabled]",
    "[aria-disabled='true']",
  ],
};

// ============================================
// ESTADO
// ============================================
let reportCount = 0;
let lastReportTime = 0;
const reportedElements = new Set<string>();

// ============================================
// FUNÇÕES DE VALIDAÇÃO
// ============================================

/**
 * Valida se um elemento clicável tem destino válido
 */
export function validateClickableElement(element: HTMLElement): ClickValidationResult {
  const issues: string[] = [];
  
  // Verificar href
  const hasHref = element.hasAttribute("href") && 
                  element.getAttribute("href") !== "#" &&
                  element.getAttribute("href") !== "" &&
                  element.getAttribute("href") !== "javascript:void(0)";
  
  // Verificar onClick
  const hasOnClick = typeof (element as any).onclick === "function" ||
                     element.hasAttribute("onclick") ||
                     element.hasAttribute("data-action");
  
  // Verificar data-navigation
  const hasNavigation = element.hasAttribute("data-route") ||
                        element.hasAttribute("data-nav") ||
                        element.hasAttribute("data-link");
  
  // Verificar data-action
  const hasAction = element.hasAttribute("data-action-key") ||
                    element.hasAttribute("data-function-id");
  
  // Identificar issues
  if (element.tagName === "A" && !hasHref) {
    issues.push("Link sem href válido");
  }
  
  if (element.tagName === "BUTTON" && !hasOnClick && !hasAction) {
    issues.push("Botão sem handler");
  }
  
  if (element.style.cursor === "pointer" && !hasHref && !hasOnClick && !hasNavigation) {
    issues.push("Elemento com cursor pointer sem ação");
  }
  
  const valid = hasHref || hasOnClick || hasNavigation || hasAction || issues.length === 0;
  
  return {
    valid,
    hasHref,
    hasOnClick,
    hasNavigation,
    hasAction,
    issues,
  };
}

/**
 * Gera um seletor único para um elemento
 */
function generateSelector(element: HTMLElement): string {
  const parts: string[] = [];
  let current: HTMLElement | null = element;
  
  while (current && current !== document.body && parts.length < 5) {
    let selector = current.tagName.toLowerCase();
    
    if (current.id) {
      selector = `#${current.id}`;
      parts.unshift(selector);
      break;
    }
    
    if (current.className && typeof current.className === "string") {
      const classes = current.className.split(" ").filter(c => c && !c.includes("hover") && !c.includes("focus")).slice(0, 2);
      if (classes.length > 0) {
        selector += `.${classes.join(".")}`;
      }
    }
    
    parts.unshift(selector);
    current = current.parentElement;
  }
  
  return parts.join(" > ");
}

/**
 * Extrai informações do dispositivo
 */
function getDeviceInfo(): string {
  const ua = navigator.userAgent;
  const isMobile = /Mobile|Android|iPhone|iPad/.test(ua);
  const isTablet = /Tablet|iPad/.test(ua);
  
  return JSON.stringify({
    type: isMobile ? "mobile" : isTablet ? "tablet" : "desktop",
    screen: `${window.screen.width}x${window.screen.height}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    userAgent: ua.substring(0, 200),
  });
}

// ============================================
// FUNÇÕES DE REPORTE
// ============================================

/**
 * Reporta um dead click
 */
export async function reportDeadClick(
  element: HTMLElement,
  validation: ClickValidationResult,
  userId?: string,
  userRole?: string
): Promise<void> {
  if (!DEAD_CLICK_CONFIG.enabled) return;
  
  // Debounce
  const now = Date.now();
  if (now - lastReportTime < DEAD_CLICK_CONFIG.debounceMs) return;
  lastReportTime = now;
  
  // Limite de reports
  if (reportCount >= DEAD_CLICK_CONFIG.maxReportsPerSession) return;
  
  // Ignorar elementos específicos
  const shouldIgnore = DEAD_CLICK_CONFIG.ignoreSelectors.some(selector => 
    element.matches(selector)
  );
  if (shouldIgnore) return;
  
  // Evitar duplicatas
  const selector = generateSelector(element);
  if (reportedElements.has(selector)) return;
  reportedElements.add(selector);
  
  const event: DeadClickEvent = {
    element_type: element.tagName.toLowerCase(),
    element_text: (element.textContent || element.getAttribute("aria-label") || "").substring(0, 100),
    element_selector: selector,
    page_url: window.location.href,
    page_path: window.location.pathname,
    user_id: userId,
    user_role: userRole,
    device_info: getDeviceInfo(),
    timestamp: new Date().toISOString(),
    stack_trace: new Error().stack?.substring(0, 500),
    component_name: element.getAttribute("data-component") || undefined,
    action_expected: element.getAttribute("data-action-key") || element.getAttribute("data-route") || undefined,
    resolved: false,
  };
  
  // Log no console (dev)
  if (DEAD_CLICK_CONFIG.reportToConsole) {
    console.warn("🚨 DEAD CLICK DETECTADO:", {
      element: selector,
      text: event.element_text,
      issues: validation.issues,
      page: event.page_path,
    });
  }
  
  // Salvar no banco
  if (DEAD_CLICK_CONFIG.reportToDatabase) {
    try {
      await supabase.from("dead_click_reports").insert({
        element_type: event.element_type,
        element_text: event.element_text,
        element_selector: event.element_selector,
        page_url: event.page_url,
        page_path: event.page_path,
        user_id: event.user_id,
        user_role: event.user_role,
        device_info: event.device_info,
        component_name: event.component_name,
        action_expected: event.action_expected,
        issues: validation.issues,
        resolved: false,
      });
    } catch (error) {
      // Falha silenciosa — não quebrar a UX por causa do report
      console.debug("Falha ao reportar dead click:", error);
    }
  }
  
  reportCount++;
}

/**
 * Inicializa o listener global de dead clicks
 */
export function initDeadClickDetector(
  userId?: string,
  userRole?: string
): () => void {
  if (!DEAD_CLICK_CONFIG.enabled) return () => {};
  
  const handleClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target) return;
    
    // Verificar se é um elemento clicável
    const clickable = target.closest("a, button, [role='button'], [onclick], [data-action]");
    if (!clickable) return;
    
    const validation = validateClickableElement(clickable as HTMLElement);
    
    if (!validation.valid) {
      reportDeadClick(clickable as HTMLElement, validation, userId, userRole);
    }
  };
  
  // Usar capture para pegar antes dos handlers
  document.addEventListener("click", handleClick, { capture: true });
  
  return () => {
    document.removeEventListener("click", handleClick, { capture: true });
  };
}

/**
 * Audita todos os elementos clicáveis na página atual
 */
export function auditPageClickables(): {
  total: number;
  valid: number;
  invalid: number;
  issues: Array<{ selector: string; issues: string[] }>;
} {
  const clickables = document.querySelectorAll("a, button, [role='button'], [onclick], [data-action], [style*='cursor: pointer']");
  
  let valid = 0;
  let invalid = 0;
  const issues: Array<{ selector: string; issues: string[] }> = [];
  
  clickables.forEach(element => {
    const validation = validateClickableElement(element as HTMLElement);
    
    if (validation.valid) {
      valid++;
    } else {
      invalid++;
      issues.push({
        selector: generateSelector(element as HTMLElement),
        issues: validation.issues,
      });
    }
  });
  
  return {
    total: clickables.length,
    valid,
    invalid,
    issues,
  };
}

/**
 * Reseta os contadores (para testes)
 */
export function resetDeadClickReporter(): void {
  reportCount = 0;
  lastReportTime = 0;
  reportedElements.clear();
}

// ============================================
// EXPORTS
// ============================================
export default {
  validateClickableElement,
  reportDeadClick,
  initDeadClickDetector,
  auditPageClickables,
  resetDeadClickReporter,
  DEAD_CLICK_CONFIG,
};
