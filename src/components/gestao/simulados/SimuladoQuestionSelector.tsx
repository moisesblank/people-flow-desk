/**
 * 🎯 SIMULADOS — Seletor de Questões AVANÇADO
 * Constituição SYNAPSE Ω v10.0
 * 
 * Interface imersiva com filtros, grid compacto e seleção em massa
 */

import { useState, useMemo, useCallback } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
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
  Grid3X3,
  List,
  CheckSquare,
  Square,
  X,
  Sparkles,
  Layers
} from "lucide-react";

interface Question {
  id: string;
  question_text: string | null;
  difficulty: string | null;
  banca: string | null;
  ano: number | null;
  macro?: string | null;
  micro?: string | null;
}

// ═══════════════════════════════════════════════════════════════
// SORTABLE ITEM (para a aba de selecionadas)
// ═══════════════════════════════════════════════════════════════

interface SortableQuestionProps {
  question: Question;
  index: number;
  onRemove: (id: string) => void;
}

function SortableQuestion({ question, index, onRemove }: SortableQuestionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const cleanText = question.question_text
    ?.replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() || "Sem texto";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg border bg-card/80 transition-all",
        isDragging && "opacity-50 shadow-lg ring-2 ring-primary"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded shrink-0"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      
      <Badge variant="default" className="shrink-0 w-7 h-7 justify-center text-sm font-bold rounded">
        {index + 1}
      </Badge>
      
      <div className="flex-1 min-w-0">
        <p className="text-xs line-clamp-1">{cleanText.substring(0, 80)}...</p>
        <div className="flex gap-1 mt-0.5">
          <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
            {question.difficulty || "?"}
          </Badge>
          {question.banca && <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">{question.banca}</Badge>}
          {question.ano && <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">{question.ano}</Badge>}
        </div>
      </div>
      
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-destructive hover:bg-destructive/10 shrink-0"
        onClick={() => onRemove(question.id)}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// COMPACT QUESTION CARD
// ═══════════════════════════════════════════════════════════════

interface CompactCardProps {
  question: Question;
  isSelected: boolean;
  onToggle: (id: string) => void;
}

function CompactCard({ question, isSelected, onToggle }: CompactCardProps) {
  const cleanText = question.question_text
    ?.replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() || "Sem texto";

  return (
    <div
      onClick={() => onToggle(question.id)}
      className={cn(
        "relative p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.02]",
        isSelected 
          ? "bg-primary/20 border-primary ring-1 ring-primary" 
          : "bg-card/60 border-border/50 hover:border-primary/50 hover:bg-card/90"
      )}
    >
      {/* Selection indicator */}
      <div className={cn(
        "absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center transition-all",
        isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
      )}>
        {isSelected ? <CheckCircle2 className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
      </div>

      {/* Question text */}
      <p className="text-xs leading-relaxed line-clamp-2 pr-6 mb-2">
        {cleanText.substring(0, 120)}...
      </p>

      {/* Badges row */}
      <div className="flex flex-wrap gap-1">
        <Badge 
          variant="secondary" 
          className={cn(
            "text-[10px] px-1.5 py-0 h-4",
            question.difficulty === "facil" && "bg-green-500/20 text-green-400 border-green-500/30",
            question.difficulty === "medio" && "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
            question.difficulty === "dificil" && "bg-red-500/20 text-red-400 border-red-500/30"
          )}
        >
          {question.difficulty || "?"}
        </Badge>
        {question.banca && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
            {question.banca}
          </Badge>
        )}
        {question.ano && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
            {question.ano}
          </Badge>
        )}
        {question.macro && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-primary/30">
            {question.macro}
          </Badge>
        )}
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
  const [activeTab, setActiveTab] = useState<"available" | "selected">("available");
  const [showFilters, setShowFilters] = useState(true);
  
  // Filters
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");
  const [filterBanca, setFilterBanca] = useState<string>("all");
  const [filterAno, setFilterAno] = useState<string>("all");
  const [filterMacro, setFilterMacro] = useState<string>("all");
  
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Extract unique values for filters
  const filterOptions = useMemo(() => {
    const difficulties = new Set<string>();
    const bancas = new Set<string>();
    const anos = new Set<number>();
    const macros = new Set<string>();

    allQuestions.forEach(q => {
      if (q.difficulty) difficulties.add(q.difficulty);
      if (q.banca) bancas.add(q.banca);
      if (q.ano) anos.add(q.ano);
      if (q.macro) macros.add(q.macro);
    });

    return {
      difficulties: Array.from(difficulties).sort(),
      bancas: Array.from(bancas).sort(),
      anos: Array.from(anos).sort((a, b) => b - a),
      macros: Array.from(macros).sort(),
    };
  }, [allQuestions]);

  // Selected questions in correct order
  const selectedQuestions = useMemo(() => {
    return selectedIds
      .map(id => allQuestions.find(q => q.id === id))
      .filter((q): q is Question => q !== undefined);
  }, [selectedIds, allQuestions]);

  // Available questions (not selected) with filters
  const filteredQuestions = useMemo(() => {
    let result = allQuestions.filter(q => !selectedIds.includes(q.id));

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(q =>
        q.question_text?.toLowerCase().includes(term) ||
        q.banca?.toLowerCase().includes(term) ||
        q.macro?.toLowerCase().includes(term) ||
        q.micro?.toLowerCase().includes(term)
      );
    }

    // Apply filters
    if (filterDifficulty !== "all") {
      result = result.filter(q => q.difficulty === filterDifficulty);
    }
    if (filterBanca !== "all") {
      result = result.filter(q => q.banca === filterBanca);
    }
    if (filterAno !== "all") {
      result = result.filter(q => q.ano?.toString() === filterAno);
    }
    if (filterMacro !== "all") {
      result = result.filter(q => q.macro === filterMacro);
    }

    return result;
  }, [allQuestions, selectedIds, searchTerm, filterDifficulty, filterBanca, filterAno, filterMacro]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = selectedIds.indexOf(active.id as string);
      const newIndex = selectedIds.indexOf(over.id as string);
      onChange(arrayMove(selectedIds, oldIndex, newIndex));
    }
  };

  const handleToggle = useCallback((id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(i => i !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }, [selectedIds, onChange]);

  const handleRemove = (id: string) => {
    onChange(selectedIds.filter(i => i !== id));
  };

  const handleSelectAll = () => {
    const newIds = [...selectedIds, ...filteredQuestions.map(q => q.id)];
    onChange(newIds);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setFilterDifficulty("all");
    setFilterBanca("all");
    setFilterAno("all");
    setFilterMacro("all");
  };

  const hasActiveFilters = filterDifficulty !== "all" || filterBanca !== "all" || filterAno !== "all" || filterMacro !== "all" || searchTerm;

  if (isLoading) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <div className="animate-pulse space-y-3">
          <FileQuestion className="h-12 w-12 mx-auto opacity-50" />
          <p>Carregando questões...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Layers className="h-5 w-5 text-primary" />
          Questões do Simulado
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(showFilters && "bg-primary/10 border-primary")}
          >
            <Filter className="h-4 w-4 mr-1" />
            Filtros
          </Button>
          <Badge 
            variant={selectedIds.length > 0 ? "default" : "destructive"} 
            className="gap-1 px-3 py-1.5"
          >
            {selectedIds.length > 0 ? (
              <><CheckCircle2 className="h-3 w-3" />{selectedIds.length}</>
            ) : (
              <><AlertCircle className="h-3 w-3" />0</>
            )}
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-2 h-10">
          <TabsTrigger value="available" className="gap-2">
            <Grid3X3 className="h-4 w-4" />
            Disponíveis ({allQuestions.length - selectedIds.length})
          </TabsTrigger>
          <TabsTrigger value="selected" className="gap-2">
            <ArrowUpDown className="h-4 w-4" />
            Selecionadas ({selectedIds.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="mt-3 space-y-3">
          {/* Filters Bar */}
          {showFilters && (
            <div className="p-3 rounded-lg bg-muted/30 border space-y-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar no enunciado..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9 bg-background"
                />
              </div>

              {/* Filter dropdowns */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Dificuldade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas dificuldades</SelectItem>
                    {filterOptions.difficulties.map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterBanca} onValueChange={setFilterBanca}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Banca" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas bancas</SelectItem>
                    {filterOptions.bancas.map(b => (
                      <SelectItem key={b} value={b}>{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterAno} onValueChange={setFilterAno}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Ano" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos anos</SelectItem>
                    {filterOptions.anos.map(a => (
                      <SelectItem key={a} value={a.toString()}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterMacro} onValueChange={setFilterMacro}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Macro" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos macros</SelectItem>
                    {filterOptions.macros.map(m => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Actions row */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-muted-foreground">
                  {filteredQuestions.length} questões encontradas
                </span>
                <div className="flex gap-2">
                  {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={handleClearFilters} className="h-7 text-xs">
                      <X className="h-3 w-3 mr-1" />
                      Limpar
                    </Button>
                  )}
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={handleSelectAll}
                    disabled={filteredQuestions.length === 0}
                    className="h-7 text-xs"
                  >
                    <CheckSquare className="h-3 w-3 mr-1" />
                    Selecionar todos ({filteredQuestions.length})
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Questions Grid */}
          <ScrollArea className="h-[500px] border rounded-xl p-3 bg-gradient-to-b from-muted/10 to-muted/30">
            {filteredQuestions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {filteredQuestions.map((q) => (
                  <CompactCard 
                    key={q.id} 
                    question={q} 
                    isSelected={selectedIds.includes(q.id)}
                    onToggle={handleToggle} 
                  />
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-muted-foreground">
                <FileQuestion className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-base font-medium">
                  {hasActiveFilters ? "Nenhuma questão com esses filtros" : "Todas selecionadas!"}
                </p>
                {hasActiveFilters && (
                  <Button variant="link" onClick={handleClearFilters} className="mt-2">
                    Limpar filtros
                  </Button>
                )}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="selected" className="mt-3">
          {selectedIds.length > 0 ? (
            <>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30 mb-2">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <GripVertical className="h-3 w-3" />
                  Arraste para reordenar
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onChange([])}
                  className="h-6 text-xs text-destructive hover:text-destructive"
                >
                  Remover todas
                </Button>
              </div>
              <ScrollArea className="h-[500px] border rounded-xl p-2 bg-gradient-to-b from-muted/10 to-muted/30">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={selectedIds}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-1">
                      {selectedQuestions.map((q, index) => (
                        <SortableQuestion
                          key={q.id}
                          question={q}
                          index={index}
                          onRemove={handleRemove}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </ScrollArea>
            </>
          ) : (
            <div className="py-16 text-center text-muted-foreground border rounded-xl bg-muted/20">
              <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-base font-medium">Nenhuma questão selecionada</p>
              <p className="text-sm mt-1 opacity-70">
                Clique nas questões na aba "Disponíveis"
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
