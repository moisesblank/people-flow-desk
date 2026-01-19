// ============================================
// HOOK: INICIALIZADOR DE TEMA v2.2
// Carrega tema salvo do usuário APENAS em áreas protegidas
// Fora de /alunos ou /gestaofc → SEMPRE "dark"
// P0 FIX: Simplificado para evitar conflitos com next-themes
// ============================================

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

/**
 * Verifica se a rota atual é uma área protegida onde
 * a preferência de tema do usuário deve ser respeitada
 */
function isProtectedThemeArea(pathname: string): boolean {
  return (
    pathname.startsWith('/alunos') || 
    pathname.startsWith('/gestaofc') || 
    pathname.startsWith('/primeiro-acesso')
  );
}

/**
 * Hook que gerencia o tema:
 * - Áreas protegidas (/alunos, /gestaofc) + usuário logado → carrega preferência
 * - Qualquer outra rota → força tema "dark"
 * 
 * NOTA: Usa window.location.pathname pois é chamado fora do Router
 */
export function useThemeInitializer() {
  const { user } = useAuth();
  const { setTheme, theme } = useTheme();
  const hasInitialized = useRef(false);
  const lastPath = useRef<string>('');

  useEffect(() => {
    // Usa window.location pois este hook roda fora do Router
    const currentPath = window.location.pathname;
    const isProtected = isProtectedThemeArea(currentPath);
    const pathChanged = lastPath.current !== currentPath;
    lastPath.current = currentPath;

    // 🎯 REGRA PRINCIPAL:
    // Fora de área protegida → SEMPRE tema "dark"
    if (!isProtected) {
      if (theme !== 'dark') {
        console.log('[ThemeInitializer] 🌐 Rota pública - forçando tema dark');
        setTheme('dark');
      }
      hasInitialized.current = false; // Reset para quando voltar
      return;
    }

    // 🔐 Área protegida - mas sem usuário → manter dark
    if (!user?.id) {
      if (theme !== 'dark') {
        setTheme('dark');
      }
      return;
    }

    // 🔐 Área protegida + usuário logado → carregar preferência
    // Só carrega uma vez por sessão (ou quando muda de rota pública → protegida)
    if (hasInitialized.current && !pathChanged) return;

    const loadSavedTheme = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('preferences')
          .eq('id', user.id)
          .maybeSingle();

        if (error) {
          console.warn('[ThemeInitializer] Erro ao carregar preferências:', error);
          return;
        }

        if (data?.preferences && typeof data.preferences === 'object') {
          const prefs = data.preferences as { theme?: string };
          if (prefs.theme && ['light', 'dark'].includes(prefs.theme)) {
            // Só aplica se diferente do atual
            if (prefs.theme !== theme) {
              console.log('[ThemeInitializer] 🎨 Área protegida - aplicando tema do usuário:', prefs.theme);
              setTheme(prefs.theme);
            }
            hasInitialized.current = true;
          }
        }
      } catch (err) {
        console.warn('[ThemeInitializer] Erro inesperado:', err);
      }
    };

    loadSavedTheme();
  }, [user?.id, setTheme, theme]);
}
