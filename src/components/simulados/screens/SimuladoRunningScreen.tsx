/**
 * 🎯 SIMULADOS — Tela RUNNING
 * Constituição SYNAPSE Ω v10.0
 * 
 * Estado: Tentativa em andamento
 * Timer deriva do servidor, respostas persistem em tempo real
 */

import React, { useState, useCallback, useEffect } from "react";
import { 
  ChevronLeft, ChevronRight, Flag, AlertTriangle,
  Save, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  SimuladoTimer, 
  SimuladoCameraWidget, 
  SimuladoProgress,
  SimuladoQuestionNav,
  SimuladoRetakeBadge,
} from "@/components/simulados/widgets";
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
  isSaving,
  isFinishing,
}: SimuladoRunningScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [selectingOption, setSelectingOption] = useState<string | null>(null);

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers.get(currentQuestion?.id);
  const isRetake = !attempt.is_scored_for_ranking;

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

  // Selecionar resposta
  const handleSelectOption = useCallback(async (optionKey: string) => {
    if (!currentQuestion || selectingOption) return;
    
    setSelectingOption(optionKey);
    try {
      await onSelectAnswer(currentQuestion.id, optionKey);
    } finally {
      setSelectingOption(null);
    }
  }, [currentQuestion, selectingOption, onSelectAnswer]);

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

  return (
    <div className="flex flex-col h-full">
      {/* Header fixo */}
      <div className="border-b border-border p-4 bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Info do simulado */}
          <div className="flex items-center gap-4">
            <div>
              <h2 className="font-semibold line-clamp-1">{simulado.title}</h2>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Questão {currentIndex + 1} de {questions.length}
                </span>
                {isRetake && <SimuladoRetakeBadge attemptNumber={attempt.attempt_number} />}
              </div>
            </div>
          </div>

          {/* Timer e controles */}
          <div className="flex items-center gap-4">
            {/* Hard Mode: Camera */}
            {simulado.is_hard_mode && simulado.requires_camera && (
              <SimuladoCameraWidget
                isActive={isCameraActive}
                error={cameraError}
                onRequestCamera={onRequestCamera}
              />
            )}

            {/* Hard Mode: Tab switches */}
            {simulado.is_hard_mode && (
              <div className={cn(
                "px-3 py-1 rounded-full text-sm font-medium",
                tabSwitches >= maxTabSwitches - 1 ? "bg-red-500/20 text-red-400" : "bg-muted text-muted-foreground"
              )}>
                Abas: {tabSwitches}/{maxTabSwitches}
              </div>
            )}

            {/* Timer */}
            <SimuladoTimer
              remainingSeconds={remainingSeconds}
              isWarning={isTimeWarning}
              isCritical={isTimeCritical}
              onTimeUp={onTimeUp}
            />

            {/* Salvo */}
            {isSaving && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Save className="h-4 w-4 animate-pulse" />
                Salvando...
              </div>
            )}
          </div>
        </div>

        {/* Progresso */}
        <div className="mt-4">
          <SimuladoProgress
            current={currentIndex}
            total={questions.length}
            answered={answeredCount}
          />
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navegação lateral (desktop) */}
        <div className="w-auto border-r border-border p-3 hidden lg:block overflow-y-auto">
          <SimuladoQuestionNav
            total={questions.length}
            current={currentIndex}
            answeredMap={answeredMap}
            onNavigate={goToQuestion}
          />
        </div>

        {/* Questão */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Badges da questão */}
          <div className="flex flex-wrap gap-2 mb-4">
            {currentQuestion.difficulty && (
              <span className={cn(
                "px-2 py-1 rounded text-xs font-medium",
                currentQuestion.difficulty === "facil" && "bg-green-500/20 text-green-400",
                currentQuestion.difficulty === "medio" && "bg-amber-500/20 text-amber-400",
                currentQuestion.difficulty === "dificil" && "bg-red-500/20 text-red-400"
              )}>
                {currentQuestion.difficulty}
              </span>
            )}
            {currentQuestion.banca && (
              <span className="px-2 py-1 rounded text-xs bg-secondary text-secondary-foreground">
                {currentQuestion.banca}
              </span>
            )}
            {currentQuestion.ano && (
              <span className="px-2 py-1 rounded text-xs bg-secondary text-secondary-foreground">
                {currentQuestion.ano}
              </span>
            )}
          </div>

          {/* Enunciado */}
          <div className="prose prose-invert max-w-none mb-6">
            <p className="text-lg whitespace-pre-wrap leading-relaxed">
              {currentQuestion.question_text}
            </p>
            {currentQuestion.image_url && (
              <img
                src={currentQuestion.image_url}
                alt="Imagem da questão"
                className="max-h-[500px] rounded-lg mt-4"
              />
            )}
          </div>

          {/* Alternativas */}
          <div className="space-y-3">
            {Object.entries(currentQuestion.options || {}).map(([key, text]) => {
              const isSelected = currentAnswer?.selectedOption === key;
              const isSelecting = selectingOption === key;
              
              return (
                <button
                  key={key}
                  onClick={() => handleSelectOption(key)}
                  disabled={isSelecting || isFinishing}
                  className={cn(
                    "w-full p-4 rounded-lg border text-left transition-all",
                    "hover:border-primary/50 hover:bg-primary/5",
                    isSelected && "border-primary bg-primary/10",
                    !isSelected && "border-border bg-card",
                    isSelecting && "opacity-50"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all",
                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {isSelected ? <Check className="h-4 w-4" /> : key}
                    </div>
                    <p className="flex-1 pt-1">{text}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer navegação */}
      <div className="border-t border-border p-4 bg-background/95 backdrop-blur sticky bottom-0">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={goToPrev}
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Anterior
          </Button>

          {/* Navegação mobile */}
          <div className="flex items-center gap-2 lg:hidden">
            <span className="text-sm text-muted-foreground">
              {currentIndex + 1} / {questions.length}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {currentIndex === questions.length - 1 ? (
              <Button
                onClick={() => setShowFinishDialog(true)}
                disabled={isFinishing}
              >
                <Flag className="h-4 w-4 mr-2" />
                Finalizar
              </Button>
            ) : (
              <Button onClick={goToNext}>
                Próxima
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
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
