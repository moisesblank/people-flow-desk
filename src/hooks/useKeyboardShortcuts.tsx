import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

const defaultShortcuts: Omit<ShortcutConfig, "action">[] = [
  { key: "d", ctrl: true, shift: true, description: "Ir para Dashboard" },
  { key: "c", ctrl: true, shift: true, description: "Ir para Calendário" },
  { key: "f", ctrl: true, shift: true, description: "Ir para Funcionários" },
  { key: "p", ctrl: true, shift: true, description: "Ir para Pagamentos" },
  { key: "k", ctrl: true, description: "Abrir busca global" },
  { key: "Escape", description: "Fechar modais" },
];

export function useKeyboardShortcuts(
  onSearch?: () => void,
  onEscape?: () => void
) {
  const navigate = useNavigate();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      // Ctrl + K - Global search (works even in inputs)
      if (event.ctrlKey && event.key === "k") {
        event.preventDefault();
        onSearch?.();
        return;
      }

      // Escape - Close modals
      if (event.key === "Escape") {
        onEscape?.();
        return;
      }

      // Skip other shortcuts if in input
      if (isInput) return;

      // Ctrl + Shift + D - Dashboard
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "d") {
        event.preventDefault();
        navigate("/");
        return;
      }

      // Ctrl + Shift + C - Calendar
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "c") {
        event.preventDefault();
        navigate("/calendario");
        return;
      }

      // Ctrl + Shift + F - Employees
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "f") {
        event.preventDefault();
        navigate("/funcionarios");
        return;
      }

      // Ctrl + Shift + P - Payments
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "p") {
        event.preventDefault();
        navigate("/pagamentos");
        return;
      }
    },
    [navigate, onSearch, onEscape]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return { shortcuts: defaultShortcuts };
}
