/**
 * 🎯 SIMULADOS — Seletor de Questões com Drag-and-Drop
 * Constituição SYNAPSE Ω v10.0
 * 
 * Permite selecionar e ORDENAR questões do simulado
 * UI expandida para melhor visualização
 */

import { useState, useMemo } from "react";
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
  Eye
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

  // Limpa o texto de HTML e mostra mais caracteres
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
        "flex items-start gap-3 p-4 rounded-lg border bg-card/80 backdrop-blur transition-all",
        isDragging && "opacity-50 shadow-lg ring-2 ring-primary"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-2 hover:bg-muted rounded mt-1 shrink-0"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </button>
      
      <Badge 
        variant="default" 
        className="shrink-0 w-10 h-10 justify-center text-lg font-bold rounded-lg"
      >
        {index + 1}
      </Badge>
      
      <div className="flex-1 min-w-0 space-y-2">
        <p className="text-sm leading-relaxed line-clamp-3">
          {cleanText.substring(0, 200)}{cleanText.length > 200 ? "..." : ""}
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge 
            variant="secondary" 
            className={cn(
              "text-xs px-2 py-1",
              question.difficulty === "facil" && "bg-green-500/20 text-green-400",
              question.difficulty === "medio" && "bg-yellow-500/20 text-yellow-400",
              question.difficulty === "dificil" && "bg-red-500/20 text-red-400"
            )}
          >
            {question.difficulty || "?"}
          </Badge>
          {question.banca && (
            <Badge variant="outline" className="text-xs px-2 py-1">
              {question.banca}
            </Badge>
          )}
          {question.ano && (
            <Badge variant="outline" className="text-xs px-2 py-1">
              {question.ano}
            </Badge>
          )}
          {question.macro && (
            <Badge variant="outline" className="text-xs px-2 py-1 bg-primary/10 text-primary">
              {question.macro}
            </Badge>
          )}
        </div>
      </div>
      
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
        onClick={() => onRemove(question.id)}
      >
        <Minus className="h-5 w-5" />
      </Button>
    </div>
  );
}

interface QuestionCardProps {
  question: Question;
  onAdd: (id: string) => void;
}

function QuestionCard({ question, onAdd }: QuestionCardProps) {
  // Limpa o texto de HTML e mostra mais caracteres
  const cleanText = question.question_text
    ?.replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() || "Sem texto";

  return (
    <div className="flex items-start gap-3 p-4 rounded-lg border bg-card/60 hover:bg-card/90 transition-all hover:border-primary/50">
      <Button
        variant="ghost"
        size="icon"
        className="h-10 w-10 text-primary hover:text-primary-foreground hover:bg-primary shrink-0 mt-1"
        onClick={() => onAdd(question.id)}
      >
        <Plus className="h-5 w-5" />
      </Button>
      
      <div className="flex-1 min-w-0 space-y-2">
        <p className="text-sm leading-relaxed line-clamp-3">
          {cleanText.substring(0, 200)}{cleanText.length > 200 ? "..." : ""}
        </p>
        <div className="flex flex-wrap gap-2">
          <Badge 
            variant="secondary" 
            className={cn(
              "text-xs px-2 py-1",
              question.difficulty === "facil" && "bg-green-500/20 text-green-400",
              question.difficulty === "medio" && "bg-yellow-500/20 text-yellow-400",
              question.difficulty === "dificil" && "bg-red-500/20 text-red-400"
            )}
          >
            {question.difficulty || "?"}
          </Badge>
          {question.banca && (
            <Badge variant="outline" className="text-xs px-2 py-1">
              {question.banca}
            </Badge>
          )}
          {question.ano && (
            <Badge variant="outline" className="text-xs px-2 py-1">
              {question.ano}
            </Badge>
          )}
          {question.macro && (
            <Badge variant="outline" className="text-xs px-2 py-1 bg-primary/10 text-primary">
              {question.macro}
            </Badge>
          )}
          {question.micro && (
            <Badge variant="outline" className="text-xs px-2 py-1">
              {question.micro}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

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
  
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Questões selecionadas na ordem correta
  const selectedQuestions = useMemo(() => {
    return selectedIds
      .map(id => allQuestions.find(q => q.id === id))
      .filter((q): q is Question => q !== undefined);
  }, [selectedIds, allQuestions]);

  // Questões disponíveis (não selecionadas)
  const availableQuestions = useMemo(() => {
    return allQuestions.filter(q => !selectedIds.includes(q.id));
  }, [allQuestions, selectedIds]);

  // Filtradas por busca
  const filteredAvailable = useMemo(() => {
    if (!searchTerm) return availableQuestions;
    const term = searchTerm.toLowerCase();
    return availableQuestions.filter(q =>
      q.question_text?.toLowerCase().includes(term) ||
      q.banca?.toLowerCase().includes(term) ||
      q.difficulty?.toLowerCase().includes(term) ||
      q.ano?.toString().includes(term) ||
      q.macro?.toLowerCase().includes(term) ||
      q.micro?.toLowerCase().includes(term)
    );
  }, [availableQuestions, searchTerm]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = selectedIds.indexOf(active.id as string);
      const newIndex = selectedIds.indexOf(over.id as string);
      onChange(arrayMove(selectedIds, oldIndex, newIndex));
    }
  };

  const handleAdd = (id: string) => {
    onChange([...selectedIds, id]);
  };

  const handleRemove = (id: string) => {
    onChange(selectedIds.filter(i => i !== id));
  };

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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <FileQuestion className="h-5 w-5 text-primary" />
          Questões do Simulado
        </h3>
        <Badge 
          variant={selectedIds.length > 0 ? "default" : "destructive"} 
          className="gap-2 px-3 py-1.5 text-sm"
        >
          {selectedIds.length > 0 ? (
            <>
              <CheckCircle2 className="h-4 w-4" />
              {selectedIds.length} selecionadas
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4" />
              Nenhuma questão
            </>
          )}
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-2 h-12">
          <TabsTrigger value="available" className="gap-2 text-base">
            <Plus className="h-4 w-4" />
            Disponíveis ({availableQuestions.length})
          </TabsTrigger>
          <TabsTrigger value="selected" className="gap-2 text-base">
            <ArrowUpDown className="h-4 w-4" />
            Selecionadas ({selectedIds.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="mt-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar por texto, banca, ano, macro, micro..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 text-base"
            />
          </div>
          
          <ScrollArea className="h-[400px] border rounded-xl p-3 bg-muted/20">
            {filteredAvailable.length > 0 ? (
              <div className="space-y-2">
                {filteredAvailable.map((q) => (
                  <QuestionCard key={q.id} question={q} onAdd={handleAdd} />
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-muted-foreground">
                <FileQuestion className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-base font-medium">
                  {searchTerm ? "Nenhuma questão encontrada" : "Todas as questões já foram selecionadas"}
                </p>
                <p className="text-sm mt-1 opacity-70">
                  {searchTerm && "Tente termos diferentes"}
                </p>
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="selected" className="mt-4">
          {selectedIds.length > 0 ? (
            <>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 mb-3">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Arraste para reordenar as questões do simulado
                </span>
              </div>
              <ScrollArea className="h-[400px] border rounded-xl p-3 bg-muted/20">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={selectedIds}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
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
              <FileQuestion className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-base font-medium">Nenhuma questão selecionada</p>
              <p className="text-sm mt-1 opacity-70">
                Adicione questões na aba "Disponíveis"
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
