/**
 * 🎯 SIMULADOS — Player Principal (Orquestrador)
 * Constituição SYNAPSE Ω v10.0
 * 
 * Componente principal que gerencia todos os estados do simulado.
 * UI NÃO calcula score, tempo ou invalidação — apenas reflete servidor.
 * 
 * FASE 4: Proteções de segurança integradas:
 * - Race condition (useSimuladoLock)
 * - Bloqueio de navegação (useSimuladoNavBlock)
 * - Multi-tab (useSimuladoMultiTab)
 * - Logging (useSimuladoLogger)
 */

import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, AlertTriangle } from "lucide-react";
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
import { useSimuladoLock } from "@/hooks/simulados/useSimuladoLock";
import { useSimuladoNavBlock } from "@/hooks/simulados/useSimuladoNavBlock";
import { useSimuladoMultiTab } from "@/hooks/simulados/useSimuladoMultiTab";
import { useSimuladoLogger } from "@/hooks/simulados/useSimuladoLogger";
import {
  SimuladoWaitingScreen,
  SimuladoReadyScreen,
  SimuladoRunningScreen,
  SimuladoFinishedScreen,
  SimuladoReviewScreen,
  SimuladoInvalidatedScreen,
  SimuladoHardModeConsent,
} from "@/components/simulados/screens";
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
import { useToast } from "@/hooks/use-toast";

