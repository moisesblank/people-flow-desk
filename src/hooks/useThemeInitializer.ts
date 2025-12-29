// ============================================
// HOOK: INICIALIZADOR DE TEMA
// Carrega tema salvo no perfil do usuário
// ============================================

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook que carrega o tema salvo do usuário na inicialização
 * Deve ser usado uma vez no nível do App
 */
export function useThemeInitializer() {
  const { user } = useAuth();
  const { setTheme, theme } = useTheme();
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Só inicializa uma vez e se tiver usuário
    if (!user?.id || hasInitialized.current) return;

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
          if (prefs.theme && ['light', 'dark', 'system'].includes(prefs.theme)) {
            // Só aplica se diferente do atual
            if (prefs.theme !== theme) {
              console.log('[ThemeInitializer] Aplicando tema salvo:', prefs.theme);
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
