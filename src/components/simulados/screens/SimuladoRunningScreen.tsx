/**
 * 🎯 SIMULADOS — Tela RUNNING (Estilo Print)
 * Constituição SYNAPSE Ω v10.0
 * 
 * Layout: Header + Timer Bar + 2 Colunas (Questão + Navegação)
 * Feature: Tesoura (Scissors) para eliminar alternativas
 */

import React, { useState, useCallback } from "react";
import { 
  ChevronLeft, ChevronRight, Flag, AlertTriangle, ArrowLeft, Scissors
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Simulado, 
  SimuladoAttempt,
  SimuladoQuestion,
  SimuladoAnswer,
} from "@/components/simulados/types";
import { 
  SimuladoCameraWidget, 
  SimuladoRetakeBadge,
} from "@/components/simulados/widgets";
import { SimuladoTimerBar } from "@/components/simulados/widgets/SimuladoTimerBar";
import { SimuladoQuestionNavGrid } from "@/components/simulados/widgets/SimuladoQuestionNavGrid";
import { cn } from "@/lib/utils";

interface SimuladoRunningScreenProps {
  simulado: Simulado;
  attempt: SimuladoAttempt;
  questions: SimuladoQuestion[];
  answers: Map<string, SimuladoAnswer>;
  
  // Timer
  remainingSeconds: number;
  isTimeWarning: boolean;
  isTimeCritical: boolean;
  
  // Hard Mode
  tabSwitches: number;
  maxTabSwitches: number;
  isCameraActive: boolean;
  cameraError: string | null;
  onRequestCamera: () => void;
  
  // Ações
  onSelectAnswer: (questionId: string, optionKey: string) => Promise<void>;
  onFinish: () => Promise<void>;
  onTimeUp: () => void;
  onExit?: () => void;
  
  // Estado
  isSaving: boolean;
  isFinishing: boolean;
}

