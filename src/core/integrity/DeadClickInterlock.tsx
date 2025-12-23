// ============================================
// 🔥 DEAD CLICK INTERLOCK — ZERO CLIQUES MORTOS
// Listener global que detecta cliques sem data-fn
// DEV/TEST: erro + falha teste
// PROD: auditoria crítica + feedback
// ============================================

import React, { useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// ============================================
// CONFIGURAÇÃO
// ============================================
const IS_DEV = import.meta.env.DEV;
const IS_TEST = import.meta.env.MODE === "test";
const IS_PROD = import.meta.env.PROD;

// Seletores de elementos interativos
const INTERACTIVE_SELECTORS = [
  "a[href]",
  "button",
  "[role='button']",
  "[role='link']",
  "[role='menuitem']",
  "[role='tab']",
  "input[type='submit']",
  "input[type='button']",
  "[onclick]",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

// Elementos a ignorar (UI não-funcional)
const IGNORE_SELECTORS = [
  "[data-fn-ignore]",
  "[data-radix-collection-item]",
  ".lucide", // Ícones
  "[role='presentation']",
  "[aria-hidden='true']",
  "svg",
  ".pointer-events-none",
];

// ============================================
// TIPOS
// ============================================
interface DeadClickEvent {
  element: string;
  tagName: string;
  className: string;
  id: string;
  textContent: string;
  path: string;
  timestamp: string;
  userAgent: string;
}

// ============================================
// DETECTOR DE CLIQUE MORTO
// ============================================
function isInteractiveElement(el: HTMLElement): boolean {
  return el.matches(INTERACTIVE_SELECTORS);
}

function shouldIgnore(el: HTMLElement): boolean {
  // Verificar se elemento ou ancestrais devem ser ignorados
  let current: HTMLElement | null = el;
  while (current) {
    for (const selector of IGNORE_SELECTORS) {
      if (current.matches(selector)) {
        return true;
      }
    }
    current = current.parentElement;
  }
  return false;
}

function hasFnAttribute(el: HTMLElement): boolean {
  // Verificar se elemento ou ancestrais têm data-fn
  let current: HTMLElement | null = el;
  while (current) {
    if (current.hasAttribute("data-fn")) {
      return true;
    }
    current = current.parentElement;
  }
  return false;
}

function getElementDescriptor(el: HTMLElement): DeadClickEvent {
  return {
    element: el.outerHTML.slice(0, 200),
    tagName: el.tagName,
    className: el.className,
    id: el.id,
    textContent: el.textContent?.slice(0, 50) || "",
    path: window.location.pathname,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
  };
}

// ============================================
// HOOK DE INTERLOCK
// ============================================
interface UseDeadClickInterlockOptions {
  enabled?: boolean;
  onDeadClick?: (event: DeadClickEvent) => void;
  throwInDev?: boolean;
}

export function useDeadClickInterlock(options: UseDeadClickInterlockOptions = {}) {
  const { 
    enabled = true, 
    onDeadClick,
    throwInDev = IS_DEV || IS_TEST,
  } = options;
  
  const { user } = useAuth();
  const deadClickCountRef = useRef(0);
  
  const logCriticalDeadClick = useCallback(async (event: DeadClickEvent) => {
    try {
      await supabase.from("audit_logs").insert({
        action: "CRITICAL_DEAD_CLICK",
        table_name: "ui_interlock",
        record_id: event.path,
        metadata: {
          ...event,
          severity: "critical",
          category: "dead_click",
          user_id: user?.id,
        } as import('@/integrations/supabase/types').Json,
        user_id: user?.id,
      });
    } catch (err) {
      console.error("[DeadClickInterlock] Falha ao registrar:", err);
    }
  }, [user?.id]);
  
  const handleClick = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (!target) return;
    
    // Encontrar elemento interativo mais próximo
    const interactive = target.closest(INTERACTIVE_SELECTORS) as HTMLElement | null;
    if (!interactive) return;
    
    // Verificar se deve ignorar
    if (shouldIgnore(interactive)) return;
    
    // Verificar se tem data-fn
    if (!hasFnAttribute(interactive)) {
      const event = getElementDescriptor(interactive);
      deadClickCountRef.current++;
      
      console.warn("[DeadClickInterlock] 🚨 CLIQUE MORTO DETECTADO:", event);
      
      // Callback customizado
      onDeadClick?.(event);
      
      if (IS_PROD) {
        // PROD: auditoria + feedback suave
        logCriticalDeadClick(event);
        
        // Só mostrar toast a cada 3 cliques mortos para não irritar
        if (deadClickCountRef.current % 3 === 1) {
          toast.warning("Esta ação ainda está sendo configurada", {
            description: "Nossa equipe foi notificada",
            duration: 3000,
          });
        }
      } else if (throwInDev) {
        // DEV/TEST: erro explícito
        const errorMsg = `[DEAD CLICK] Elemento interativo sem data-fn: ${interactive.tagName}#${interactive.id || 'no-id'}.${interactive.className || 'no-class'}`;
        
        // Em DEV, apenas console.error para não quebrar a experiência
        console.error(errorMsg, interactive);
        
        // Em TEST, lançar erro para falhar o teste
        if (IS_TEST) {
          throw new Error(errorMsg);
        }
      }
    }
  }, [onDeadClick, throwInDev, logCriticalDeadClick]);
  
  useEffect(() => {
    if (!enabled) return;
    
    // Usar capture para pegar o evento antes de qualquer handler
    document.addEventListener("click", handleClick, { capture: true });
    
    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
    };
  }, [enabled, handleClick]);
  
  return {
    deadClickCount: deadClickCountRef.current,
  };
}

// ============================================
// COMPONENTE PROVIDER
// ============================================
interface DeadClickInterlockProviderProps {
  children: React.ReactNode;
  enabled?: boolean;
  throwInDev?: boolean;
}

export function DeadClickInterlockProvider({ 
  children, 
  enabled = true,
  throwInDev = IS_DEV || IS_TEST,
}: DeadClickInterlockProviderProps) {
  useDeadClickInterlock({ enabled, throwInDev });
  
  return <>{children}</>;
}

// ============================================
// SCAN DE UI (PARA TESTES E DIAGNÓSTICO)
// ============================================
export interface UIScanResult {
  totalInteractive: number;
  withDataFn: number;
  withoutDataFn: number;
  coverage: number;
  violations: Array<{
    element: string;
    tagName: string;
    id: string;
    className: string;
    location: string;
  }>;
}

export function scanUIForDeadClicks(): UIScanResult {
  const allInteractive = document.querySelectorAll(INTERACTIVE_SELECTORS);
  const violations: UIScanResult["violations"] = [];
  let withDataFn = 0;
  let withoutDataFn = 0;
  
  allInteractive.forEach((el) => {
    const htmlEl = el as HTMLElement;
    
    // Ignorar elementos que devem ser ignorados
    if (shouldIgnore(htmlEl)) return;
    
    if (hasFnAttribute(htmlEl)) {
      withDataFn++;
    } else {
      withoutDataFn++;
      violations.push({
        element: htmlEl.outerHTML.slice(0, 100),
        tagName: htmlEl.tagName,
        id: htmlEl.id,
        className: htmlEl.className,
        location: window.location.pathname,
      });
    }
  });
  
  const total = withDataFn + withoutDataFn;
  
  return {
    totalInteractive: total,
    withDataFn,
    withoutDataFn,
    coverage: total > 0 ? (withDataFn / total) * 100 : 100,
    violations,
  };
}

// ============================================
// EXPORTS
// ============================================
export default DeadClickInterlockProvider;
