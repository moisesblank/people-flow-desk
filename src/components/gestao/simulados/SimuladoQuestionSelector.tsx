/**
 * 🎯 SIMULADOS — Seletor de Questões com Drag-and-Drop
 * Constituição SYNAPSE Ω v10.0
 * 
 * Permite selecionar e ORDENAR questões do simulado
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
  ArrowUpDown
} from "lucide-react";

interface Question {
  id: string;
  question_text: string | null;
  difficulty: string | null;
  banca: string | null;
  ano: number | null;
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 p-2 rounded border bg-card transition-all",
        isDragging && "opacity-50 shadow-lg ring-2 ring-primary"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      
      <Badge variant="outline" className="shrink-0 w-8 justify-center">
        {index + 1}
      </Badge>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">
          {question.question_text?.substring(0, 60) || "Sem texto"}...
        </p>
        <div className="flex gap-1 mt-1">
          <Badge variant="secondary" className="text-xs">{question.difficulty || "?"}</Badge>
          {question.banca && <Badge variant="outline" className="text-xs">{question.banca}</Badge>}
          {question.ano && <Badge variant="outline" className="text-xs">{question.ano}</Badge>}
        </div>
      </div>
      
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-destructive hover:text-destructive"
        onClick={() => onRemove(question.id)}
      >
        <Minus className="h-4 w-4" />
      </Button>
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
      q.ano?.toString().includes(term)
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
      <div className="py-8 text-center text-muted-foreground">
        Carregando questões...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium flex items-center gap-2">
          <FileQuestion className="h-4 w-4" />
          Questões do Simulado
        </h3>
        <Badge variant={selectedIds.length > 0 ? "default" : "destructive"} className="gap-1">
          {selectedIds.length > 0 ? (
            <>
              <CheckCircle2 className="h-3 w-3" />
              {selectedIds.length} selecionadas
            </>
          ) : (
            <>
              <AlertCircle className="h-3 w-3" />
              Nenhuma questão
            </>
          )}
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="available" className="gap-1">
            <Plus className="h-3 w-3" />
            Disponíveis ({availableQuestions.length})
          </TabsTrigger>
          <TabsTrigger value="selected" className="gap-1">
            <ArrowUpDown className="h-3 w-3" />
            Selecionadas ({selectedIds.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="available" className="mt-3 space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por texto, banca, ano..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <ScrollArea className="h-[200px] border rounded-lg p-2">
            {filteredAvailable.length > 0 ? (
              <div className="space-y-1">
                {filteredAvailable.map((q) => (
                  <div
                    key={q.id}
                    className="flex items-center gap-2 p-2 rounded border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-primary hover:text-primary shrink-0"
                      onClick={() => handleAdd(q.id)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">
                        {q.question_text?.substring(0, 60) || "Sem texto"}...
                      </p>
                      <div className="flex gap-1 mt-1">
                        <Badge variant="secondary" className="text-xs">{q.difficulty || "?"}</Badge>
                        {q.banca && <Badge variant="outline" className="text-xs">{q.banca}</Badge>}
                        {q.ano && <Badge variant="outline" className="text-xs">{q.ano}</Badge>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <FileQuestion className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">
                  {searchTerm ? "Nenhuma questão encontrada" : "Todas as questões já foram selecionadas"}
                </p>
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="selected" className="mt-3">
          {selectedIds.length > 0 ? (
            <>
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <GripVertical className="h-3 w-3" />
                Arraste para reordenar as questões
              </p>
              <ScrollArea className="h-[200px] border rounded-lg p-2">
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
            <div className="py-8 text-center text-muted-foreground border rounded-lg">
              <FileQuestion className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma questão selecionada</p>
              <p className="text-xs">Adicione questões na aba "Disponíveis"</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
