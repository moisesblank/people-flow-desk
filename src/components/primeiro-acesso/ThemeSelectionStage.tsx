// ============================================
// ETAPA 2: SELEÇÃO DE TEMA
// Escolha obrigatória entre light/dark/system
// ============================================

import { useState } from "react";
import { motion } from "framer-motion";
import { Sun, Moon, Monitor, Palette, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ThemeSelectionStageProps {
  onComplete: () => void;
}

type ThemeOption = 'light' | 'dark' | 'system';

const THEME_OPTIONS: Array<{
  id: ThemeOption;
  label: string;
  description: string;
  icon: typeof Sun;
  preview: string;
}> = [
  {
    id: 'light',
    label: 'Modo Claro',
    description: 'Interface clara, ideal para ambientes bem iluminados',
    icon: Sun,
    preview: 'bg-white border-gray-200',
  },
  {
    id: 'dark',
    label: 'Modo Escuro',
    description: 'Interface escura, reduz fadiga visual em ambientes escuros',
    icon: Moon,
    preview: 'bg-gray-900 border-gray-700',
  },
  {
    id: 'system',
    label: 'Automático',
    description: 'Segue a configuração do seu dispositivo automaticamente',
    icon: Monitor,
    preview: 'bg-gradient-to-r from-white to-gray-900 border-gray-400',
  },
];

export function ThemeSelectionStage({ onComplete }: ThemeSelectionStageProps) {
  const { user } = useAuth();
  const { setTheme, theme: currentTheme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState<ThemeOption | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleThemeSelect = (themeId: ThemeOption) => {
    setSelectedTheme(themeId);
    setTheme(themeId); // Aplica imediatamente para preview
  };

  const handleConfirm = async () => {
    if (!selectedTheme || !user?.id) return;

    setIsSubmitting(true);

    try {
      // Salvar no perfil
      const { error } = await supabase
        .from('profiles')
        .update({
          preferences: {
            theme: selectedTheme,
            language: 'pt-BR',
            notifications: true,
          },
        })
        .eq('id', user.id);

      if (error) {
        console.error('[ThemeSelection] Erro ao salvar:', error);
        toast.error('Erro ao salvar preferência');
        return;
      }

      toast.success(`Tema "${THEME_OPTIONS.find(t => t.id === selectedTheme)?.label}" aplicado!`);
      onComplete();

    } catch (err) {
      console.error('[ThemeSelection] Erro inesperado:', err);
      toast.error('Erro ao salvar preferência');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
          <Palette className="w-4 h-4" />
          Personalização
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Escolha seu Tema
        </h2>
        <p className="text-muted-foreground">
          Como você prefere visualizar a plataforma?
        </p>
      </div>

      {/* Theme options */}
      <div className="grid gap-4 mb-8">
        {THEME_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedTheme === option.id;

          return (
            <motion.button
              key={option.id}
              onClick={() => handleThemeSelect(option.id)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className={`relative w-full p-6 rounded-2xl border-2 transition-all text-left ${
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-card hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Preview */}
                <div className={`w-16 h-16 rounded-xl border-2 ${option.preview} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-8 h-8 ${option.id === 'light' ? 'text-yellow-500' : option.id === 'dark' ? 'text-blue-400' : 'text-gray-500'}`} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    {option.label}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {option.description}
                  </p>
                </div>

                {/* Check */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0"
                  >
                    <Check className="w-5 h-5 text-primary-foreground" />
                  </motion.div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Confirm button */}
      <Button
        onClick={handleConfirm}
        disabled={!selectedTheme || isSubmitting}
        className="w-full h-12 text-base"
      >
        {isSubmitting ? (
          <>
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
            Salvando...
          </>
        ) : (
          <>
            Confirmar Tema
          </>
        )}
      </Button>

      {/* Hint */}
      <p className="text-xs text-muted-foreground text-center mt-4">
        Você pode alterar essa preferência depois nas configurações
      </p>
    </div>
  );
}