export function SimuladoPlayer({
  simuladoId,
  onComplete,
  onExit,
  forcedMode = null,
}: SimuladoPlayerProps) {
  console.log('[SimuladoPlayer] MOUNT - simuladoId:', simuladoId, 'forcedMode:', forcedMode);
  
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

  // 🎮 Effective Hard Mode: respeita forcedMode se definido
  // forcedMode === 'treino' → NUNCA hard mode (ignora configuração do simulado)
  // forcedMode === 'hard' → SEMPRE hard mode (força mesmo se simulado é normal)
  // forcedMode === null → usa configuração nativa do simulado
  const effectiveHardMode = useMemo(() => {
    if (forcedMode === 'treino') return false;
    if (forcedMode === 'hard') return true;
    return simulado?.is_hard_mode ?? false;
  }, [forcedMode, simulado?.is_hard_mode]);
  const {
    startAttempt,
    finishAttempt,
    syncFromServerAttempt,
    state: attemptState,
    config: attemptConfig,
    result: attemptResult,
    isRunning: isAttemptRunning,
  } = useSimuladoAttempt();

  // Timer derivado do servidor
  // Fonte de verdade: started_at retornado pelo backend (RPC ou fetch da tentativa)
  const timerStartedAt = React.useMemo(() => {
    // Prioridade: startedAt retornado pelo RPC (sempre server-side) > attempt do banco
    if (attemptState.startedAt) {
      return attemptState.startedAt;
    }
    if (attempt?.started_at) {
      return new Date(attempt.started_at);
    }
    return null;
  }, [attempt?.started_at, attemptState.startedAt]);

  const timerDurationMinutes = React.useMemo(() => {
    // Prioridade: simulado do banco > config local > fallback
    return simulado?.duration_minutes || attemptConfig?.durationMinutes || 60;
  }, [simulado?.duration_minutes, attemptConfig?.durationMinutes]);

  const {
    timeRemaining: remainingSeconds,
    timeElapsed: elapsedSeconds,
    isWarning,
    isCritical,
    isExpired,
  } = useSimuladoTimer({
    startedAt: timerStartedAt,
    durationMinutes: timerDurationMinutes,
    enabled: currentState === SimuladoState.RUNNING && timerStartedAt !== null,
  });

  // Respostas
  const questionIds = useMemo(() => questions.map(q => q.id), [questions]);

  const {
    answers,
    selectAnswer,
    isSaving,
    loadExistingAnswers,
  } = useSimuladoAnswers({
    attemptId: attemptState.attemptId,
    questionIds,
    enabled: currentState === SimuladoState.RUNNING,
  });

  // === FASE 4: PROTEÇÕES DE SEGURANÇA ===
  
  // Logger de eventos (declarado primeiro para uso em outros hooks)
  const logger = useSimuladoLogger({
    simuladoId,
    isSimulado: true,
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
      logger.logInvalidate(attemptState.attemptId || "", reason);
      refresh();
    },
  });
  
  // Lock para prevenir race conditions (duplo clique)
  const { withStartLock, withFinishLock, isStartLocked, isFinishLocked } = useSimuladoLock();

  // Bloqueio de navegação durante RUNNING
  const {
    showConfirmDialog: showNavConfirmDialog,
    setShowConfirmDialog: setShowNavConfirmDialog,
    handleConfirmExit: handleNavConfirmExit,
    handleCancelExit: handleNavCancelExit,
  } = useSimuladoNavBlock({
    isRunning: currentState === SimuladoState.RUNNING,
    simuladoTitle: simulado?.title,
    onConfirmExit: async () => {
      logger.logExit(attemptState.attemptId);
      if (currentState === SimuladoState.RUNNING) {
        await finishAttempt();
      }
    },
  });

  // Detecção de múltiplas abas
  const { isPrimaryTab, isSecondaryTab } = useSimuladoMultiTab({
    attemptId: attemptState.attemptId,
    enabled: currentState === SimuladoState.RUNNING,
    onSecondaryTabDetected: () => {
      toast({
        title: "Aba secundária detectada",
        description: "Esta tentativa está ativa em outra aba. Use a aba principal.",
        variant: "destructive",
      });
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

  // Handler: Iniciar tentativa (COM PROTEÇÃO DE LOCK)
  const handleStart = useCallback(async () => {
    console.log('[SimuladoPlayer handleStart] Called, simulado:', simulado?.title, 'effectiveHardMode:', effectiveHardMode);
    
    if (!simulado) {
      console.error('[SimuladoPlayer handleStart] ABORT: simulado is null');
      return;
    }
    
    // Hard Mode (efetivo) precisa de consentimento
    if (effectiveHardMode && !showHardModeConsent) {
      console.log('[SimuladoPlayer handleStart] Showing HardMode consent');
      setShowHardModeConsent(true);
      return;
    }

    // Proteger contra duplo clique
    console.log('[SimuladoPlayer handleStart] Starting attempt via withStartLock');
    await withStartLock(async () => {
      setIsStarting(true);
      try {
        console.log('[SimuladoPlayer handleStart] Calling startAttempt RPC...');
        const success = await startAttempt(simuladoId);
        console.log('[SimuladoPlayer handleStart] startAttempt result:', success);
        
        if (success) {
          logger.logStart(simuladoId, false);
          setShowHardModeConsent(false);
          
          // Se hard mode efetivo com câmera, solicitar
          if (effectiveHardMode && simulado.requires_camera) {
            console.log('[SimuladoPlayer handleStart] Requesting camera...');
            await antiCheat.camera.requestCamera();
          }
          
          console.log('[SimuladoPlayer handleStart] Calling refresh...');
          refresh();
          console.log('[SimuladoPlayer handleStart] SUCCESS - attempt started');
        }
      } catch (error) {
        console.error('[SimuladoPlayer handleStart] ERROR:', error);
        logger.logError("START", error instanceof Error ? error : String(error));
      } finally {
        setIsStarting(false);
      }
    });
  }, [simulado, simuladoId, effectiveHardMode, showHardModeConsent, startAttempt, antiCheat.camera, refresh, withStartLock, logger]);

  // Handler: Finalizar tentativa (COM PROTEÇÃO DE LOCK)
  const handleFinish = useCallback(async () => {
    // Proteger contra duplo clique
    const lockResult = await withFinishLock(async () => {
      setIsFinishing(true);
      try {
        const result = await finishAttempt();
        if (result) {
          logger.logFinish(attemptState.attemptId || "", {
            score: result.score,
            isScoredForRanking: result.isScoredForRanking,
          });

          const simuladoResult: SimuladoResult = {
            ...result,
            percentage: calculatePercentage(result.correctAnswers, questions.length),
            passed:
              calculatePercentage(result.correctAnswers, questions.length) >=
              (simulado?.passing_score || 60),
          };
          setLocalResult(simuladoResult);
          onComplete?.(simuladoResult);
          refresh();
        }
      } catch (error) {
        logger.logError("FINISH", error instanceof Error ? error : String(error));
      } finally {
        setIsFinishing(false);
      }
    });

    // Se o lock bloqueou a ação, dar feedback claro (antes parecia "não acontece nada")
    if (lockResult === null) {
      toast({
        title: "Finalização em andamento",
        description: "Aguarde alguns segundos…",
      });
    }
  }, [finishAttempt, questions.length, simulado?.passing_score, onComplete, refresh, withFinishLock, logger, attemptState.attemptId, toast]);

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

  // Timer reset: NÃO mais chamamos startAttempt automaticamente aqui.
  // O reset do timer acontece no servidor quando o usuário INICIA manualmente (handleStart).
  // Isso evita loops infinitos e chamadas duplicadas.

  // Efeito: Auto-finalizar quando tempo acabar (DISPARA UMA VEZ)
  const hasAutoTimeUpFiredRef = useRef(false);

  useEffect(() => {
    // Reset do latch quando o tempo volta a ser > 0 (ex: reinício, novo attempt)
    if (!isExpired) {
      hasAutoTimeUpFiredRef.current = false;
      return;
    }

    if (currentState !== SimuladoState.RUNNING) return;
    if (isFinishing) return;
    if (hasAutoTimeUpFiredRef.current) return;

    hasAutoTimeUpFiredRef.current = true;
    handleTimeUp();
  }, [isExpired, currentState, isFinishing, handleTimeUp]);

  // Efeito: Atualizar attempt quando mudar (e hidratar attemptId local para permitir finalizar)
  useEffect(() => {
    if (attempt && attemptState.attemptId !== attempt.id) {
      updateAttempt(attempt);
      syncFromServerAttempt(attempt);
    }
  }, [attempt, attemptState.attemptId, updateAttempt, syncFromServerAttempt]);

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

  // P0 FIX: Simulado sem questões = erro amigável (não crashar)
  if (!simulado.question_ids || simulado.question_ids.length === 0) {
    console.error('[SimuladoPlayer] ABORT: Simulado has no questions', simulado.id);
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <p className="text-amber-500 text-lg font-bold mb-2">⚠️ Simulado Incompleto</p>
          <p className="text-muted-foreground mb-4">
            Este simulado ainda não possui questões cadastradas. 
            Entre em contato com a coordenação.
          </p>
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

  // Tela de bloqueio para aba secundária
  if (isSecondaryTab && currentState === SimuladoState.RUNNING) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md p-6">
          <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Aba Secundária Detectada</h2>
          <p className="text-muted-foreground mb-4">
            Esta tentativa de simulado está ativa em outra aba do navegador.
            Por favor, use a aba principal para continuar.
          </p>
          <p className="text-sm text-muted-foreground">
            Apenas uma aba pode estar ativa por tentativa para garantir
            a integridade do simulado.
          </p>
        </div>
      </div>
    );
  }

  // Diálogo de confirmação de saída durante RUNNING
  const NavigationConfirmDialog = (
    <AlertDialog open={showNavConfirmDialog} onOpenChange={setShowNavConfirmDialog}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Sair do Simulado?</AlertDialogTitle>
          <AlertDialogDescription>
            Você está no meio do simulado. Se sair agora, sua tentativa 
            será finalizada automaticamente com as respostas já marcadas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleNavCancelExit}>
            Continuar Simulado
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleNavConfirmExit}
            className="bg-destructive hover:bg-destructive/90"
          >
            Sair e Finalizar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  // DEBUG: Estado atual para troubleshooting
  console.log('[SimuladoPlayer] RENDER STATE:', {
    currentState,
    simuladoId,
    attemptId: attemptState.attemptId,
    isStarting,
    isFinishing,
    effectiveHardMode,
    hasQuestions: questions.length,
  });

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
      // P0 FIX: Aguardar attempt e questions antes de renderizar
      if (!attempt || questions.length === 0) {
        console.log('[SimuladoPlayer] RUNNING state but missing data:', { attempt: !!attempt, questionsCount: questions.length });
        return (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Carregando questões...</p>
            </div>
          </div>
        );
      }
      return (
        <>
          {NavigationConfirmDialog}
          <SimuladoRunningScreen
            simulado={simulado}
            attempt={attempt}
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
        </>
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
          questions={questions}
          answers={answersMap}
          onReview={() => refresh()}
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
