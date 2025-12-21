// ============================================
// TESTAMENTO DA SINGULARIDADE v5.0
// HOOK SIMPLIFICADO PARA PUBLICAR EVENTOS
// Re-exporta e expande funções do useEventSystem
// ============================================

import { useCallback } from "react";
import { useEventSystem, EventName } from "@/hooks/useEventSystem";

interface UsePublishEventResult {
  // Eventos de Aula
  publishLessonStarted: (lessonId: string, courseId?: string) => Promise<number | null>;
  publishLessonCompleted: (lessonId: string, progressPercent?: number, courseId?: string) => Promise<number | null>;
  
  // Eventos de Quiz
  publishQuizStarted: (quizId: string) => Promise<number | null>;
  publishQuizPassed: (quizId: string, score: number, totalQuestions: number) => Promise<number | null>;
  publishQuizFailed: (quizId: string, score: number, totalQuestions: number) => Promise<number | null>;
  
  // Eventos de Resposta
  publishCorrectAnswer: (questionId: string, quizId?: string) => Promise<number | null>;
  publishWrongAnswer: (questionId: string, quizId?: string) => Promise<number | null>;
  
  // Eventos de Acesso/Engajamento
  publishDailyLogin: () => Promise<number | null>;
  publishContentViewed: (contentType: string, contentId: string) => Promise<number | null>;
  
  // Eventos de Gamificação
  publishStreakAchieved: (streakDays: number) => Promise<number | null>;
  publishLevelUp: (newLevel: number, previousLevel: number) => Promise<number | null>;
  publishBadgeEarned: (badgeId: string, badgeName: string) => Promise<number | null>;
  
  // Evento genérico
  publishEvent: (name: EventName, payload?: Record<string, unknown>, entityType?: string, entityId?: string) => Promise<number | null>;
}

export function usePublishEvent(): UsePublishEventResult {
  const { publishEvent } = useEventSystem();

  // === EVENTOS DE AULA ===
  const publishLessonStarted = useCallback(
    (lessonId: string, courseId?: string) =>
      publishEvent("lesson.started", { lesson_id: lessonId, course_id: courseId }, "lesson", lessonId),
    [publishEvent]
  );

  const publishLessonCompleted = useCallback(
    (lessonId: string, progressPercent: number = 100, courseId?: string) =>
      publishEvent("lesson.completed", { 
        lesson_id: lessonId, 
        course_id: courseId, 
        progress_percent: progressPercent,
        completed_at: new Date().toISOString()
      }, "lesson", lessonId),
    [publishEvent]
  );

  // === EVENTOS DE QUIZ ===
  const publishQuizStarted = useCallback(
    (quizId: string) =>
      publishEvent("quiz.started", { quiz_id: quizId }, "quiz", quizId),
    [publishEvent]
  );

  const publishQuizPassed = useCallback(
    (quizId: string, score: number, totalQuestions: number) =>
      publishEvent("quiz.passed", { quiz_id: quizId, score, total_questions: totalQuestions }, "quiz", quizId),
    [publishEvent]
  );

  const publishQuizFailed = useCallback(
    (quizId: string, score: number, totalQuestions: number) =>
      publishEvent("quiz.failed", { quiz_id: quizId, score, total_questions: totalQuestions }, "quiz", quizId),
    [publishEvent]
  );

  // === EVENTOS DE RESPOSTA ===
  const publishCorrectAnswer = useCallback(
    (questionId: string, quizId?: string) =>
      publishEvent("correct.answer", { question_id: questionId, quiz_id: quizId }, "question", questionId),
    [publishEvent]
  );

  const publishWrongAnswer = useCallback(
    (questionId: string, quizId?: string) =>
      publishEvent("wrong.answer", { question_id: questionId, quiz_id: quizId }, "question", questionId),
    [publishEvent]
  );

  // === EVENTOS DE ACESSO/ENGAJAMENTO ===
  const publishDailyLogin = useCallback(
    () => publishEvent("daily.login", { timestamp: new Date().toISOString() }),
    [publishEvent]
  );

  const publishContentViewed = useCallback(
    (contentType: string, contentId: string) =>
      publishEvent("content.viewed", { content_type: contentType, content_id: contentId }, contentType, contentId),
    [publishEvent]
  );

  // === EVENTOS DE GAMIFICAÇÃO ===
  const publishStreakAchieved = useCallback(
    (streakDays: number) =>
      publishEvent("streak.achieved", { streak_days: streakDays }),
    [publishEvent]
  );

  const publishLevelUp = useCallback(
    (newLevel: number, previousLevel: number) =>
      publishEvent("level.up", { new_level: newLevel, previous_level: previousLevel }),
    [publishEvent]
  );

  const publishBadgeEarned = useCallback(
    (badgeId: string, badgeName: string) =>
      publishEvent("badge.earned", { badge_id: badgeId, badge_name: badgeName }, "badge", badgeId),
    [publishEvent]
  );

  return {
    // Aula
    publishLessonStarted,
    publishLessonCompleted,
    
    // Quiz
    publishQuizStarted,
    publishQuizPassed,
    publishQuizFailed,
    
    // Resposta
    publishCorrectAnswer,
    publishWrongAnswer,
    
    // Acesso
    publishDailyLogin,
    publishContentViewed,
    
    // Gamificação
    publishStreakAchieved,
    publishLevelUp,
    publishBadgeEarned,
    
    // Genérico
    publishEvent,
  };
}
