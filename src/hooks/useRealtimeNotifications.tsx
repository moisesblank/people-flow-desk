// ============================================
// MOISES MEDEIROS v5.0 - REALTIME NOTIFICATIONS
// Sistema de Notificações em Tempo Real
// ============================================

import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Notification } from "@/components/ui/notification-center";

interface UseRealtimeNotificationsProps {
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void;
}

export function useRealtimeNotifications({ addNotification }: UseRealtimeNotificationsProps) {
  const { user } = useAuth();

  const handleNewSale = useCallback((payload: any) => {
    const sale = payload.new;
    addNotification({
      type: "success",
      title: "Nova Venda Realizada! 🎉",
      message: `Venda de R$ ${(sale.amount / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} - ${sale.customer_name || 'Cliente não identificado'}`,
      actionUrl: "/entradas",
      actionLabel: "Ver detalhes",
    });
  }, [addNotification]);

  const handleNewStudent = useCallback((payload: any) => {
    const student = payload.new;
    addNotification({
      type: "info",
      title: "Novo Aluno Matriculado! 📚",
      message: `${student.nome} se matriculou no curso ${student.curso || 'não especificado'}`,
      actionUrl: "/alunos",
      actionLabel: "Ver aluno",
    });
  }, [addNotification]);

  const handleNewPayment = useCallback((payload: any) => {
    const payment = payload.new;
    const isOverdue = payment.status === 'atrasado';
    
    addNotification({
      type: isOverdue ? "warning" : "info",
      title: isOverdue ? "Pagamento Atrasado ⚠️" : "Novo Pagamento Registrado",
      message: `${payment.descricao} - R$ ${(payment.valor / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      actionUrl: "/pagamentos",
      actionLabel: "Ver pagamento",
    });
  }, [addNotification]);

  const handleTaskReminder = useCallback((payload: any) => {
    const task = payload.new;
    if (task.reminder_enabled && !task.is_completed) {
      addNotification({
        type: "warning",
        title: "Lembrete de Tarefa 📅",
        message: `Tarefa "${task.title}" está pendente para hoje`,
        actionUrl: "/calendario",
        actionLabel: "Ver tarefa",
      });
    }
  }, [addNotification]);

  const handleRoleChange = useCallback((payload: any) => {
    const roleChange = payload.new;
    if (roleChange.user_id === user?.id) {
      addNotification({
        type: "info",
        title: "Suas Permissões Foram Alteradas",
        message: `Seu nível de acesso foi alterado para: ${roleChange.role}`,
        actionUrl: "/permissoes",
        actionLabel: "Ver detalhes",
      });
    }
  }, [addNotification, user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to realtime changes
    const channel = supabase
      .channel('realtime-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'synapse_transactions',
        },
        handleNewSale
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'students',
        },
        handleNewStudent
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'payments',
        },
        handleNewPayment
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'calendar_tasks',
        },
        handleTaskReminder
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles',
        },
        handleRoleChange
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, handleNewSale, handleNewStudent, handleNewPayment, handleTaskReminder, handleRoleChange]);
}
