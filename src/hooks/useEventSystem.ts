// ============================================
// TESTAMENTO DA SINGULARIDADE v5.0
// SISTEMA NERVOSO DIVINO - Event-Driven Architecture
// Publica e escuta eventos em tempo real
// ============================================

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { RealtimeChannel } from "@supabase/supabase-js";

// Tipos de eventos do sistema
export type EventName =
  | "payment.succeeded"
  | "payment.failed"
  | "payment.refunded"
  | "lesson.started"
  | "lesson.completed"
  | "quiz.started"
  | "quiz.passed"
  | "quiz.failed"
  | "correct.answer"
  | "wrong.answer"
  | "daily.login"
  | "streak.achieved"
  | "level.up"
  | "badge.earned"
  | "certificate.generated"
  | "access.granted"
  | "access.expired"
  | "access.revoked"
  | "user.registered"
  | "user.upgraded"
  | "churn.risk.detected"
  | "ai.prediction.made"
  | "webhook.received"
  | "notification.sent"
  | "content.viewed";

export type EventStatus = "pending" | "processing" | "processed" | "failed" | "retrying";

export interface SystemEvent {
  id: number;
  name: EventName;
  payload: Record<string, unknown>;
  user_id: string | null;
  entity_type: string | null;
  entity_id: string | null;
  status: EventStatus;
  created_at: string;
}

interface UseEventSystemResult {
  publishEvent: (name: EventName, payload?: Record<string, unknown>, entityType?: string, entityId?: string) => Promise<number | null>;
  subscribeToEvents: (eventNames: EventName[], callback: (event: SystemEvent) => void) => () => void;
  recentEvents: SystemEvent[];
  isLoading: boolean;
}

export function useEventSystem(): UseEventSystemResult {
  const { user } = useAuth();
  const [recentEvents, setRecentEvents] = useState<SystemEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Publicar evento no Sistema Nervoso
  const publishEvent = useCallback(async (
    name: EventName,
    payload: Record<string, unknown> = {},
    entityType?: string,
    entityId?: string
  ): Promise<number | null> => {
    try {
      const { data, error } = await supabase.rpc("publish_event", {
        p_name: name,
        p_payload: JSON.parse(JSON.stringify(payload)),
        p_entity_type: entityType || null,
        p_entity_id: entityId || null,
      });

      if (error) {
        console.error("Erro ao publicar evento:", error);
        return null;
      }

      return data as number;
    } catch (err) {
      console.error("Erro ao publicar evento:", err);
      return null;
    }
  }, []);

  // Subscrever a eventos em tempo real
  const subscribeToEvents = useCallback((
    eventNames: EventName[],
    callback: (event: SystemEvent) => void
  ): (() => void) => {
    const channel: RealtimeChannel = supabase
      .channel("events-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "events",
        },
        (payload) => {
          const newEvent = payload.new as SystemEvent;
          if (eventNames.includes(newEvent.name as EventName)) {
            callback(newEvent);
            setRecentEvents((prev) => [newEvent, ...prev.slice(0, 49)]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Carregar eventos recentes ao iniciar
  useEffect(() => {
    if (!user) return;

    const loadRecentEvents = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("events")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(50);

        if (!error && data) {
          setRecentEvents(data as SystemEvent[]);
        }
      } catch (err) {
        console.error("Erro ao carregar eventos:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadRecentEvents();
  }, [user]);

  return {
    publishEvent,
    subscribeToEvents,
    recentEvents,
    isLoading,
  };
}

// Hook para publicar eventos específicos de forma simplificada
export function usePublishEvent() {
  const { publishEvent } = useEventSystem();

  return {
    // Eventos de Aula
    onLessonStarted: (lessonId: string, courseId: string) =>
      publishEvent("lesson.started", { lesson_id: lessonId, course_id: courseId }, "lesson", lessonId),
    
    onLessonCompleted: (lessonId: string, courseId: string, durationMs: number) =>
      publishEvent("lesson.completed", { lesson_id: lessonId, course_id: courseId, duration_ms: durationMs }, "lesson", lessonId),

    // Eventos de Quiz
    onQuizStarted: (quizId: string) =>
      publishEvent("quiz.started", { quiz_id: quizId }, "quiz", quizId),
    
    onQuizPassed: (quizId: string, score: number, totalQuestions: number) =>
      publishEvent("quiz.passed", { quiz_id: quizId, score, total_questions: totalQuestions }, "quiz", quizId),
    
    onQuizFailed: (quizId: string, score: number, totalQuestions: number) =>
      publishEvent("quiz.failed", { quiz_id: quizId, score, total_questions: totalQuestions }, "quiz", quizId),

    // Eventos de Resposta
    onCorrectAnswer: (questionId: string, quizId?: string) =>
      publishEvent("correct.answer", { question_id: questionId, quiz_id: quizId }, "question", questionId),
    
    onWrongAnswer: (questionId: string, quizId?: string) =>
      publishEvent("wrong.answer", { question_id: questionId, quiz_id: quizId }, "question", questionId),

    // Eventos de Acesso
    onDailyLogin: () =>
      publishEvent("daily.login", { timestamp: new Date().toISOString() }),
    
    onContentViewed: (contentType: string, contentId: string) =>
      publishEvent("content.viewed", { content_type: contentType, content_id: contentId }, contentType, contentId),

    // Eventos de Gamificação
    onStreakAchieved: (streakDays: number) =>
      publishEvent("streak.achieved", { streak_days: streakDays }),
    
    onLevelUp: (newLevel: number, previousLevel: number) =>
      publishEvent("level.up", { new_level: newLevel, previous_level: previousLevel }),
    
    onBadgeEarned: (badgeId: string, badgeName: string) =>
      publishEvent("badge.earned", { badge_id: badgeId, badge_name: badgeName }, "badge", badgeId),

    // Evento genérico
    publish: publishEvent,
  };
}

// Hook para monitorar eventos em tempo real (para admins)
export function useEventMonitor(eventTypes?: EventName[]) {
  const [events, setEvents] = useState<SystemEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const { subscribeToEvents } = useEventSystem();

  useEffect(() => {
    const typesToWatch = eventTypes || [
      "lesson.completed",
      "quiz.passed",
      "level.up",
      "badge.earned",
      "payment.succeeded",
    ];

    const unsubscribe = subscribeToEvents(typesToWatch, (event) => {
      setEvents((prev) => [event, ...prev.slice(0, 99)]);
    });

    setIsConnected(true);

    return () => {
      unsubscribe();
      setIsConnected(false);
    };
  }, [eventTypes, subscribeToEvents]);

  return { events, isConnected };
}
