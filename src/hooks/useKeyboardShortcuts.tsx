// ============================================
// SYNAPSE v14.0 - KEYBOARD SHORTCUTS
// Atalhos de teclado globais do sistema
// ============================================

import { useEffect, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
  category: "navigation" | "action" | "system";
}

export const KEYBOARD_SHORTCUTS = [
  // Sistema
  { key: "F11", description: "Alternar Tela Cheia", category: "system" as const },
  { key: "E", ctrl: true, shift: true, description: "Ativar/Desativar Modo Master", category: "system" as const },
  { key: "K", ctrl: true, description: "Abrir busca global", category: "system" as const },
  { key: "K", ctrl: true, shift: true, description: "Abrir Command Center", category: "system" as const },
  { key: "Escape", description: "Fechar modais/painéis", category: "system" as const },
  
  // Navegação
  { key: "D", ctrl: true, shift: true, description: "Ir para Dashboard", category: "navigation" as const },
  { key: "C", ctrl: true, shift: true, description: "Ir para Calendário", category: "navigation" as const },
  { key: "F", ctrl: true, shift: true, description: "Ir para Funcionários", category: "navigation" as const },
  { key: "P", ctrl: true, shift: true, description: "Ir para Pagamentos", category: "navigation" as const },
  { key: "M", ctrl: true, shift: true, description: "Ir para Monitoramento", category: "navigation" as const },
  { key: "S", ctrl: true, shift: true, description: "Ir para Simulados", category: "navigation" as const },
  { key: "R", ctrl: true, shift: true, description: "Ir para Relatórios", category: "navigation" as const },
  
  // Ações
  { key: "N", ctrl: true, shift: true, description: "Nova tarefa", category: "action" as const },
  { key: "B", ctrl: true, shift: true, description: "Backup rápido", category: "action" as const },
];

export function useKeyboardShortcuts(
  onSearch?: () => void,
  onEscape?: () => void,
  onCommandCenter?: () => void,
  onNewTask?: () => void
) {
  const navigate = useNavigate();

    const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      // F11 - Toggle Fullscreen (prevent browser default, use custom)
      if (event.key === "F11") {
        event.preventDefault();
        if (document.fullscreenElement) {
          document.exitFullscreen?.();
        } else {
          document.documentElement.requestFullscreen?.();
        }
        return;
      }

      // Ctrl + K - Global search (works even in inputs)
      if (event.ctrlKey && !event.shiftKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onSearch?.();
        return;
      }

      // Ctrl + Shift + K - Command Center
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onCommandCenter?.();
        return;
      }

      // Escape - Close modals
      if (event.key === "Escape") {
        onEscape?.();
        return;
      }

      // Skip other shortcuts if in input
      if (isInput) return;

      // Ctrl + Shift combinations for navigation
      if (event.ctrlKey && event.shiftKey) {
        event.preventDefault();
        const key = event.key.toLowerCase();

        switch (key) {
          case "d":
            // ✅ MATRIZ SUPREMA v2.0.0: Dashboard agora é /gestaofc
            navigate("/gestaofc");
            toast.info("📊 Gestão", { duration: 1500 });
            break;
          case "c":
            navigate("/calendario");
            toast.info("📅 Calendário", { duration: 1500 });
            break;
          case "f":
            navigate("/funcionarios");
            toast.info("👥 Funcionários", { duration: 1500 });
            break;
          case "p":
            navigate("/pagamentos");
            toast.info("💳 Pagamentos", { duration: 1500 });
            break;
          case "m":
            navigate("/monitoramento");
            toast.info("📡 Monitoramento", { duration: 1500 });
            break;
          case "s":
            navigate("/simulados");
            toast.info("🧠 Simulados", { duration: 1500 });
            break;
          case "r":
            navigate("/relatorios");
            toast.info("📈 Relatórios", { duration: 1500 });
            break;
          case "n":
            onNewTask?.();
            break;
          case "b":
            navigate("/configuracoes?tab=backup");
            toast.info("💾 Backup", { duration: 1500 });
            break;
        }
      }
    },
    [navigate, onSearch, onEscape, onCommandCenter, onNewTask]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return { shortcuts: KEYBOARD_SHORTCUTS };
}

// Hook para mostrar overlay de atalhos (? key)
export function useShortcutsOverlay() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "?" && !e.ctrlKey && !e.shiftKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          setIsOpen(prev => !prev);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return { isOpen, setIsOpen };
}


