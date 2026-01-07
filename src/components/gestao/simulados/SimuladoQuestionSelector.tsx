/**
 * 🎯 SIMULADOS — SELETOR DE QUESTÕES IMERSIVO 2300
 * Constituição SYNAPSE Ω v10.0
 * 
 * Interface split-screen com filtros visuais, seleção em massa,
 * preview expandido e experiência futurística
 */

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { cleanQuestionText } from "@/components/shared/QuestionEnunciado";
import { 
  GripVertical, 
  CheckCircle2, 
  AlertCircle, 
  FileQuestion,
  Search,
  Plus,
  Minus,
  ArrowUpDown,
  Filter,
  X,
  Sparkles,
  Layers,
  Zap,
  ChevronRight,
  ChevronLeft,
  LayoutGrid,
  ListOrdered,
  Eye,
  Trash2,
  CheckSquare,
  Square,
  ArrowRight,
  RotateCcw,
  Copy
} from "lucide-react";

interface Question {
  id: string;
  question_text: string | null;
  difficulty: string | null;
  banca: string | null;
  ano: number | null;
  macro?: string | null;
  micro?: string | null;
  tema?: string | null;
  subtema?: string | null;
  question_type?: string | null;
  tags?: string[] | null;
}

// Hook para buscar questões já usadas em outros simulados
function useQuestionsInSimulados() {
  return useQuery({
    queryKey: ['questions-in-simulados'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('simulados')
        .select('id, title, question_ids')
        .eq('is_active', true);
      
      if (error) throw error;
      
      // Mapeia cada question_id para os simulados que a contêm
      const questionToSimulados: Record<string, Array<{ id: string; title: string }>> = {};
      
      (data || []).forEach(simulado => {
        const questionIds = simulado.question_ids as string[] | null;
        if (questionIds && Array.isArray(questionIds)) {
          questionIds.forEach(qId => {
            if (!questionToSimulados[qId]) {
              questionToSimulados[qId] = [];
            }
            questionToSimulados[qId].push({
              id: simulado.id,
              title: simulado.title
            });
          });
        }
      });
      
      return questionToSimulados;
    },
    staleTime: 30_000,
  });
}

// ═══════════════════════════════════════════════════════════════
// FILTER CHIP COMPONENT
// ═══════════════════════════════════════════════════════════════

interface FilterChipProps {
  label: string;
  value: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
  color?: string;
}

function FilterChip({ label, value, count, isActive, onClick, color }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-2 py-1 rounded-full text-xs font-medium transition-all border whitespace-nowrap",
        "hover:scale-105 active:scale-95",
        isActive 
          ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/30" 
          : "bg-card/50 text-muted-foreground border-border/50 hover:border-primary/50 hover:text-foreground",
        color
      )}
    >
      {label} <span className="opacity-70">({count})</span>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════
// SORTABLE MINI ITEM
// ═══════════════════════════════════════════════════════════════

interface SortableItemProps {
  question: Question;
  index: number;
  onRemove: (id: string) => void;
}

