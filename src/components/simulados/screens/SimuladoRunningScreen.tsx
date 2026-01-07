/**
 * 🎯 SIMULADOS — Tela RUNNING (Year 2300 Cinematic HUD)
 * Constituição SYNAPSE Ω v10.0
 * 
 * Layout: HUD Header + Timer Holográfico + 2 Colunas (Questão Premium + Navegação)
 * Feature: Tesoura (Scissors) para eliminar alternativas
 * Design: Estilo Iron Man / Marvel Futurístico ULTRA
 * 
 * v11.5: MEGA UI Upgrade - Experiência inesquecível
 */

import React, { useState, useCallback } from "react";
import { 
  ChevronLeft, ChevronRight, Flag, AlertTriangle, ArrowLeft, Scissors,
  Clock, Target, Zap, Shield, Eye, Sparkles, Activity
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
  const progressPercent = (answeredCount / questions.length) * 100;

  if (!currentQuestion) {
    return null;
  }

  const sortedOptions = Object.entries(currentQuestion.options || {}).sort(([a], [b]) => a.localeCompare(b));
  const displayTime = formatTime(Math.max(0, remainingSeconds));

  return (
    <div className="flex flex-col h-full bg-zinc-950 relative overflow-hidden">
      {/* === BACKGROUND EFFECTS ULTRA === */}
      {!isLowEnd && shouldShowGradients && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Nebula effect */}
          <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-cyan-950/20 via-transparent to-transparent" />
          <div className="absolute bottom-0 right-0 w-full h-1/2 bg-gradient-to-t from-green-950/15 via-transparent to-transparent" />
          
          {/* Floating orbs */}
          <div className="absolute top-[10%] left-[5%] w-[400px] h-[400px] bg-cyan-500/8 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute bottom-[10%] right-[10%] w-[300px] h-[300px] bg-green-500/8 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
          <div className="absolute top-[40%] right-[20%] w-[200px] h-[200px] bg-purple-500/5 rounded-full blur-[80px] animate-pulse" style={{ animationDuration: '8s', animationDelay: '1s' }} />
          
          {/* Grid overlay */}
          <div 
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(6, 182, 212, 0.4) 1px, transparent 1px),
                linear-gradient(90deg, rgba(6, 182, 212, 0.4) 1px, transparent 1px)
              `,
              backgroundSize: '80px 80px'
            }}
          />
          
          {/* Scan lines */}
          <div 
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)'
            }}
          />
        </div>
      )}

      {/* === HEADER HUD ULTRA === */}
      <div className={cn(
        "relative z-10 border-b border-cyan-500/30",
        shouldBlur && "backdrop-blur-xl",
        shouldShowGradients 
          ? "bg-gradient-to-r from-zinc-950/95 via-zinc-900/95 to-zinc-950/95" 
          : "bg-zinc-950/90"
      )}>
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/80 to-transparent" />
        
        <div className="px-4 py-3">
          <div className="flex items-center gap-4">
            {/* Exit Button */}
            {onExit && (
              <button 
                onClick={onExit}
                className={cn(
                  "p-2 rounded-xl transition-all border group flex-shrink-0",
                  "bg-zinc-900/50 border-zinc-700/50 hover:border-cyan-500/50 hover:bg-cyan-500/10",
                  shouldShowShadows && "hover:shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                )}
              >
                <ArrowLeft className="h-5 w-5 text-zinc-400 group-hover:text-cyan-400 transition-colors" />
              </button>
            )}
            
            {/* Title Section - CENTERED */}
            <div className="flex-1 text-center">
              <div className="inline-flex items-center gap-3 px-6 py-2 rounded-2xl bg-zinc-900/50 border border-zinc-800/50">
                <div className="relative">
                  <Activity className="h-5 w-5 text-cyan-400" />
                  {!isLowEnd && shouldAnimate && (
                    <div className="absolute inset-0 animate-ping">
                      <Activity className="h-5 w-5 text-cyan-400 opacity-40" />
                    </div>
                  )}
                </div>
                <div className="text-left">
                  <h1 className="font-bold text-xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-green-400 to-cyan-400 line-clamp-1">
                    {simulado.title}
                  </h1>
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500 uppercase tracking-widest">
                    <span>Simulado em Progresso</span>
                    {isRetake && <SimuladoRetakeBadge attemptNumber={attempt.attempt_number} />}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Hard Mode Indicators */}
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
                  "px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all",
                  tabSwitches >= maxTabSwitches - 1 
                    ? cn(
                        "bg-red-500/20 border-red-500/50 text-red-400",
                        shouldAnimate && "animate-pulse",
                        shouldShowShadows && "shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                      )
                    : "bg-zinc-900/80 border-zinc-700/50 text-zinc-400"
                )}>
                  <Eye className="h-4 w-4" />
                  <span>{tabSwitches}/{maxTabSwitches}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* === TIMER BAR ULTRA HOLOGRÁFICO === */}
      <div className={cn(
        "relative z-10 py-4 px-6 transition-all duration-500",
        isTimeCritical 
          ? shouldShowGradients 
            ? "bg-gradient-to-r from-red-950/90 via-red-900/95 to-red-950/90" 
            : "bg-red-950/80"
          : isTimeWarning 
            ? shouldShowGradients 
              ? "bg-gradient-to-r from-amber-950/70 via-amber-900/80 to-amber-950/70" 
              : "bg-amber-950/60"
            : shouldShowGradients
              ? "bg-gradient-to-r from-zinc-900/90 via-zinc-800/95 to-zinc-900/90"
              : "bg-zinc-900/80"
      )}>
        {/* Animated scan effect */}
        {!isLowEnd && shouldAnimate && (
          <div className={cn(
            "absolute inset-0 overflow-hidden opacity-30",
            isTimeCritical && "opacity-50"
          )}>
            <div className={cn(
              "absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent",
              isTimeCritical 
                ? "animate-[scan_1s_linear_infinite]" 
                : "animate-[scan_3s_linear_infinite]"
            )} 
            style={{ 
              animation: `scan ${isTimeCritical ? '1s' : '3s'} linear infinite`,
            }}
            />
          </div>
        )}
        
        <div className="relative flex items-center justify-between max-w-4xl mx-auto">
          {/* Timer Display */}
          <div className="flex items-center gap-4">
            <div className={cn(
              "relative w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all",
              isTimeCritical && cn(
                "bg-red-500/30 border-red-500/70",
                shouldShowShadows && "shadow-[0_0_30px_rgba(239,68,68,0.5)]"
              ),
              isTimeWarning && !isTimeCritical && "bg-amber-500/20 border-amber-500/50",
              !isTimeWarning && !isTimeCritical && cn(
                "bg-cyan-500/15 border-cyan-500/50",
                shouldShowShadows && "shadow-[0_0_25px_rgba(6,182,212,0.3)]"
              )
            )}>
              {/* Inner glow ring */}
              {!isLowEnd && shouldShowShadows && (
                <div className={cn(
                  "absolute inset-1 rounded-xl border",
                  isTimeCritical && "border-red-400/40",
                  isTimeWarning && !isTimeCritical && "border-amber-400/30",
                  !isTimeWarning && !isTimeCritical && "border-cyan-400/30"
                )} />
              )}
              <Clock className={cn(
                "h-6 w-6 transition-colors relative z-10",
                isTimeCritical && "text-red-400",
                isTimeCritical && shouldAnimate && "animate-pulse",
                isTimeWarning && !isTimeCritical && "text-amber-400",
                !isTimeWarning && !isTimeCritical && "text-cyan-400"
              )} />
            </div>
            
            <div className="flex flex-col">
              <span className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-medium">Tempo Restante</span>
              <span className={cn(
                "text-3xl font-mono font-black tracking-wider",
                isTimeCritical && "text-red-400",
                isTimeWarning && !isTimeCritical && "text-amber-400",
                !isTimeWarning && !isTimeCritical && "text-cyan-400"
              )}>
                {displayTime}
              </span>
            </div>
          </div>
          
          {/* Progress Section */}
          <div className="flex items-center gap-6">
            {/* Progress bar visual */}
            <div className="hidden sm:flex flex-col items-end gap-1.5">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Progresso</span>
              <div className="flex items-center gap-3">
                <div className="w-32 h-2 rounded-full bg-zinc-800 overflow-hidden border border-zinc-700/50">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      shouldShowGradients 
                        ? "bg-gradient-to-r from-green-500 via-green-400 to-cyan-400"
                        : "bg-green-500",
                      shouldShowShadows && "shadow-[0_0_10px_rgba(34,197,94,0.5)]"
                    )}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="text-sm font-mono font-bold text-green-400">{Math.round(progressPercent)}%</span>
              </div>
            </div>
            
            {/* Stats orbs */}
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl border transition-all",
                "bg-green-500/10 border-green-500/40",
                shouldShowShadows && "shadow-[0_0_15px_rgba(34,197,94,0.2)]"
              )}>
                <Zap className="h-4 w-4 text-green-400" />
                <span className="text-sm font-bold text-green-400">{answeredCount}</span>
                <span className="text-xs text-zinc-500">/{questions.length}</span>
              </div>
              
              <div className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl border transition-all",
                "bg-purple-500/10 border-purple-500/40",
                shouldShowShadows && "shadow-[0_0_15px_rgba(168,85,247,0.2)]"
              )}>
                <Target className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-bold text-purple-400">Q{currentIndex + 1}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative side accents */}
        <div className="absolute left-0 top-2 bottom-2 w-1 bg-gradient-to-b from-transparent via-cyan-500/60 to-transparent rounded-r-full" />
        <div className="absolute right-0 top-2 bottom-2 w-1 bg-gradient-to-b from-transparent via-green-500/60 to-transparent rounded-l-full" />
      </div>

      {/* === CONTEÚDO PRINCIPAL === */}
      <div className="flex-1 flex overflow-hidden p-4 gap-4 relative z-10">
        <div className="flex-1 overflow-y-auto">
          <div className="relative">
            {/* Card Glow Border ULTRA */}
            {!isLowEnd && shouldShowShadows && (
              <div className="absolute -inset-[2px] rounded-3xl bg-gradient-to-br from-cyan-500/40 via-green-500/30 to-purple-500/40 opacity-70 blur-md" />
            )}
            
            {/* Main Card */}
            <div className={cn(
              "relative rounded-3xl bg-zinc-900/98 border-2 border-zinc-800/60 overflow-hidden",
              shouldBlur && "backdrop-blur-xl",
              shouldShowShadows && "shadow-2xl"
            )}>
              {/* Question Header HUD ULTRA */}
              <div className={cn(
                "px-6 py-5 border-b-2 border-zinc-800/50 relative overflow-hidden",
                shouldShowGradients && "bg-gradient-to-r from-zinc-900/90 via-zinc-950/95 to-zinc-900/90"
              )}>
                {/* Decorative line */}
                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Question Number Badge ULTRA */}
                    <div className="relative">
                      <div className={cn(
                        "w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 via-green-400 to-cyan-500 flex items-center justify-center",
                        shouldShowShadows && "shadow-[0_0_30px_rgba(34,197,94,0.5)]"
                      )}>
                        <span className="text-2xl font-black text-white drop-shadow-lg">{currentIndex + 1}</span>
                      </div>
                      {/* Outer glow ring */}
                      {!isLowEnd && shouldShowShadows && (
                        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-green-400/30 to-cyan-400/30 blur-md -z-10" />
                      )}
                      {/* Corner sparkle */}
                      {!isLowEnd && (
                        <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-400" />
                      )}
                    </div>
                    
                    <div>
                      <p className="text-sm uppercase tracking-[0.15em] text-green-400 font-bold flex items-center gap-2">
                        <span>Questão {currentIndex + 1}</span>
                        <span className="text-zinc-600">/</span>
                        <span className="text-cyan-400">{questions.length}</span>
                      </p>
                      {currentQuestion.banca && (
                        <p className="text-sm text-zinc-400 mt-0.5 flex items-center gap-2">
                          <Shield className="w-3.5 h-3.5 text-amber-500" />
                          {currentQuestion.banca.toUpperCase()} {currentQuestion.ano || ""}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Professor Badge ULTRA */}
                  <div className={cn(
                    "px-5 py-2.5 rounded-2xl border-2 relative overflow-hidden",
                    shouldShowGradients 
                      ? "bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border-amber-500/40"
                      : "bg-amber-500/10 border-amber-500/30",
                    shouldShowShadows && "shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                  )}>
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-widest relative z-10">
                      Prof. Moisés Medeiros
                    </span>
                    {/* Shine effect */}
                    {!isLowEnd && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
                    )}
                  </div>
                </div>
              </div>

              {/* Question Content */}
              <div className="p-6 lg:p-8">
                {/* Enunciado */}
                <div className="mb-8">
                  <QuestionTextField
                    content={currentQuestion.question_text}
                    fieldType="enunciado"
                    className="text-base lg:text-lg leading-relaxed text-zinc-200"
                    justify
                  />
                  {currentQuestion.image_url && (
                    <div className="relative mt-6 inline-block">
                      {!isLowEnd && shouldShowShadows && (
                        <div className="absolute -inset-2 bg-gradient-to-br from-cyan-500/20 to-purple-500/20 rounded-2xl blur-lg" />
                      )}
                      <img
                        src={currentQuestion.image_url}
                        alt="Imagem da questão"
                        className={cn(
                          "relative max-h-[500px] rounded-2xl mx-auto border-2 border-zinc-700/50",
                          shouldShowShadows && "shadow-2xl"
                        )}
                      />
                    </div>
                  )}
                </div>

                {/* Alternativas Premium ULTRA */}
                <div className="space-y-4">
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
                          "relative w-full rounded-2xl transition-all duration-300 flex items-center justify-between gap-3 group",
                          isEliminated && "opacity-40",
                          isSelected && !isEliminated && shouldShowShadows && "shadow-[0_0_35px_rgba(34,197,94,0.4)]",
                          isSelecting && "opacity-60 scale-[0.99]"
                        )}
                      >
                        {/* Border glow para selecionada ULTRA */}
                        {isSelected && !isEliminated && !isLowEnd && shouldShowShadows && (
                          <div className="absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-green-500/60 via-green-400/40 to-cyan-500/60 blur-sm" />
                        )}
                        
                        <div className={cn(
                          "relative flex-1 p-5 rounded-2xl border-2 transition-all flex items-center gap-5",
                          isEliminated && "bg-zinc-900/50 border-zinc-800/50",
                          isSelected && !isEliminated && cn(
                            "bg-green-500/15 border-green-500/60",
                            shouldShowGradients && "bg-gradient-to-r from-green-500/20 via-green-500/15 to-cyan-500/10"
                          ),
                          !isSelected && !isEliminated && cn(
                            "bg-zinc-800/50 border-zinc-700/60",
                            "hover:border-cyan-500/50 hover:bg-zinc-800/80",
                            shouldShowShadows && "hover:shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                          )
                        )}>
                          {/* Área clicável */}
                          <button
                            onClick={() => handleSelectOption(key)}
                            disabled={isSelecting || isFinishing || isEliminated}
                            className={cn(
                              "flex items-center gap-5 flex-1 text-left",
                              isEliminated && "cursor-not-allowed"
                            )}
                          >
                            {/* Letter Badge ULTRA */}
                            <div className="relative">
                              <div
                                className={cn(
                                  "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all font-black text-xl border-2",
                                  isSelected 
                                    ? cn(
                                        "bg-gradient-to-br from-green-500 via-green-400 to-cyan-500 text-white border-green-400/50",
                                        shouldShowShadows && "shadow-[0_0_25px_rgba(34,197,94,0.6)]"
                                      )
                                    : cn(
                                        "bg-zinc-800/80 text-zinc-300 border-zinc-700/60",
                                        "group-hover:border-cyan-500/50 group-hover:text-cyan-400",
                                        "group-hover:bg-cyan-500/10"
                                      ),
                                  isEliminated && "bg-zinc-900 text-zinc-600 border-zinc-800"
                                )}
                              >
                                {letterLabel}
                              </div>
                              {/* Selection checkmark */}
                              {isSelected && !isEliminated && (
                                <div className={cn(
                                  "absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center",
                                  shouldShowShadows && "shadow-[0_0_10px_rgba(34,197,94,0.8)]"
                                )}>
                                  <span className="text-white text-xs font-bold">✓</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Texto */}
                            <QuestionTextField
                              content={optionText}
                              fieldType="alternativa"
                              className={cn(
                                "flex-1 text-base",
                                isSelected && "text-green-100 font-medium",
                                !isSelected && !isEliminated && "text-zinc-300",
                                isEliminated && "line-through text-zinc-600"
                              )}
                              inline
                            />
                          </button>
                          
                          {/* Botão Tesoura ULTRA */}
                          {!isSelected && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleEliminate(key);
                              }}
                              className={cn(
                                "shrink-0 p-3 rounded-xl transition-all border-2",
                                isEliminated 
                                  ? cn(
                                      "text-red-400 bg-red-500/20 border-red-500/40",
                                      "hover:bg-zinc-800 hover:border-zinc-700 hover:text-zinc-400"
                                    )
                                  : cn(
                                      "text-zinc-500 bg-zinc-800/50 border-zinc-700/50",
                                      "hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/40"
                                    )
                              )}
                              title={isEliminated ? "Restaurar alternativa" : "Eliminar alternativa"}
                            >
                              <Scissors className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer Navegação ULTRA */}
              <div className={cn(
                "px-6 py-5 border-t-2 border-zinc-800/50",
                shouldShowGradients ? "bg-gradient-to-r from-zinc-900/90 via-zinc-950 to-zinc-900/90" : "bg-zinc-900/80"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={goToPrev}
                      disabled={currentIndex === 0}
                      className={cn(
                        "border-2 border-zinc-700 bg-zinc-800/50",
                        "hover:bg-zinc-700/50 hover:border-cyan-500/40",
                        "disabled:opacity-40"
                      )}
                    >
                      <ChevronLeft className="h-5 w-5 mr-1" />
                      Anterior
                    </Button>
                    
                    <Button
                      size="lg"
                      onClick={goToNext}
                      disabled={currentIndex === questions.length - 1}
                      className={cn(
                        "bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 border-2 border-cyan-400/30",
                        shouldShowShadows && "shadow-[0_0_20px_rgba(6,182,212,0.4)]",
                        "disabled:opacity-40"
                      )}
                    >
                      Próxima
                      <ChevronRight className="h-5 w-5 ml-1" />
                    </Button>
                  </div>

                  <Button
                    size="lg"
                    onClick={() => setShowFinishDialog(true)}
                    disabled={isFinishing}
                    className={cn(
                      "bg-gradient-to-r from-green-600 via-green-500 to-emerald-500 hover:from-green-500 hover:via-green-400 hover:to-emerald-400",
                      "border-2 border-green-400/40 px-6",
                      shouldShowShadows && "shadow-[0_0_25px_rgba(34,197,94,0.5)]"
                    )}
                  >
                    <Flag className="h-5 w-5 mr-2" />
                    Finalizar Simulado
                  </Button>
                </div>
              </div>

              {/* Corner Accents ULTRA */}
              <div className="absolute top-0 left-0 w-10 h-10 border-t-2 border-l-2 border-cyan-500/50 rounded-tl-3xl pointer-events-none" />
              <div className="absolute top-0 right-0 w-10 h-10 border-t-2 border-r-2 border-green-500/50 rounded-tr-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-10 h-10 border-b-2 border-l-2 border-purple-500/50 rounded-bl-3xl pointer-events-none" />
              <div className="absolute bottom-0 right-0 w-10 h-10 border-b-2 border-r-2 border-cyan-500/50 rounded-br-3xl pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Coluna Lateral - Navegação Grid (Desktop) */}
        <div className="w-72 shrink-0 hidden lg:block">
          <SimuladoQuestionNavGrid
            total={questions.length}
            current={currentIndex}
            answeredMap={answeredMap}
            onNavigate={goToQuestion}
          />
        </div>
      </div>

      {/* Navegação Mobile ULTRA */}
      <div className={cn(
        "lg:hidden fixed bottom-0 left-0 right-0 border-t-2 border-cyan-500/30 p-4 z-20",
        shouldBlur && "backdrop-blur-xl",
        shouldShowGradients ? "bg-gradient-to-t from-zinc-950 to-zinc-950/95" : "bg-zinc-950/95"
      )}>
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="lg"
            onClick={goToPrev}
            disabled={currentIndex === 0}
            className="border-2 border-zinc-700"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-cyan-500 flex items-center justify-center",
              shouldShowShadows && "shadow-[0_0_20px_rgba(34,197,94,0.5)]"
            )}>
              <span className="text-lg font-black text-white">{currentIndex + 1}</span>
            </div>
            <span className="text-base text-zinc-400 font-medium">/ {questions.length}</span>
          </div>
          
          <Button
            variant="outline"
            size="lg"
            onClick={goToNext}
            disabled={currentIndex === questions.length - 1}
            className="border-2 border-zinc-700"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Dialog de confirmação ULTRA */}
      <AlertDialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <AlertDialogContent useOriginalSize className={cn(
          "max-w-md border-2 border-cyan-500/40 rounded-3xl",
          shouldShowGradients ? "bg-gradient-to-b from-zinc-900 to-zinc-950" : "bg-zinc-900",
          shouldShowShadows && "shadow-[0_0_50px_rgba(6,182,212,0.3)]"
        )}>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-green-400 to-cyan-400">
              Finalizar Simulado?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-4 text-zinc-400">
              <p className="text-base">
                Você respondeu <span className="text-green-400 font-bold">{answeredCount}</span> de <span className="text-cyan-400 font-bold">{questions.length}</span> questões.
              </p>
              {answeredCount < questions.length && (
                <div className={cn(
                  "flex items-center gap-3 p-4 rounded-2xl",
                  "bg-amber-500/10 border-2 border-amber-500/40",
                  shouldShowShadows && "shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                )}>
                  <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
                  <span className="text-amber-400 font-medium">
                    {questions.length - answeredCount} questões não respondidas
                  </span>
                </div>
              )}
              <p className="text-sm">
                Após finalizar, você não poderá alterar suas respostas.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel className="border-2 border-zinc-700 bg-zinc-800 hover:bg-zinc-700 rounded-xl">
              Continuar Respondendo
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmFinish} 
              disabled={isFinishing}
              className={cn(
                "bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400",
                "border-2 border-green-400/40 rounded-xl",
                shouldShowShadows && "shadow-[0_0_20px_rgba(34,197,94,0.4)]"
              )}
            >
              {isFinishing ? "Finalizando..." : "Confirmar Finalização"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* CSS for animations */}
      <style>{`
        @keyframes scan {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
