// ============================================
// 🎯 FILTRO HIERÁRQUICO DE FLASHCARDS
// Macro → Micro Assuntos (Taxonomia do Banco)
// LEI SUPREMA: Usa useQuestionTaxonomy como FONTE ÚNICA
// Constituição SYNAPSE Ω v10.4
// ============================================

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useQuestionTaxonomy } from '@/hooks/useQuestionTaxonomy';
import { 
  MACRO_VISUAL_CONFIG, 
  DEFAULT_MACRO_VISUAL,
  getMacroVisual 
} from '@/lib/taxonomy/macroVisualConfig';
import {
  ChevronDown,
  ChevronRight,
  Layers,
  X,
} from 'lucide-react';

export type MacroValue = string | 'all';
export type MicroValue = string | null;

interface FlashcardsTaxonomyFilterProps {
  selectedMacro: MacroValue;
  selectedMicro: MicroValue;
  onMacroChange: (macro: MacroValue) => void;
  onMicroChange: (micro: MicroValue) => void;
  macroStats: Map<string, number>;
  microStats: Map<string, number>;
  totalCards: number;
  className?: string;
}

export function FlashcardsTaxonomyFilter({
  selectedMacro,
  selectedMicro,
  onMacroChange,
  onMicroChange,
  macroStats,
  microStats,
  totalCards,
  className
}: FlashcardsTaxonomyFilterProps) {
  const [expandedMacro, setExpandedMacro] = useState<string | null>(null);
  
  // ============================================
  // 🗄️ FONTE ÚNICA DE VERDADE: BANCO DE DADOS
  // ============================================
  const { data: taxonomyData, isLoading } = useQuestionTaxonomy();

  // Construir lista de MACROs a partir do banco
  const macros = useMemo(() => {
    if (!taxonomyData?.tree) return [];
    return taxonomyData.tree.macros.map(m => ({
      value: m.label, // Usa LABEL como value para consistência
      label: m.label,
      visual: getMacroVisual(m.label),
    }));
  }, [taxonomyData]);

  // Obter MICROs do MACRO selecionado
  const getMicrosForMacro = useCallback((macroLabel: string) => {
    if (!taxonomyData?.tree) return [];
    return taxonomyData.tree.getMicros(macroLabel).map(m => ({
      value: m.label, // Usa LABEL como value
      label: m.label,
    }));
  }, [taxonomyData]);

  // Macro config atual (visual)
  const activeMacroConfig = useMemo(() => {
    return macros.find(m => m.value === selectedMacro);
  }, [macros, selectedMacro]);

  // MICROs do macro selecionado
  const activeMicros = useMemo(() => {
    if (selectedMacro === 'all' || !selectedMacro) return [];
    return getMicrosForMacro(selectedMacro);
  }, [selectedMacro, getMicrosForMacro]);

  // Toggle expand/collapse macro
  const handleMacroClick = useCallback((macroValue: string) => {
    if (selectedMacro === macroValue) {
      setExpandedMacro(prev => prev === macroValue ? null : macroValue);
    } else {
      onMacroChange(macroValue as MacroValue);
      onMicroChange(null);
      setExpandedMacro(macroValue);
    }
  }, [selectedMacro, onMacroChange, onMicroChange]);

  // Selecionar micro
  const handleMicroClick = useCallback((microValue: string) => {
    if (selectedMicro === microValue) {
      onMicroChange(null);
    } else {
      onMicroChange(microValue);
    }
  }, [selectedMicro, onMicroChange]);

  // Limpar filtro
  const handleClearFilter = useCallback(() => {
    onMacroChange('all');
    onMicroChange(null);
    setExpandedMacro(null);
  }, [onMacroChange, onMicroChange]);

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header com Filtro Ativo */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Filtrar por Assunto</span>
        </div>
        
        {/* Filtro Ativo Badge */}
        {(selectedMacro !== 'all' || selectedMicro) && activeMacroConfig && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2"
          >
            <Badge className={cn(activeMacroConfig.visual.bgColor, activeMacroConfig.visual.color, 'border', activeMacroConfig.visual.borderColor)}>
              <activeMacroConfig.visual.icon className="w-3 h-3 mr-1" />
              {activeMacroConfig.label}
              {selectedMicro && (
                <span className="ml-1 opacity-70">
                  → {selectedMicro}
                </span>
              )}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilter}
              className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="w-3 h-3 mr-1" />
              Limpar
            </Button>
          </motion.div>
        )}
      </div>

      {/* Botão Todos */}
      <div className="flex flex-wrap items-start gap-2">
        <Button
          type="button"
          size="sm"
          variant={selectedMacro === 'all' ? 'default' : 'outline'}
          onClick={handleClearFilter}
          className="text-xs h-8"
        >
          Todos os Assuntos
          <Badge variant="secondary" className="ml-1.5 text-[10px]">{totalCards}</Badge>
        </Button>
      </div>

      {/* Macros Grid - DO BANCO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {macros.map(macro => {
          const count = macroStats.get(macro.value) || 0;
          const Icon = macro.visual.icon;
          const isSelected = selectedMacro === macro.value;
          const isExpanded = expandedMacro === macro.value;
          const hasCards = count > 0;
          const micros = getMicrosForMacro(macro.value);

          return (
            <div key={macro.value} className="space-y-2">
              {/* Macro Button */}
              <Button
                type="button"
                variant="outline"
                onClick={() => handleMacroClick(macro.value)}
                disabled={!hasCards}
                className={cn(
                  "w-full justify-between text-xs h-10 transition-all",
                  isSelected && cn(macro.visual.bgColor, macro.visual.borderColor, macro.visual.color),
                  !isSelected && hasCards && macro.visual.hoverBg,
                  !hasCards && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon className={cn("w-4 h-4", isSelected ? macro.visual.color : "text-muted-foreground")} />
                  <span className="truncate">{macro.label}</span>
                </div>
                <div className="flex items-center gap-1">
                  {count > 0 && (
                    <Badge variant="secondary" className="text-[10px]">{count}</Badge>
                  )}
                  {hasCards && isSelected && (
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </motion.div>
                  )}
                </div>
              </Button>

              {/* Micros Dropdown - DO BANCO */}
              <AnimatePresence>
                {isSelected && isExpanded && micros.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className={cn(
                      "space-y-1 p-2 rounded-lg border",
                      macro.visual.bgColor,
                      macro.visual.borderColor
                    )}>
                      {micros.map(micro => {
                        const microCount = microStats.get(micro.value) || 0;
                        const isSelectedMicro = selectedMicro === micro.value;
                        const hasMicroCards = microCount > 0;

                        return (
                          <button
                            key={micro.value}
                            onClick={() => handleMicroClick(micro.value)}
                            disabled={!hasMicroCards}
                            className={cn(
                              "w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs transition-all",
                              isSelectedMicro 
                                ? cn("bg-background/80 font-medium", macro.visual.color)
                                : "hover:bg-background/50 text-foreground/80",
                              !hasMicroCards && "opacity-40 cursor-not-allowed"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <ChevronRight className={cn(
                                "w-3 h-3 transition-transform",
                                isSelectedMicro && "rotate-90"
                              )} />
                              <span className="truncate">{micro.label}</span>
                            </div>
                            {microCount > 0 && (
                              <Badge 
                                variant="secondary" 
                                className={cn(
                                  "text-[9px] h-4",
                                  isSelectedMicro && "bg-primary/20"
                                )}
                              >
                                {microCount}
                              </Badge>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Re-export da configuração visual central para compatibilidade
export { MACRO_VISUAL_CONFIG } from '@/lib/taxonomy/macroVisualConfig';
export default FlashcardsTaxonomyFilter;
