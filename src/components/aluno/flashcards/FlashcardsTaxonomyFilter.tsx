// ============================================
// 🎯 FILTRO HIERÁRQUICO DE FLASHCARDS
// Macro → Micro Assuntos (Taxonomia Questões)
// Constituição SYNAPSE Ω v10.4
// ============================================

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  ChevronDown,
  ChevronRight,
  Beaker,
  Atom,
  FlaskConical,
  Leaf,
  Dna,
  Layers,
  X
} from 'lucide-react';

// 🎯 5 MACROS SOBERANOS — Taxonomia Questões (Constituição v10.4)
const MACRO_CONFIG = [
  { 
    value: 'quimica_geral', 
    label: 'Química Geral', 
    icon: Beaker, 
    color: 'text-amber-500', 
    bgColor: 'bg-amber-500/10', 
    borderColor: 'border-amber-500/30',
    hoverBg: 'hover:bg-amber-500/20',
    // Micros deste Macro (baseado na taxonomia question_taxonomy)
    micros: [
      { value: 'propriedades_materia', label: 'Propriedades da Matéria' },
      { value: 'atomistica', label: 'Atomística' },
      { value: 'tabela_periodica', label: 'Tabela Periódica' },
      { value: 'ligacoes_quimicas', label: 'Ligações Químicas' },
      { value: 'estequiometria', label: 'Estequiometria' },
      { value: 'balanceamento', label: 'Balanceamento' },
      { value: 'conceitos_modernos', label: 'Conceitos Modernos' },
    ]
  },
  { 
    value: 'fisico_quimica', 
    label: 'Físico-Química', 
    icon: Atom, 
    color: 'text-cyan-500', 
    bgColor: 'bg-cyan-500/10', 
    borderColor: 'border-cyan-500/30',
    hoverBg: 'hover:bg-cyan-500/20',
    micros: [
      { value: 'termoquimica', label: 'Termoquímica' },
      { value: 'cinetica_quimica', label: 'Cinética Química' },
      { value: 'equilibrio_quimico', label: 'Equilíbrio Químico' },
      { value: 'eletroquimica', label: 'Eletroquímica' },
      { value: 'solucoes', label: 'Soluções' },
      { value: 'propriedades_coligativas', label: 'Propriedades Coligativas' },
      { value: 'radioatividade', label: 'Radioatividade' },
      { value: 'calculos_quimicos', label: 'Cálculos Químicos' },
    ]
  },
  { 
    value: 'quimica_organica', 
    label: 'Química Orgânica', 
    icon: FlaskConical, 
    color: 'text-purple-500', 
    bgColor: 'bg-purple-500/10', 
    borderColor: 'border-purple-500/30',
    hoverBg: 'hover:bg-purple-500/20',
    micros: [
      { value: 'funcoes_organicas', label: 'Funções Orgânicas' },
      { value: 'isomeria', label: 'Isomeria' },
      { value: 'reacoes_organicas', label: 'Reações Orgânicas' },
      { value: 'polimeros', label: 'Polímeros' },
    ]
  },
  { 
    value: 'quimica_ambiental', 
    label: 'Química Ambiental', 
    icon: Leaf, 
    color: 'text-green-500', 
    bgColor: 'bg-green-500/10', 
    borderColor: 'border-green-500/30',
    hoverBg: 'hover:bg-green-500/20',
    micros: [
      { value: 'poluicao', label: 'Poluição' },
      { value: 'ciclos_biogeoquimicos', label: 'Ciclos Biogeoquímicos' },
      { value: 'chuva_acida', label: 'Chuva Ácida' },
      { value: 'efeito_estufa', label: 'Efeito Estufa' },
    ]
  },
  { 
    value: 'bioquimica', 
    label: 'Bioquímica', 
    icon: Dna, 
    color: 'text-pink-500', 
    bgColor: 'bg-pink-500/10', 
    borderColor: 'border-pink-500/30',
    hoverBg: 'hover:bg-pink-500/20',
    micros: [
      { value: 'proteinas', label: 'Proteínas' },
      { value: 'carboidratos', label: 'Carboidratos' },
      { value: 'lipidios', label: 'Lipídios' },
      { value: 'acidos_nucleicos', label: 'Ácidos Nucleicos' },
      { value: 'metabolismo', label: 'Metabolismo' },
    ]
  },
] as const;

export type MacroValue = typeof MACRO_CONFIG[number]['value'] | 'all';
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

  // Macro config atual
  const activeMacroConfig = useMemo(() => {
    return MACRO_CONFIG.find(m => m.value === selectedMacro);
  }, [selectedMacro]);

  // Toggle expand/collapse macro
  const handleMacroClick = useCallback((macroValue: string) => {
    if (selectedMacro === macroValue) {
      // Se já está selecionado, toggle expand
      setExpandedMacro(prev => prev === macroValue ? null : macroValue);
    } else {
      // Seleciona e expande
      onMacroChange(macroValue as MacroValue);
      onMicroChange(null);
      setExpandedMacro(macroValue);
    }
  }, [selectedMacro, onMacroChange, onMicroChange]);

  // Selecionar micro
  const handleMicroClick = useCallback((microValue: string) => {
    if (selectedMicro === microValue) {
      onMicroChange(null); // Deselect
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

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header com Filtro Ativo */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Filtrar por Assunto</span>
        </div>
        
        {/* Filtro Ativo Badge */}
        {(selectedMacro !== 'all' || selectedMicro) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2"
          >
            {activeMacroConfig && (
              <Badge className={cn(activeMacroConfig.bgColor, activeMacroConfig.color, 'border', activeMacroConfig.borderColor)}>
                <activeMacroConfig.icon className="w-3 h-3 mr-1" />
                {activeMacroConfig.label}
                {selectedMicro && (
                  <span className="ml-1 opacity-70">
                    → {MACRO_CONFIG.find(m => m.value === selectedMacro)?.micros.find(mi => mi.value === selectedMicro)?.label || selectedMicro}
                  </span>
                )}
              </Badge>
            )}
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

      {/* Macros Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {MACRO_CONFIG.map(macro => {
          const count = macroStats.get(macro.value) || 0;
          const Icon = macro.icon;
          const isSelected = selectedMacro === macro.value;
          const isExpanded = expandedMacro === macro.value;
          const hasCards = count > 0;

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
                  isSelected && cn(macro.bgColor, macro.borderColor, macro.color),
                  !isSelected && hasCards && macro.hoverBg,
                  !hasCards && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className="flex items-center gap-2">
                  <Icon className={cn("w-4 h-4", isSelected ? macro.color : "text-muted-foreground")} />
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

              {/* Micros Dropdown */}
              <AnimatePresence>
                {isSelected && isExpanded && macro.micros.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className={cn(
                      "space-y-1 p-2 rounded-lg border",
                      macro.bgColor,
                      macro.borderColor
                    )}>
                      {macro.micros.map(micro => {
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
                                ? cn("bg-background/80 font-medium", macro.color)
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

// Export das configurações para uso externo
export { MACRO_CONFIG };
export default FlashcardsTaxonomyFilter;
