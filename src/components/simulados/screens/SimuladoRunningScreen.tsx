/**
 * 🎯 SIMULADOS — Tela RUNNING (Year 2300 Cinematic HUD)
 * Constituição SYNAPSE Ω v10.0
 * 
 * Layout: HUD Header + Timer Holográfico + 2 Colunas (Questão Premium + Navegação)
 * Feature: Tesoura (Scissors) para eliminar alternativas
 * Design: Estilo Iron Man / Marvel Futurístico
 */

import React, { useState, useCallback } from "react";
import { 
  ChevronLeft, ChevronRight, Flag, AlertTriangle, ArrowLeft, Scissors,
  Clock, Target, Zap, Shield, Eye, Camera
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
  formatTime,
} from "@/components/simulados/types";
import { 
  SimuladoCameraWidget, 
  SimuladoRetakeBadge,
} from "@/components/simulados/widgets";
import { SimuladoQuestionNavGrid } from "@/components/simulados/widgets/SimuladoQuestionNavGrid";
import { cn } from "@/lib/utils";
import QuestionTextField from "@/components/shared/QuestionTextField";
import { useConstitutionPerformance } from "@/hooks/useConstitutionPerformance";

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
  // 🏛️ CONSTITUIÇÃO - Performance Tiering completo
  const { 
    isLowEnd, 
    shouldAnimate, 
    shouldBlur, 
    shouldShowShadows,
    shouldShowGradients,
    getBlurClass 
  } = useConstitutionPerformance();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [selectingOption, setSelectingOption] = useState<string | null>(null);
  
  // 🔪 Estado de alternativas eliminadas por questão
  const [eliminatedOptions, setEliminatedOptions] = useState<Map<string, Set<string>>>(new Map());

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers.get(currentQuestion?.id);
  const isRetake = !attempt.is_scored_for_ranking;

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

  // Selecionar resposta
  const handleSelectOption = useCallback(async (optionKey: string) => {
    if (!currentQuestion || selectingOption) return;
    
    const eliminated = eliminatedOptions.get(currentQuestion.id) ?? new Set<string>();
    if (eliminated.has(optionKey)) return;
    
    setSelectingOption(optionKey);
    try {
      await onSelectAnswer(currentQuestion.id, optionKey);
    } finally {
      setSelectingOption(null);
    }
  }, [currentQuestion, selectingOption, onSelectAnswer, eliminatedOptions]);

  // Toggle eliminar alternativa
  const handleToggleEliminate = useCallback((optionKey: string) => {
    if (!currentQuestion) return;
    
    const selectedOption = answers.get(currentQuestion.id)?.selectedOption;
    if (selectedOption === optionKey) return;
    
    setEliminatedOptions(prev => {
      const newMap = new Map(prev);
      const currentSet = new Set(newMap.get(currentQuestion.id) ?? []);
      
      if (currentSet.has(optionKey)) {
        currentSet.delete(optionKey);
      } else {
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

  const sortedOptions = Object.entries(currentQuestion.options || {}).sort(([a], [b]) => a.localeCompare(b));
  const displayTime = formatTime(Math.max(0, remainingSeconds));

  return (
    <div className="flex flex-col h-full bg-zinc-950 relative overflow-hidden">
      {/* === BACKGROUND EFFECTS === */}
      {!isLowEnd && shouldShowGradients && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Ambient glow */}
          <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-cyan-500/5 rounded-full blur-[150px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] bg-green-500/5 rounded-full blur-[120px]" />
          
          {/* Grid overlay */}
          <div 
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(6, 182, 212, 0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(6, 182, 212, 0.3) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px'
            }}
          />
        </div>
      )}

      {/* === HEADER HUD === */}
      <div className={cn(
        "relative z-10 border-b border-cyan-500/20 bg-zinc-950/90",
        shouldBlur && "backdrop-blur-xl"
      )}>
        <div className="px-4 py-3">
          <div className="flex items-center gap-4">
            {/* Exit Button - Left */}
            {onExit && (
              <button 
                onClick={onExit}
                className="p-2 hover:bg-cyan-500/10 rounded-xl transition-all border border-transparent hover:border-cyan-500/30 group flex-shrink-0"
              >
                <ArrowLeft className="h-5 w-5 text-zinc-400 group-hover:text-cyan-400 transition-colors" />
              </button>
            )}
            
            {/* Title Section - CENTERED */}
            <div className="flex-1 text-center">
              <h1 className="font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-green-400 to-cyan-400 line-clamp-1">
                {simulado.title}
              </h1>
              <div className="flex items-center justify-center gap-3 text-xs text-zinc-500">
                <span className="flex items-center gap-1">
                  <Target className="h-3 w-3 text-cyan-400" />
                  Simulado Ativo
                </span>
                {isRetake && <SimuladoRetakeBadge attemptNumber={attempt.attempt_number} />}
              </div>
            </div>
            
            {/* Hard Mode Indicators - Right */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {simulado.is_hard_mode && simulado.requires_camera && (
                <SimuladoCameraWidget
                  isActive={isCameraActive}
                  error={cameraError}
                  onRequestCamera={onRequestCamera}
                />
              )}
              {simulado.is_hard_mode && (
                <div className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all",
                  tabSwitches >= maxTabSwitches - 1 
                    ? "bg-red-500/20 border-red-500/50 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]" 
                    : "bg-zinc-800/50 border-zinc-700/50 text-zinc-400"
                )}>
                  <Eye className="h-3.5 w-3.5" />
                  {tabSwitches}/{maxTabSwitches}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* === TIMER BAR HOLOGRÁFICO === */}
      <div className={cn(
        "relative z-10 py-3 flex items-center justify-center gap-4 transition-all duration-500",
        isTimeCritical && "bg-gradient-to-r from-red-950/80 via-red-900/90 to-red-950/80",
        isTimeWarning && !isTimeCritical && "bg-gradient-to-r from-amber-950/60 via-amber-900/70 to-amber-950/60",
        !isTimeWarning && !isTimeCritical && "bg-gradient-to-r from-zinc-900/80 via-zinc-800/90 to-zinc-900/80"
      )}>
        {/* Glow effect - only on high-end with gradients */}
        {!isLowEnd && shouldShowGradients && (
          <div className={cn(
            "absolute inset-0 opacity-50",
            isTimeCritical && "bg-gradient-to-r from-transparent via-red-500/20 to-transparent animate-pulse",
            isTimeWarning && !isTimeCritical && "bg-gradient-to-r from-transparent via-amber-500/15 to-transparent",
          )} />
        )}
        
        <div className="relative flex items-center gap-4">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center border transition-all",
            isTimeCritical && "bg-red-500/30 border-red-500/50",
            isTimeCritical && shouldShowShadows && "shadow-[0_0_20px_rgba(239,68,68,0.4)]",
            isTimeWarning && !isTimeCritical && "bg-amber-500/20 border-amber-500/40",
            !isTimeWarning && !isTimeCritical && "bg-cyan-500/10 border-cyan-500/30"
          )}>
            <Clock className={cn(
              "h-5 w-5 transition-colors",
              isTimeCritical && "text-red-400",
              isTimeCritical && shouldAnimate && "animate-pulse",
              isTimeWarning && !isTimeCritical && "text-amber-400",
              !isTimeWarning && !isTimeCritical && "text-cyan-400"
            )} />
          </div>
          
          <div className="flex flex-col">
            <span className="text-xs text-zinc-500 uppercase tracking-widest">Tempo Restante</span>
            <span className={cn(
              "text-2xl font-mono font-bold tracking-wider",
              isTimeCritical && "text-red-400",
              isTimeWarning && !isTimeCritical && "text-amber-400",
              !isTimeWarning && !isTimeCritical && "text-cyan-400"
            )}>
              {displayTime}
            </span>
          </div>
          
          {/* Progress indicators */}
          <div className="flex items-center gap-2 ml-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30">
              <Zap className="h-3.5 w-3.5 text-green-400" />
              <span className="text-xs font-bold text-green-400">{answeredCount}/{questions.length}</span>
            </div>
          </div>
        </div>
        
        {/* Decorative lines */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-cyan-500/50 to-transparent" />
        <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-cyan-500/50 to-transparent" />
      </div>

      {/* === CONTEÚDO PRINCIPAL === */}
      <div className="flex-1 flex overflow-hidden p-4 gap-4 relative z-10">
        <div className="flex-1 overflow-y-auto">
          <div className="relative">
            {/* Card Glow Border - only on high-end with shadows */}
            {!isLowEnd && shouldShowShadows && (
              <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-cyan-500/30 via-green-500/20 to-purple-500/30 opacity-60 blur-sm" />
            )}
            
            {/* Main Card */}
            <div className={cn(
              "relative rounded-2xl bg-zinc-900/95 border border-zinc-800/60 overflow-hidden",
              shouldBlur && "backdrop-blur-xl",
              shouldShowShadows && "shadow-2xl"
            )}>
              {/* Question Header HUD */}
              <div className={cn(
                "px-6 py-4 border-b border-zinc-800/50",
                shouldShowGradients && "bg-gradient-to-r from-zinc-900/80 via-zinc-950 to-zinc-900/80"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className={cn(
                        "w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center",
                        shouldShowShadows && "shadow-[0_0_20px_rgba(34,197,94,0.4)]"
                      )}>
                        <span className="text-xl font-black text-white">{currentIndex + 1}</span>
                      </div>
                      {!isLowEnd && shouldShowShadows && <div className="absolute inset-0 rounded-xl bg-green-400/30 blur-md" />}
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-green-400 font-bold">
                        Questão {currentIndex + 1} de {questions.length}
                      </p>
                      {currentQuestion.banca && (
                        <p className="text-sm text-zinc-400">
                          {currentQuestion.banca.toUpperCase()} {currentQuestion.ano || ""}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Professor Badge */}
                  <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      Prof. Moisés Medeiros
                    </span>
                  </div>
                </div>
              </div>

              {/* Question Content */}
              <div className="p-6">
                {/* Enunciado */}
                <div className="mb-8">
                  <QuestionTextField
                    content={currentQuestion.question_text}
                    fieldType="enunciado"
                    className="text-base leading-relaxed text-zinc-200"
                    justify
                  />
                  {currentQuestion.image_url && (
                    <img
                      src={currentQuestion.image_url}
                      alt="Imagem da questão"
                      className="max-h-[500px] rounded-xl mt-6 mx-auto border border-zinc-700/50 shadow-xl"
                    />
                  )}
                </div>

                {/* Alternativas Premium */}
                <div className="space-y-3">
                  {sortedOptions.map(([key, optionValue], idx) => {
                    const isSelected = currentAnswer?.selectedOption === key;
                    const isSelecting = selectingOption === key;
                    const isEliminated = currentEliminated.has(key);
                    const letterLabel = String.fromCharCode(65 + idx);

                    const rawText: unknown =
                      typeof optionValue === "string"
                        ? optionValue
                        : (optionValue as { text?: unknown })?.text ?? optionValue;

                    const optionText =
                      typeof rawText === "string" ? rawText : rawText == null ? "" : String(rawText);

                    return (
                      <div
                        key={key}
                        className={cn(
                          "relative w-full rounded-xl transition-all duration-300 flex items-center justify-between gap-3 group",
                          // Eliminada
                          isEliminated && "opacity-40",
                          // Selecionada - Glow verde (apenas se shadows ativo)
                          isSelected && !isEliminated && shouldShowShadows && "shadow-[0_0_25px_rgba(34,197,94,0.3)]",
                          isSelecting && "opacity-50"
                        )}
                      >
                        {/* Border glow para selecionada - apenas high-end com shadows */}
                        {isSelected && !isEliminated && !isLowEnd && shouldShowShadows && (
                          <div className="absolute -inset-[1px] rounded-xl bg-gradient-to-r from-green-500/50 via-green-400/30 to-green-500/50 blur-sm" />
                        )}
                        
                        <div className={cn(
                          "relative flex-1 p-4 rounded-xl border transition-all flex items-center gap-4",
                          // Eliminada
                          isEliminated && "bg-zinc-900/50 border-zinc-800/50",
                          // Selecionada
                          isSelected && !isEliminated && "bg-green-500/15 border-green-500/50",
                          // Normal
                          !isSelected && !isEliminated && "bg-zinc-800/40 border-zinc-700/50 hover:border-cyan-500/40 hover:bg-zinc-800/60"
                        )}>
                          {/* Área clicável */}
                          <button
                            onClick={() => handleSelectOption(key)}
                            disabled={isSelecting || isFinishing || isEliminated}
                            className={cn(
                              "flex items-center gap-4 flex-1 text-left",
                              isEliminated && "cursor-not-allowed"
                            )}
                          >
                            <div
                              className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all font-black text-lg border",
                                isSelected 
                                  ? cn(
                                      "bg-gradient-to-br from-green-500 to-green-600 text-white border-green-400/50",
                                      shouldShowShadows && "shadow-[0_0_15px_rgba(34,197,94,0.5)]"
                                    )
                                  : "bg-zinc-800 text-zinc-300 border-zinc-700/50 group-hover:border-cyan-500/40 group-hover:text-cyan-400",
                                isEliminated && "bg-zinc-900 text-zinc-600 border-zinc-800"
                              )}
                            >
                              {letterLabel}
                            </div>
                            
                            {/* Texto */}
                            <QuestionTextField
                              content={optionText}
                              fieldType="alternativa"
                              className={cn(
                                "flex-1 text-sm",
                                isSelected && "text-green-100",
                                !isSelected && !isEliminated && "text-zinc-300",
                                isEliminated && "line-through text-zinc-600"
                              )}
                              inline
                            />
                          </button>
                          
                          {/* Botão Tesoura */}
                          {!isSelected && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleEliminate(key);
                              }}
                              className={cn(
                                "shrink-0 p-2.5 rounded-xl transition-all border",
                                isEliminated 
                                  ? "text-red-400 bg-red-500/20 border-red-500/30 hover:bg-zinc-800 hover:border-zinc-700 hover:text-zinc-400" 
                                  : "text-zinc-500 bg-zinc-800/50 border-zinc-700/50 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/30"
                              )}
                              title={isEliminated ? "Restaurar alternativa" : "Eliminar alternativa"}
                            >
                              <Scissors className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer Navegação */}
              <div className="px-6 py-4 border-t border-zinc-800/50 bg-zinc-900/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={goToPrev}
                      disabled={currentIndex === 0}
                      className="border-zinc-700 bg-zinc-800/50 hover:bg-zinc-700/50 hover:border-cyan-500/40"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </Button>
                    
                    <Button
                      onClick={goToNext}
                      disabled={currentIndex === questions.length - 1}
                      className={cn(
                        "bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400",
                        shouldShowShadows && "shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                      )}
                    >
                      Próxima
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>

                  <Button
                    onClick={() => setShowFinishDialog(true)}
                    disabled={isFinishing}
                    className={cn(
                      "bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400",
                      shouldShowShadows && "shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                    )}
                  >
                    <Flag className="h-4 w-4 mr-2" />
                    Finalizar Simulado
                  </Button>
                </div>
              </div>

              {/* Corner Accents */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-500/40 rounded-tl-2xl pointer-events-none" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-green-500/40 rounded-tr-2xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-purple-500/40 rounded-bl-2xl pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-500/40 rounded-br-2xl pointer-events-none" />
            </div>
          </div>
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
      <div className={cn("lg:hidden fixed bottom-0 left-0 right-0 border-t border-cyan-500/20 p-3 bg-zinc-950/95 z-20", shouldBlur && "backdrop-blur-xl")}>
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPrev}
            disabled={currentIndex === 0}
            className="border-zinc-700"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
              <span className="text-sm font-bold text-white">{currentIndex + 1}</span>
            </div>
            <span className="text-sm text-zinc-400">/ {questions.length}</span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={goToNext}
            disabled={currentIndex === questions.length - 1}
            className="border-zinc-700"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Dialog de confirmação */}
      <AlertDialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <AlertDialogContent useOriginalSize className="max-w-md bg-zinc-900 border-cyan-500/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-green-400">
              Finalizar Simulado?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 text-zinc-400">
              <p>
                Você respondeu <span className="text-green-400 font-bold">{answeredCount}</span> de <span className="text-cyan-400 font-bold">{questions.length}</span> questões.
              </p>
              {answeredCount < questions.length && (
                <p className="text-amber-400 flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
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
            <AlertDialogCancel className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700">
              Continuar Respondendo
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmFinish} 
              disabled={isFinishing}
              className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400"
            >
              {isFinishing ? "Finalizando..." : "Confirmar Finalização"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