export function SimuladoRunningScreen({
  simulado,
  attempt,
  questions,
  answers,
  remainingSeconds,
  isTimeWarning,
  isTimeCritical,
  tabSwitches,
  maxTabSwitches,
  isCameraActive,
  cameraError,
  onRequestCamera,
  onSelectAnswer,
  onFinish,
  onTimeUp,
  onExit,
  isSaving,
  isFinishing,
}: SimuladoRunningScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [selectingOption, setSelectingOption] = useState<string | null>(null);
  
  // 🔪 Estado de alternativas eliminadas por questão
  // Map<questionId, Set<optionKey>>
  const [eliminatedOptions, setEliminatedOptions] = useState<Map<string, Set<string>>>(new Map());

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers.get(currentQuestion?.id);
  const isRetake = !attempt.is_scored_for_ranking;

  // Set de alternativas eliminadas para a questão atual
  const currentEliminated = eliminatedOptions.get(currentQuestion?.id) ?? new Set<string>();

  // Navegação
  const goToNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [currentIndex, questions.length]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [currentIndex]);

  const goToQuestion = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // Selecionar resposta (não pode selecionar eliminada)
  const handleSelectOption = useCallback(async (optionKey: string) => {
    if (!currentQuestion || selectingOption) return;
    
    // Não pode selecionar alternativa eliminada
    const eliminated = eliminatedOptions.get(currentQuestion.id) ?? new Set<string>();
    if (eliminated.has(optionKey)) return;
    
    setSelectingOption(optionKey);
    try {
      await onSelectAnswer(currentQuestion.id, optionKey);
    } finally {
      setSelectingOption(null);
    }
  }, [currentQuestion, selectingOption, onSelectAnswer, eliminatedOptions]);

  // 🔪 Toggle eliminar alternativa
  const handleToggleEliminate = useCallback((optionKey: string) => {
    if (!currentQuestion) return;
    
    // Não pode eliminar a alternativa selecionada
    const selectedOption = answers.get(currentQuestion.id)?.selectedOption;
    if (selectedOption === optionKey) return;
    
    setEliminatedOptions(prev => {
      const newMap = new Map(prev);
      const currentSet = new Set(newMap.get(currentQuestion.id) ?? []);
      
      if (currentSet.has(optionKey)) {
        // Restaurar
        currentSet.delete(optionKey);
      } else {
        // Eliminar
        currentSet.add(optionKey);
      }
      
      newMap.set(currentQuestion.id, currentSet);
      return newMap;
    });
  }, [currentQuestion, answers]);

  // Confirmar finalização
  const handleConfirmFinish = useCallback(async () => {
    setShowFinishDialog(false);
    await onFinish();
  }, [onFinish]);

  // Mapa de respondidas para navegação
  const answeredMap = new Map<number, boolean>();
  questions.forEach((q, i) => {
    const ans = answers.get(q.id);
    answeredMap.set(i, ans?.selectedOption !== null && ans?.selectedOption !== undefined);
  });

  const answeredCount = Array.from(answers.values()).filter(a => a.selectedOption !== null).length;

  if (!currentQuestion) {
    return null;
  }

  // Ordenar opções por chave (A, B, C, D, E)
  const sortedOptions = Object.entries(currentQuestion.options || {}).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header - Estilo Print */}
      <div className="border-b border-border px-4 py-3 bg-background">
        <div className="flex items-center gap-3">
          {onExit && (
            <button 
              onClick={onExit}
              className="p-1 hover:bg-muted rounded-full transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </button>
          )}
          <div>
            <h1 className="font-semibold text-foreground line-clamp-1">{simulado.title}</h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Simulado</span>
              {isRetake && <SimuladoRetakeBadge attemptNumber={attempt.attempt_number} />}
            </div>
          </div>
          
          {/* Hard Mode indicators */}
          <div className="ml-auto flex items-center gap-3">
            {simulado.is_hard_mode && simulado.requires_camera && (
              <SimuladoCameraWidget
                isActive={isCameraActive}
                error={cameraError}
                onRequestCamera={onRequestCamera}
              />
            )}
            {simulado.is_hard_mode && (
              <div className={cn(
                "px-3 py-1 rounded-full text-xs font-medium",
                tabSwitches >= maxTabSwitches - 1 ? "bg-red-500/20 text-red-400" : "bg-muted text-muted-foreground"
              )}>
                Abas: {tabSwitches}/{maxTabSwitches}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Timer Bar - Estilo Print (vermelho) */}
      <SimuladoTimerBar
        remainingSeconds={remainingSeconds}
        isWarning={isTimeWarning}
        isCritical={isTimeCritical}
        onTimeUp={onTimeUp}
      />

      {/* Conteúdo Principal - 2 Colunas */}
      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        {/* Coluna Principal - Card da Questão */}
        <div className="flex-1 overflow-y-auto">
          <Card className="bg-card border-border h-full">
            <CardContent className="p-6">
              {/* Pergunta X - Verde */}
              <p className="text-green-500 font-medium mb-4">
                Pergunta {currentIndex + 1}
              </p>

              {/* Título centralizado - Vermelho */}
              {currentQuestion.banca && (
                <h2 className="text-center text-xl font-bold text-red-500 mb-2">
                  QUESTÃO {currentQuestion.banca.toUpperCase()} {currentQuestion.ano || ""}
                </h2>
              )}
              
              {/* Autor/Professor */}
              <p className="text-center font-bold text-foreground mb-6">
                PROF.MOISÉS MEDEIROS
              </p>

              {/* Enunciado */}
              <div className="prose prose-invert max-w-none mb-6">
                <p className="text-base leading-relaxed text-foreground/90 whitespace-pre-wrap text-justify">
                  {currentQuestion.question_text}
                </p>
                {currentQuestion.image_url && (
                  <img
                    src={currentQuestion.image_url}
                    alt="Imagem da questão"
                    className="max-h-[500px] rounded-lg mt-4 mx-auto"
                  />
                )}
              </div>

              {/* Alternativas - Estilo Print com Tesoura */}
              <div className="space-y-3">
                {sortedOptions.map(([key, optionValue]) => {
                  const isSelected = currentAnswer?.selectedOption === key;
                  const isSelecting = selectingOption === key;
                  const isEliminated = currentEliminated.has(key);

                  // Extrair texto: pode ser string ou objeto {id, text}
                  const rawText: unknown =
                    typeof optionValue === "string"
                      ? optionValue
                      : (optionValue as { text?: unknown })?.text ?? optionValue;

                  // Garantia anti-"React child object": sempre coerção para string
                  const optionText =
                    typeof rawText === "string" ? rawText : rawText == null ? "" : String(rawText);

                  return (
                    <div
                      key={key}
                      className={cn(
                        "w-full p-4 rounded-lg border text-left transition-all flex items-center justify-between gap-2",
                        // Estado: Eliminada
                        isEliminated && "opacity-40 bg-zinc-800/50 border-zinc-600",
                        // Estado: Selecionada
                        isSelected && !isEliminated && "border-green-500 bg-green-600/20",
                        // Estado: Normal
                        !isSelected && !isEliminated && "border-zinc-700 bg-zinc-800/50 hover:border-primary/50 hover:bg-zinc-800",
                        isSelecting && "opacity-50"
                      )}
                    >
                      {/* Área clicável para selecionar */}
                      <button
                        onClick={() => handleSelectOption(key)}
                        disabled={isSelecting || isFinishing || isEliminated}
                        className={cn(
                          "flex items-center gap-3 flex-1 text-left",
                          isEliminated && "cursor-not-allowed"
                        )}
                      >
                        {/* Círculo com letra A, B, C, D, E */}
                        <div
                          className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all font-bold text-lg",
                            isSelected 
                              ? "bg-green-600 text-white" 
                              : "bg-zinc-700 text-foreground",
                            isEliminated && "bg-zinc-700/50 text-zinc-500"
                          )}
                        >
                          {key.toUpperCase()}
                        </div>
                        
                        {/* Texto da alternativa */}
                        <span className={cn(
                          "text-foreground/90 flex-1",
                          isEliminated && "line-through"
                        )}>
                          {optionText}
                        </span>
                      </button>
                      
                      {/* Botão Tesoura (Eliminar) - NÃO aparece se estiver selecionada */}
                      {!isSelected && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleEliminate(key);
                          }}
                          className={cn(
                            "shrink-0 p-2 rounded-full transition-colors",
                            isEliminated 
                              ? "text-red-500 hover:text-zinc-400 hover:bg-zinc-700/50" 
                              : "text-zinc-400 hover:text-red-400 hover:bg-red-400/10"
                          )}
                          title={isEliminated ? "Restaurar alternativa" : "Eliminar alternativa"}
                        >
                          <Scissors className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Footer com navegação */}
              <div className="flex items-center justify-between mt-8 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    onClick={goToPrev}
                    disabled={currentIndex === 0}
                    className="text-muted-foreground"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>
                  
                  <Button
                    variant="secondary"
                    onClick={goToNext}
                    disabled={currentIndex === questions.length - 1}
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>

                <Button
                  onClick={() => setShowFinishDialog(true)}
                  disabled={isFinishing}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Flag className="h-4 w-4 mr-2" />
                  Finalizar Simulado
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna Lateral - Navegação Grid (Desktop) */}
        <div className="w-64 shrink-0 hidden lg:block">
          <SimuladoQuestionNavGrid
            total={questions.length}
            current={currentIndex}
            answeredMap={answeredMap}
            onNavigate={goToQuestion}
          />
        </div>
      </div>

      {/* Navegação Mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-border p-3 bg-background/95 backdrop-blur">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPrev}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} / {questions.length}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={goToNext}
            disabled={currentIndex === questions.length - 1}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Dialog de confirmação */}
      <AlertDialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalizar Simulado?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Você respondeu {answeredCount} de {questions.length} questões.
              </p>
              {answeredCount < questions.length && (
                <p className="text-amber-400 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Existem {questions.length - answeredCount} questões não respondidas.
                </p>
              )}
              <p>
                Após finalizar, você não poderá alterar suas respostas.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar Respondendo</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmFinish} disabled={isFinishing}>
              {isFinishing ? "Finalizando..." : "Confirmar Finalização"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
