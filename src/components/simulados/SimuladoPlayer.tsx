/**
 * 🎯 SIMULADOS — Player Principal (Orquestrador)
 * Constituição SYNAPSE Ω v10.0
 * 
 * Componente principal que gerencia todos os estados do simulado.
 * UI NÃO calcula score, tempo ou invalidação — apenas reflete servidor.
 */

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { 
  SimuladoState, 
  SimuladoPlayerProps,
  SimuladoResult,
  SimuladoAnswer,
  calculatePercentage,
} from "@/components/simulados/types";
import { useSimuladoState } from "@/hooks/simulados/useSimuladoState";
import { useSimuladoAttempt } from "@/hooks/simulados/useSimuladoAttempt";
import { useSimuladoTimer } from "@/hooks/simulados/useSimuladoTimer";
import { useSimuladoAnswers } from "@/hooks/simulados/useSimuladoAnswers";
import { useAntiCheat } from "@/hooks/simulados/useAntiCheat";
import {
  SimuladoWaitingScreen,
  SimuladoReadyScreen,
  SimuladoRunningScreen,
  SimuladoFinishedScreen,
  SimuladoReviewScreen,
  SimuladoInvalidatedScreen,
  SimuladoHardModeConsent,
} from "@/components/simulados/screens";
import { useToast } from "@/hooks/use-toast";