function SortableItem({ question, index, onRemove }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: question.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  const cleanText = cleanQuestionText(question.question_text || '') || "?";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-2 px-2 py-1.5 rounded border transition-all",
        "bg-gradient-to-r from-card/80 to-card/60",
        isDragging && "opacity-50 shadow-xl ring-2 ring-primary scale-105"
      )}
    >
      <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing shrink-0 opacity-50 hover:opacity-100">
        <GripVertical className="h-3 w-3" />
      </button>
      
      <div className="w-5 h-5 rounded bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
        {index + 1}
      </div>
      
      <span className="text-[11px] truncate flex-1 min-w-0">{cleanText.substring(0, 50)}...</span>
      
      <div className="flex gap-1 shrink-0">
        <Badge variant="secondary" className={cn(
          "text-[9px] px-1 py-0 h-4",
          question.difficulty === "facil" && "bg-green-500/20 text-green-400",
          question.difficulty === "medio" && "bg-yellow-500/20 text-yellow-400",
          question.difficulty === "dificil" && "bg-red-500/20 text-red-400"
        )}>
          {question.difficulty?.charAt(0).toUpperCase() || "?"}
        </Badge>
      </div>
      
      <button
        onClick={() => onRemove(question.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive shrink-0"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// QUESTION CARD (Available)
// ═══════════════════════════════════════════════════════════════

interface QuestionCardProps {
  question: Question;
  isSelected: boolean;
  onToggle: () => void;
  onPreview: () => void;
  usedInSimulados?: Array<{ id: string; title: string }>;
}

function QuestionCard({ question, isSelected, onToggle, onPreview, usedInSimulados = [] }: QuestionCardProps) {
  const cleanText = cleanQuestionText(question.question_text || '') || "Sem texto";
  const isUsedElsewhere = usedInSimulados.length > 0;

  return (
    <div
      className={cn(
        "group relative p-3 rounded-lg border transition-all cursor-pointer",
        "hover:shadow-lg hover:shadow-primary/5",
        isSelected 
          ? "bg-primary/10 border-primary ring-1 ring-primary/50 scale-[0.98]" 
          : "bg-card/40 border-border/30 hover:border-primary/40 hover:bg-card/70"
      )}
      onClick={onToggle}
    >
      {/* Selection indicator */}
      <div className={cn(
        "absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center transition-all z-10",
        isSelected 
          ? "bg-primary text-primary-foreground scale-100 shadow-lg" 
          : "bg-muted scale-0 group-hover:scale-100"
      )}>
        {isSelected ? <CheckCircle2 className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
      </div>

      {/* Used in other simulados indicator */}
      {isUsedElsewhere && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center bg-amber-500 text-amber-950 z-10 shadow-lg">
              <Copy className="h-3 w-3" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="text-xs">
              <p className="font-semibold mb-1">Já usada em {usedInSimulados.length} simulado{usedInSimulados.length > 1 ? 's' : ''}:</p>
              <ul className="list-disc pl-3 space-y-0.5">
                {usedInSimulados.slice(0, 5).map(s => (
                  <li key={s.id} className="text-muted-foreground">{s.title}</li>
                ))}
                {usedInSimulados.length > 5 && (
                  <li className="text-muted-foreground">...e mais {usedInSimulados.length - 5}</li>
                )}
              </ul>
            </div>
          </TooltipContent>
        </Tooltip>
      )}

      {/* Difficulty indicator bar */}
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-1 rounded-l-lg",
        question.difficulty === "facil" && "bg-green-500",
        question.difficulty === "medio" && "bg-yellow-500",
        question.difficulty === "dificil" && "bg-red-500",
        !question.difficulty && "bg-muted"
      )} />

      {/* Content */}
      <div className="pl-2">
        <p className="text-xs leading-relaxed line-clamp-2 mb-2 text-foreground/90">
          {cleanText.substring(0, 150)}...
        </p>

        <div className="flex flex-wrap gap-1">
          {isUsedElsewhere && (
            <Badge className="text-[9px] px-1.5 py-0 h-4 bg-amber-500/20 text-amber-400 border-0">
              Em {usedInSimulados.length} simulado{usedInSimulados.length > 1 ? 's' : ''}
            </Badge>
          )}
          {question.banca && (
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-background/50">
              {question.banca}
            </Badge>
          )}
          {question.ano && (
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 bg-background/50">
              {question.ano}
            </Badge>
          )}
          {question.macro && (
            <Badge className="text-[9px] px-1.5 py-0 h-4 bg-primary/20 text-primary border-0">
              {question.macro}
            </Badge>
          )}
        </div>
      </div>

      {/* Preview button */}
      <button
        onClick={(e) => { e.stopPropagation(); onPreview(); }}
        className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all p-1 rounded bg-muted hover:bg-primary hover:text-primary-foreground"
      >
        <Eye className="h-3 w-3" />
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PREVIEW MODAL
// ═══════════════════════════════════════════════════════════════

interface PreviewModalProps {
  question: Question | null;
  onClose: () => void;
  onAdd: () => void;
  isSelected: boolean;
}

function PreviewModal({ question, onClose, onAdd, isSelected }: PreviewModalProps) {
  if (!question) return null;

  const cleanText = cleanQuestionText(question.question_text || '') || "Sem texto";

  return (
    <div 
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-card border rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-auto p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-2">
            <Badge className={cn(
              question.difficulty === "facil" && "bg-green-500/20 text-green-400",
              question.difficulty === "medio" && "bg-yellow-500/20 text-yellow-400",
              question.difficulty === "dificil" && "bg-red-500/20 text-red-400"
            )}>
              {question.difficulty || "?"}
            </Badge>
            {question.banca && <Badge variant="outline">{question.banca}</Badge>}
            {question.ano && <Badge variant="outline">{question.ano}</Badge>}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{cleanText}</p>
        </div>

        {question.macro && (
          <div className="flex gap-2 pt-2 border-t">
            <Badge className="bg-primary/20 text-primary">{question.macro}</Badge>
            {question.micro && <Badge variant="outline">{question.micro}</Badge>}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Fechar</Button>
          <Button onClick={onAdd} className={isSelected ? "bg-destructive hover:bg-destructive/90" : ""}>
            {isSelected ? <><Minus className="h-4 w-4 mr-2" />Remover</> : <><Plus className="h-4 w-4 mr-2" />Adicionar</>}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

interface SimuladoQuestionSelectorProps {
  allQuestions: Question[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  isLoading?: boolean;
}

export function SimuladoQuestionSelector({
  allQuestions,
  selectedIds,
  onChange,
  isLoading = false,
}: SimuladoQuestionSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);
  
  // Paginação - 100 por página
  const ITEMS_PER_PAGE = 100;
  const [currentPage, setCurrentPage] = useState(1);
  
  // Buscar questões já usadas em outros simulados
  const { data: questionsInSimulados = {} } = useQuestionsInSimulados();
  
  // Active filters
  const [activeDifficulties, setActiveDifficulties] = useState<Set<string>>(new Set());
  const [activeBancas, setActiveBancas] = useState<Set<string>>(new Set());
  const [activeAnos, setActiveAnos] = useState<Set<number>>(new Set());
  const [activeMacros, setActiveMacros] = useState<Set<string>>(new Set());
  const [activeMicros, setActiveMicros] = useState<Set<string>>(new Set());
  const [activeTemas, setActiveTemas] = useState<Set<string>>(new Set());
  const [activeSubtemas, setActiveSubtemas] = useState<Set<string>>(new Set());
  const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set());
  const [activeGrupos, setActiveGrupos] = useState<Set<string>>(new Set());
  
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // CONTADORES DINÂMICOS: Cada filtro mostra contagem baseada nos OUTROS filtros ativos
  // Isso garante que os números reflitam combinações válidas
  const filterData = useMemo(() => {
    const available = allQuestions.filter(q => !selectedIds.includes(q.id));
    
    // Helper para aplicar todos os filtros EXCETO um específico
    const applyFiltersExcept = (questions: Question[], excludeFilter: string) => {
      let result = questions;
      
      if (excludeFilter !== 'difficulty' && activeDifficulties.size > 0) {
        result = result.filter(q => q.difficulty && activeDifficulties.has(q.difficulty));
      }
      if (excludeFilter !== 'macro' && activeMacros.size > 0) {
        result = result.filter(q => q.macro && activeMacros.has(q.macro));
      }
      if (excludeFilter !== 'micro' && activeMicros.size > 0) {
        result = result.filter(q => q.micro && activeMicros.has(q.micro));
      }
      if (excludeFilter !== 'tema' && activeTemas.size > 0) {
        result = result.filter(q => q.tema && activeTemas.has(q.tema));
      }
      if (excludeFilter !== 'subtema' && activeSubtemas.size > 0) {
        result = result.filter(q => q.subtema && activeSubtemas.has(q.subtema));
      }
      if (excludeFilter !== 'banca' && activeBancas.size > 0) {
        result = result.filter(q => q.banca && activeBancas.has(q.banca));
      }
      if (excludeFilter !== 'ano' && activeAnos.size > 0) {
        result = result.filter(q => q.ano && activeAnos.has(q.ano));
      }
      if (excludeFilter !== 'type' && activeTypes.size > 0) {
        result = result.filter(q => q.question_type && activeTypes.has(q.question_type));
      }
      if (excludeFilter !== 'grupo' && activeGrupos.size > 0) {
        result = result.filter(q => {
          if (!q.tags || q.tags.length === 0) return false;
          return Array.from(activeGrupos).some(grupo => q.tags!.includes(grupo));
        });
      }
      
      return result;
    };
    
    // Contagem de dificuldades (excluindo o filtro de dificuldade para mostrar todas as opções válidas)
    const difficultyBase = applyFiltersExcept(available, 'difficulty');
    const difficulties: Record<string, number> = {};
    difficultyBase.forEach(q => {
      if (q.difficulty) difficulties[q.difficulty] = (difficulties[q.difficulty] || 0) + 1;
    });
    
    // Contagem de macros
    const macroBase = applyFiltersExcept(available, 'macro');
    const macros: Record<string, number> = {};
    macroBase.forEach(q => {
      if (q.macro) macros[q.macro] = (macros[q.macro] || 0) + 1;
    });
    
    // Contagem de micros (considera macro se ativo)
    const microBase = applyFiltersExcept(available, 'micro');
    const micros: Record<string, number> = {};
    microBase.forEach(q => {
      if (q.micro) micros[q.micro] = (micros[q.micro] || 0) + 1;
    });
    
    // Contagem de temas (considera macro + micro se ativos)
    const temaBase = applyFiltersExcept(available, 'tema');
    const temas: Record<string, number> = {};
    temaBase.forEach(q => {
      if (q.tema) temas[q.tema] = (temas[q.tema] || 0) + 1;
    });
    
    // Contagem de subtemas (considera macro + micro + tema se ativos)
    const subtemaBase = applyFiltersExcept(available, 'subtema');
    const subtemas: Record<string, number> = {};
    subtemaBase.forEach(q => {
      if (q.subtema) subtemas[q.subtema] = (subtemas[q.subtema] || 0) + 1;
    });
    
    // Contagem de bancas
    const bancaBase = applyFiltersExcept(available, 'banca');
    const bancas: Record<string, number> = {};
    bancaBase.forEach(q => {
      if (q.banca) bancas[q.banca] = (bancas[q.banca] || 0) + 1;
    });
    
    // Contagem de anos
    const anoBase = applyFiltersExcept(available, 'ano');
    const anos: Record<number, number> = {};
    anoBase.forEach(q => {
      if (q.ano) anos[q.ano] = (anos[q.ano] || 0) + 1;
    });
    
    // Contagem de tipos
    const typeBase = applyFiltersExcept(available, 'type');
    const types: Record<string, number> = {};
    typeBase.forEach(q => {
      if (q.question_type) types[q.question_type] = (types[q.question_type] || 0) + 1;
    });
    
    // Contagem de grupos (SIMULADOS, MODO_TREINO)
    const grupoBase = applyFiltersExcept(available, 'grupo');
    const grupos: Record<string, number> = { 'SIMULADOS': 0, 'MODO_TREINO': 0 };
    grupoBase.forEach(q => {
      if (q.tags?.includes('SIMULADOS')) grupos['SIMULADOS']++;
      if (q.tags?.includes('MODO_TREINO')) grupos['MODO_TREINO']++;
    });

    return { difficulties, bancas, anos, macros, micros, temas, subtemas, types, grupos, total: available.length };
  }, [allQuestions, selectedIds, activeDifficulties, activeMacros, activeMicros, activeTemas, activeSubtemas, activeBancas, activeAnos, activeTypes, activeGrupos]);
  
  // Dynamic filter options - agora usa filterData diretamente pois já é dinâmico
  const dynamicFilterOptions = useMemo(() => {
    return {
      micros: filterData.micros,
      temas: filterData.temas,
      subtemas: filterData.subtemas
    };
  }, [filterData]);

  // Filtered questions
  const filteredQuestions = useMemo(() => {
    let result = allQuestions.filter(q => !selectedIds.includes(q.id));

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(q =>
        q.question_text?.toLowerCase().includes(term) ||
        q.banca?.toLowerCase().includes(term) ||
        q.macro?.toLowerCase().includes(term)
      );
    }

    if (activeDifficulties.size > 0) {
      result = result.filter(q => q.difficulty && activeDifficulties.has(q.difficulty));
    }
    if (activeBancas.size > 0) {
      result = result.filter(q => q.banca && activeBancas.has(q.banca));
    }
    if (activeAnos.size > 0) {
      result = result.filter(q => q.ano && activeAnos.has(q.ano));
    }
    if (activeMacros.size > 0) {
      result = result.filter(q => q.macro && activeMacros.has(q.macro));
    }
    if (activeMicros.size > 0) {
      result = result.filter(q => q.micro && activeMicros.has(q.micro));
    }
    if (activeTemas.size > 0) {
      result = result.filter(q => q.tema && activeTemas.has(q.tema));
    }
    if (activeSubtemas.size > 0) {
      result = result.filter(q => q.subtema && activeSubtemas.has(q.subtema));
    }
    if (activeTypes.size > 0) {
      result = result.filter(q => q.question_type && activeTypes.has(q.question_type));
    }
    if (activeGrupos.size > 0) {
      result = result.filter(q => {
        if (!q.tags || q.tags.length === 0) return false;
        return Array.from(activeGrupos).some(grupo => q.tags!.includes(grupo));
      });
    }

    return result;
  }, [allQuestions, selectedIds, searchTerm, activeDifficulties, activeBancas, activeAnos, activeMacros, activeMicros, activeTemas, activeSubtemas, activeTypes, activeGrupos]);

  const selectedQuestions = useMemo(() => {
    return selectedIds.map(id => allQuestions.find(q => q.id === id)).filter((q): q is Question => !!q);
  }, [selectedIds, allQuestions]);

  const hasActiveFilters = activeDifficulties.size > 0 || activeBancas.size > 0 || activeAnos.size > 0 || activeMacros.size > 0 || activeMicros.size > 0 || activeTemas.size > 0 || activeSubtemas.size > 0 || activeTypes.size > 0 || activeGrupos.size > 0 || searchTerm;

  // Paginação calculada
  const totalPages = Math.ceil(filteredQuestions.length / ITEMS_PER_PAGE);
  const paginatedQuestions = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredQuestions.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredQuestions, currentPage]);
  
  // Resetar página ao mudar filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [activeDifficulties, activeBancas, activeAnos, activeMacros, activeMicros, activeTemas, activeSubtemas, activeTypes, activeGrupos, searchTerm]);

  // Handlers
  const toggleFilter = useCallback(<T,>(set: Set<T>, setFn: React.Dispatch<React.SetStateAction<Set<T>>>, value: T) => {
    setFn(prev => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }, []);

  const handleToggle = useCallback((id: string) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter(i => i !== id) : [...selectedIds, id]);
  }, [selectedIds, onChange]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = selectedIds.indexOf(active.id as string);
      const newIndex = selectedIds.indexOf(over.id as string);
      onChange(arrayMove(selectedIds, oldIndex, newIndex));
    }
  };

  const handleSelectAll = () => onChange([...selectedIds, ...filteredQuestions.map(q => q.id)]);
  const handleSelect20 = () => {
    const notSelected = filteredQuestions.filter(q => !selectedIds.includes(q.id));
    const toAdd = notSelected.slice(0, 20).map(q => q.id);
    onChange([...selectedIds, ...toAdd]);
  };
  const handleClearAll = () => onChange([]);
  const handleClearFilters = () => {
    setSearchTerm("");
    setActiveDifficulties(new Set());
    setActiveBancas(new Set());
    setActiveAnos(new Set());
    setActiveMacros(new Set());
    setActiveMicros(new Set());
    setActiveTemas(new Set());
    setActiveSubtemas(new Set());
    setActiveTypes(new Set());
    setActiveGrupos(new Set());
  };
  
  // Handler para filtros hierárquicos - limpa níveis inferiores ao mudar
  const handleMacroToggle = useCallback((value: string) => {
    setActiveMacros(prev => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      // Reset níveis inferiores
      setActiveMicros(new Set());
      setActiveTemas(new Set());
      setActiveSubtemas(new Set());
      return next;
    });
  }, []);
  
  const handleMicroToggle = useCallback((value: string) => {
    setActiveMicros(prev => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      // Reset níveis inferiores
      setActiveTemas(new Set());
      setActiveSubtemas(new Set());
      return next;
    });
  }, []);
  
  const handleTemaToggle = useCallback((value: string) => {
    setActiveTemas(prev => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      // Reset nível inferior
      setActiveSubtemas(new Set());
      return next;
    });
  }, []);

  if (isLoading) {
    return (
      <div className="h-[600px] flex items-center justify-center">
        <div className="text-center space-y-3 animate-pulse">
          <Zap className="h-12 w-12 mx-auto text-primary" />
          <p className="text-muted-foreground">Carregando questões...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="border rounded-xl overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
        {/* Header with stats */}
        <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Layers className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">Seletor de Questões</h3>
              <p className="text-xs text-muted-foreground">
                {filterData.total} disponíveis • {selectedIds.length} selecionadas
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={handleClearFilters} 
              className="text-xs gap-1 bg-red-600 hover:bg-red-700"
            >
              <RotateCcw className="h-3 w-3" />
              Restaurar Filtros
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={handleSelect20}
              disabled={filteredQuestions.filter(q => !selectedIds.includes(q.id)).length === 0}
              className="text-xs gap-1"
            >
              <Plus className="h-3 w-3" />
              +20 Questões
            </Button>
            <Badge variant={selectedIds.length > 0 ? "default" : "destructive"} className="text-sm px-3 py-1 gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {selectedIds.length}
            </Badge>
          </div>
        </div>

        {/* Split panel layout - MAXIMUM VIEWPORT HEIGHT */}
        <div className="flex h-[calc(100vh-180px)] min-h-[800px]">
          {/* LEFT: Available questions */}
          <div className="flex-1 flex flex-col border-r">
            {/* Search */}
            <div className="p-3 border-b bg-muted/10">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar questões..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 bg-background"
                />
              </div>
            </div>

            {/* Filter chips */}
            <div className="p-3 border-b space-y-2 bg-muted/5">
              {/* GRUPO filters (SIMULADOS / MODO_TREINO) - PRIMEIRO */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider w-16 shrink-0">Grupo</span>
                <div className="flex gap-1 flex-wrap">
                  {Object.entries(filterData.grupos).filter(([_, count]) => count > 0).map(([key, count]) => (
                    <FilterChip
                      key={key}
                      label={key === 'SIMULADOS' ? 'Simulados' : 'Modo Treino'}
                      value={key}
                      count={count}
                      isActive={activeGrupos.has(key)}
                      onClick={() => toggleFilter(activeGrupos, setActiveGrupos, key)}
                      color={cn(
                        activeGrupos.has(key) ? "" :
                        key === "SIMULADOS" && "hover:border-red-500/50",
                        key === "MODO_TREINO" && "hover:border-purple-500/50"
                      )}
                    />
                  ))}
                </div>
              </div>
              
              {/* Difficulty filters */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider w-16 shrink-0">Dificuldade</span>
                <div className="flex gap-1 flex-wrap">
                  {Object.entries(filterData.difficulties).map(([key, count]) => (
                    <FilterChip
                      key={key}
                      label={key}
                      value={key}
                      count={count}
                      isActive={activeDifficulties.has(key)}
                      onClick={() => toggleFilter(activeDifficulties, setActiveDifficulties, key)}
                      color={cn(
                        activeDifficulties.has(key) ? "" :
                        key === "facil" && "hover:border-green-500/50",
                        key === "medio" && "hover:border-yellow-500/50",
                        key === "dificil" && "hover:border-red-500/50"
                      )}
                    />
                  ))}
                </div>
              </div>

              {/* Macro filters - SEM LIMITE */}
              {Object.keys(filterData.macros).length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider w-16 shrink-0">Macro</span>
                  <div className="flex gap-1 flex-wrap">
                    {Object.entries(filterData.macros).map(([key, count]) => (
                      <FilterChip
                        key={key}
                        label={key}
                        value={key}
                        count={count}
                        isActive={activeMacros.has(key)}
                        onClick={() => handleMacroToggle(key)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Micro filters - SEM LIMITE - scroll horizontal se necessário */}
              {(activeMacros.size > 0 ? Object.keys(dynamicFilterOptions.micros).length > 0 : Object.keys(filterData.micros).length > 0) && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider w-16 shrink-0">Micro</span>
                  <div className="flex gap-1 flex-wrap max-h-24 overflow-y-auto flex-1">
                    {Object.entries(activeMacros.size > 0 ? dynamicFilterOptions.micros : filterData.micros).map(([key, count]) => (
                      <FilterChip
                        key={key}
                        label={key.length > 25 ? key.substring(0, 25) + '...' : key}
                        value={key}
                        count={count}
                        isActive={activeMicros.has(key)}
                        onClick={() => handleMicroToggle(key)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Tema filters - SEM LIMITE */}
              {(activeMicros.size > 0 ? Object.keys(dynamicFilterOptions.temas).length > 0 : Object.keys(filterData.temas).length > 0) && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider w-16 shrink-0">Tema</span>
                  <div className="flex gap-1 flex-wrap max-h-24 overflow-y-auto flex-1">
                    {Object.entries(activeMicros.size > 0 ? dynamicFilterOptions.temas : filterData.temas).map(([key, count]) => (
                      <FilterChip
                        key={key}
                        label={key.length > 25 ? key.substring(0, 25) + '...' : key}
                        value={key}
                        count={count}
                        isActive={activeTemas.has(key)}
                        onClick={() => handleTemaToggle(key)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Subtema filters - SEM LIMITE */}
              {(activeTemas.size > 0 ? Object.keys(dynamicFilterOptions.subtemas).length > 0 : Object.keys(filterData.subtemas).length > 0) && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider w-16 shrink-0">Subtema</span>
                  <div className="flex gap-1 flex-wrap max-h-24 overflow-y-auto flex-1">
                    {Object.entries(activeTemas.size > 0 ? dynamicFilterOptions.subtemas : filterData.subtemas).map(([key, count]) => (
                      <FilterChip
                        key={key}
                        label={key.length > 25 ? key.substring(0, 25) + '...' : key}
                        value={key}
                        count={count}
                        isActive={activeSubtemas.has(key)}
                        onClick={() => toggleFilter(activeSubtemas, setActiveSubtemas, key)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Banca filters - SEM LIMITE */}
              {Object.keys(filterData.bancas).length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider w-16 shrink-0">Banca</span>
                  <div className="flex gap-1 flex-wrap max-h-20 overflow-y-auto flex-1">
                    {Object.entries(filterData.bancas).map(([key, count]) => (
                      <FilterChip
                        key={key}
                        label={key}
                        value={key}
                        count={count}
                        isActive={activeBancas.has(key)}
                        onClick={() => toggleFilter(activeBancas, setActiveBancas, key)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Ano filters - SEM LIMITE */}
              {Object.keys(filterData.anos).length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider w-16 shrink-0">Ano</span>
                  <div className="flex gap-1 flex-wrap max-h-20 overflow-y-auto flex-1">
                    {Object.entries(filterData.anos).sort((a, b) => Number(b[0]) - Number(a[0])).map(([key, count]) => (
                      <FilterChip
                        key={key}
                        label={key}
                        value={key}
                        count={count}
                        isActive={activeAnos.has(Number(key))}
                        onClick={() => toggleFilter(activeAnos, setActiveAnos, Number(key))}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Tipo filters - SEM LIMITE */}
              {Object.keys(filterData.types).length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider w-16 shrink-0">Tipo</span>
                  <div className="flex gap-1 flex-wrap">
                    {Object.entries(filterData.types).map(([key, count]) => (
                      <FilterChip
                        key={key}
                        label={key === 'multiple_choice' ? 'Múltipla Escolha' : key === 'discursive' ? 'Discursiva' : key === 'somatorio' ? 'Somatório' : key === 'vf' ? 'V/F' : key}
                        value={key}
                        count={count}
                        isActive={activeTypes.has(key)}
                        onClick={() => toggleFilter(activeTypes, setActiveTypes, key)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions bar with pagination info */}
            <div className="px-3 py-2 border-b bg-muted/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  <strong className="text-foreground">{filteredQuestions.length}</strong> questões
                  {totalPages > 1 && (
                    <span className="ml-1">• Página {currentPage}/{totalPages}</span>
                  )}
                </span>
              </div>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={handleSelectAll}
                disabled={filteredQuestions.length === 0}
                className="h-7 text-xs gap-1"
              >
                <CheckSquare className="h-3 w-3" />
                Adicionar todas
              </Button>
            </div>

            {/* Questions grid */}
            <ScrollArea className="flex-1 p-3">
              {paginatedQuestions.length > 0 ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                  {paginatedQuestions.map((q) => (
                    <QuestionCard
                      key={q.id}
                      question={q}
                      isSelected={selectedIds.includes(q.id)}
                      onToggle={() => handleToggle(q.id)}
                      onPreview={() => setPreviewQuestion(q)}
                      usedInSimulados={questionsInSimulados[q.id] || []}
                    />
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-center">
                  <div className="space-y-2">
                    <FileQuestion className="h-10 w-10 mx-auto text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">
                      {hasActiveFilters ? "Nenhuma questão com esses filtros" : "Todas já selecionadas!"}
                    </p>
                  </div>
                </div>
              )}
            </ScrollArea>
            
            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="px-3 py-2 border-t bg-muted/20 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="h-7 w-7 p-0"
                >
                  <ChevronLeft className="h-3 w-3" />
                  <ChevronLeft className="h-3 w-3 -ml-2" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-7 px-2 gap-1"
                >
                  <ChevronLeft className="h-3 w-3" />
                  Anterior
                </Button>
                
                <div className="flex items-center gap-1 px-2">
                  {/* Páginas renderizadas dinamicamente */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let page: number;
                    if (totalPages <= 5) {
                      page = i + 1;
                    } else if (currentPage <= 3) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      page = totalPages - 4 + i;
                    } else {
                      page = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className={cn(
                          "h-7 w-7 p-0 text-xs",
                          currentPage === page && "bg-primary text-primary-foreground"
                        )}
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-7 px-2 gap-1"
                >
                  Próxima
                  <ChevronRight className="h-3 w-3" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="h-7 w-7 p-0"
                >
                  <ChevronRight className="h-3 w-3" />
                  <ChevronRight className="h-3 w-3 -ml-2" />
                </Button>
              </div>
            )}
          </div>

          {/* RIGHT: Selected questions */}
          <div className="w-80 flex flex-col bg-muted/5">
            <div className="p-3 border-b flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-2">
                <ListOrdered className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">Ordem do Simulado</span>
              </div>
              {selectedIds.length > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={handleClearAll}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Remover todas</TooltipContent>
                </Tooltip>
              )}
            </div>

            <ScrollArea className="flex-1 p-2">
              {selectedIds.length > 0 ? (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={selectedIds} strategy={verticalListSortingStrategy}>
                    <div className="space-y-1">
                      {selectedQuestions.map((q, index) => (
                        <SortableItem
                          key={q.id}
                          question={q}
                          index={index}
                          onRemove={(id) => onChange(selectedIds.filter(i => i !== id))}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <div className="h-full flex items-center justify-center text-center p-4">
                  <div className="space-y-3">
                    <div className="relative mx-auto w-16 h-16">
                      <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse" />
                      <Sparkles className="h-8 w-8 absolute inset-0 m-auto text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Nenhuma questão</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Clique nas questões à esquerda
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 mx-auto text-primary animate-pulse rotate-180" />
                  </div>
                </div>
              )}
            </ScrollArea>

            {/* Summary footer */}
            {selectedIds.length > 0 && (
              <div className="p-3 border-t bg-muted/20 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Total de questões</span>
                  <span className="font-bold text-primary">{selectedIds.length}</span>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {Object.entries(
                    selectedQuestions.reduce((acc, q) => {
                      if (q.difficulty) acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([diff, count]) => (
                    <Badge 
                      key={diff} 
                      variant="secondary"
                      className={cn(
                        "text-[10px]",
                        diff === "facil" && "bg-green-500/20 text-green-400",
                        diff === "medio" && "bg-yellow-500/20 text-yellow-400",
                        diff === "dificil" && "bg-red-500/20 text-red-400"
                      )}
                    >
                      {count} {diff}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preview modal */}
        {previewQuestion && (
          <PreviewModal
            question={previewQuestion}
            onClose={() => setPreviewQuestion(null)}
            onAdd={() => {
              handleToggle(previewQuestion.id);
              setPreviewQuestion(null);
            }}
            isSelected={selectedIds.includes(previewQuestion.id)}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