export function SimuladoPlayer({
  simuladoId,
  onComplete,
  onExit,
}: SimuladoPlayerProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Estados locais de UI
  const [showHardModeConsent, setShowHardModeConsent] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [localResult, setLocalResult] = useState<SimuladoResult | null>(null);

  // Hook de estado do simulado
  const {
    currentState,
    simulado,
    attempt,
    questions,
    isRetake,
    isGabaritoReleased,
    startsIn,
    gabaritoIn,
    isLoading: isLoadingState,
    error: stateError,
    updateAttempt,
    refresh,
  } = useSimuladoState({ simuladoId });

  // Hook de tentativa
  const {
    startAttempt,
    finishAttempt,
    state: attemptState,
    config: attemptConfig,
    result: attemptResult,
    isRunning: isAttemptRunning,
  } = useSimuladoAttempt();

  // Timer derivado do servidor
  const {
    timeRemaining: remainingSeconds,
    timeElapsed: elapsedSeconds,
    isWarning,
    isCritical,
    isExpired,
  } = useSimuladoTimer({
    startedAt: attemptState.startedAt,
    durationMinutes: attemptConfig?.durationMinutes || simulado?.duration_minutes || 180,
    enabled: currentState === SimuladoState.RUNNING,
  });

  // Respostas
  const {
    answers,
    selectAnswer,
    isSaving,
    loadExistingAnswers,
  } = useSimuladoAnswers({
    attemptId: attemptState.attemptId,
    questionIds: questions.map(q => q.id),
    enabled: currentState === SimuladoState.RUNNING,
  });

  // Anti-cheat (Hard Mode)
  const antiCheat = useAntiCheat({
    attemptId: attemptState.attemptId,
    isHardMode: simulado?.is_hard_mode || false,
    requiresCamera: simulado?.requires_camera || false,
    maxTabSwitches: simulado?.max_tab_switches || 3,
    durationMinutes: simulado?.duration_minutes || 180,
    startedAt: attemptState.startedAt,
    enabled: currentState === SimuladoState.RUNNING,
    onInvalidate: (reason) => {
      console.log("[SimuladoPlayer] Invalidated:", reason);
      refresh();
    },
  });

  // Converter answers Map para formato esperado
  const answersMap = useMemo(() => {
    const map = new Map<string, SimuladoAnswer>();
    answers.forEach((value, key) => {
      map.set(key, {
        questionId: key,
        selectedOption: value.selectedOption,
        answeredAt: value.answeredAt,
        timeSpentSeconds: value.timeSpentSeconds,
      });
    });
    return map;
  }, [answers]);

  // Handler: Iniciar tentativa
  const handleStart = useCallback(async () => {
    if (!simulado) return;
    
    // Hard Mode precisa de consentimento
    if (simulado.is_hard_mode && !showHardModeConsent) {
      setShowHardModeConsent(true);
      return;
    }

    setIsStarting(true);
    try {
      const success = await startAttempt(simuladoId);
      if (success) {
        setShowHardModeConsent(false);
        
        // Se hard mode com câmera, solicitar
        if (simulado.requires_camera) {
          await antiCheat.camera.requestCamera();
        }
        
        refresh();
      }
    } finally {
      setIsStarting(false);
    }
  }, [simulado, simuladoId, showHardModeConsent, startAttempt, antiCheat.camera, refresh]);

  // Handler: Finalizar tentativa
  const handleFinish = useCallback(async () => {
    setIsFinishing(true);
    try {
      const result = await finishAttempt();
      if (result) {
        const simuladoResult: SimuladoResult = {
          ...result,
          percentage: calculatePercentage(result.correctAnswers, questions.length),
          passed: calculatePercentage(result.correctAnswers, questions.length) >= (simulado?.passing_score || 60),
        };
        setLocalResult(simuladoResult);
        onComplete?.(simuladoResult);
        refresh();
      }
    } finally {
      setIsFinishing(false);
    }
  }, [finishAttempt, questions.length, simulado?.passing_score, onComplete, refresh]);

  // Handler: Tempo esgotado
  const handleTimeUp = useCallback(() => {
    if (currentState === SimuladoState.RUNNING && !isFinishing) {
      toast({
        title: "Tempo esgotado!",
        description: "O simulado está sendo finalizado automaticamente.",
        variant: "destructive",
      });
      handleFinish();
    }
  }, [currentState, isFinishing, handleFinish, toast]);

  // Handler: Sair
  const handleExit = useCallback(() => {
    if (onExit) {
      onExit();
    } else {
      navigate("/alunos/simulados");
    }
  }, [navigate, onExit]);

  // Handler: Retry (após invalidação)
  const handleRetry = useCallback(() => {
    // Limpar estado e permitir nova tentativa
    setLocalResult(null);
    refresh();
  }, [refresh]);

  // Efeito: Auto-finalizar quando tempo acabar
  useEffect(() => {
    if (isExpired && currentState === SimuladoState.RUNNING && !isFinishing) {
      handleTimeUp();
    }
  }, [isExpired, currentState, isFinishing, handleTimeUp]);

  // Efeito: Atualizar attempt quando mudar
  useEffect(() => {
    if (attempt && attemptState.attemptId !== attempt.id) {
      updateAttempt(attempt);
    }
  }, [attempt, attemptState.attemptId, updateAttempt]);

  // Loading state
  if (isLoadingState) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando simulado...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (stateError || !simulado) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-destructive mb-4">{stateError || "Simulado não encontrado"}</p>
          <button onClick={handleExit} className="text-primary underline">
            Voltar aos simulados
          </button>
        </div>
      </div>
    );
  }

  // Hard Mode Consent Screen
  if (showHardModeConsent && simulado.is_hard_mode) {
    return (
      <SimuladoHardModeConsent
        simulado={simulado}
        onAccept={handleStart}
        onDecline={() => setShowHardModeConsent(false)}
        isLoading={isStarting}
      />
    );
  }

  // Renderizar tela baseada no estado
  switch (currentState) {
    case SimuladoState.WAITING:
      return (
        <SimuladoWaitingScreen
          simulado={simulado}
          startsIn={startsIn || 0}
        />
      );

    case SimuladoState.READY:
    case SimuladoState.DISQUALIFIED:
      return (
        <SimuladoReadyScreen
          simulado={simulado}
          isRetake={isRetake || currentState === SimuladoState.DISQUALIFIED}
          attemptNumber={attempt?.attempt_number ? attempt.attempt_number + 1 : 1}
          onStart={handleStart}
          isLoading={isStarting}
        />
      );

    case SimuladoState.RUNNING:
      return (
        <SimuladoRunningScreen
          simulado={simulado}
          attempt={attempt!}
          questions={questions}
          answers={answersMap}
          remainingSeconds={remainingSeconds}
          isTimeWarning={isWarning}
          isTimeCritical={isCritical}
          tabSwitches={antiCheat.tabFocus.tabSwitches}
          maxTabSwitches={simulado.max_tab_switches}
          isCameraActive={antiCheat.camera.isActive}
          cameraError={antiCheat.camera.errorMessage}
          onRequestCamera={antiCheat.camera.requestCamera}
          onSelectAnswer={selectAnswer}
          onFinish={handleFinish}
          onTimeUp={handleTimeUp}
          isSaving={isSaving}
          isFinishing={isFinishing}
        />
      );

    case SimuladoState.FINISHED_SCORE_ONLY:
      const finishedResult = localResult || (attempt ? {
        score: attempt.score,
        correctAnswers: attempt.correct_answers,
        wrongAnswers: attempt.wrong_answers,
        unanswered: attempt.unanswered,
        xpAwarded: attempt.is_scored_for_ranking ? attempt.score : 0,
        isScoredForRanking: attempt.is_scored_for_ranking,
        timeSpentSeconds: attempt.time_spent_seconds || 0,
        percentage: calculatePercentage(attempt.correct_answers, questions.length),
        passed: calculatePercentage(attempt.correct_answers, questions.length) >= (simulado.passing_score || 60),
      } : null);

      if (!finishedResult) {
        return <div>Carregando resultado...</div>;
      }

      return (
        <SimuladoFinishedScreen
          simulado={simulado}
          result={finishedResult}
          isRetake={isRetake}
          gabaritoReleasedAt={simulado.results_released_at}
          gabaritoIn={gabaritoIn || undefined}
          onExit={handleExit}
        />
      );

    case SimuladoState.REVIEW:
      const reviewResult = localResult || (attempt ? {
        score: attempt.score,
        correctAnswers: attempt.correct_answers,
        wrongAnswers: attempt.wrong_answers,
        unanswered: attempt.unanswered,
        xpAwarded: attempt.is_scored_for_ranking ? attempt.score : 0,
        isScoredForRanking: attempt.is_scored_for_ranking,
        timeSpentSeconds: attempt.time_spent_seconds || 0,
        percentage: calculatePercentage(attempt.correct_answers, questions.length),
        passed: calculatePercentage(attempt.correct_answers, questions.length) >= (simulado.passing_score || 60),
      } : null);

      if (!reviewResult) {
        return <div>Carregando resultado...</div>;
      }

      return (
        <SimuladoReviewScreen
          simulado={simulado}
          result={reviewResult}
          questions={questions}
          answers={answersMap}
          isRetake={isRetake}
          onExit={handleExit}
        />
      );

    case SimuladoState.INVALIDATED:
      return (
        <SimuladoInvalidatedScreen
          simulado={simulado}
          attempt={attempt!}
          onRetry={handleRetry}
          onExit={handleExit}
          canRetry={true}
        />
      );

    case SimuladoState.ERROR:
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-destructive mb-4">Erro ao processar simulado</p>
            <button onClick={refresh} className="text-primary underline mr-4">
              Tentar novamente
            </button>
            <button onClick={handleExit} className="text-muted-foreground underline">
              Voltar
            </button>
          </div>
        </div>
      );

    default:
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
  }
}
