// ============================================
// MOISES MEDEIROS v10.0 - REALTIME NOTIFICATIONS
// Sistema de Notificações em Tempo Real Avançado
// EMPRESARIAL 2.0 - Integração Completa + Push
// ============================================

import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Notification } from "@/components/ui/notification-center";
import { usePushNotifications } from "@/hooks/usePushNotifications";

interface UseRealtimeNotificationsProps {
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void;
}

export function useRealtimeNotifications({ addNotification }: UseRealtimeNotificationsProps) {
  const { user } = useAuth();
  const { notifySale, notifyTask, notifyPayment, notifyStudent, notifyWhatsApp, notifySystem } = usePushNotifications();

  const handleNewSale = useCallback((payload: any) => {
    const sale = payload.new;
    const valor = sale.valor || 0;
    const fonte = sale.fonte || 'Nova entrada registrada';
    
    // In-app notification
    addNotification({
      type: "success",
      title: "Nova Venda Realizada! 🎉",
      message: `Venda de R$ ${(valor / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} - ${fonte}`,
      actionUrl: "/entradas",
      actionLabel: "Ver detalhes",
    });
    
    // Push notification
    notifySale(valor, fonte);
  }, [addNotification, notifySale]);

  const handleNewStudent = useCallback((payload: any) => {
    const student = payload.new;
    addNotification({
      type: "info",
      title: "Novo Aluno Matriculado! 📚",
      message: `${student.nome} se matriculou no sistema`,
      actionUrl: "/alunos/dashboard",
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

  const handleNewEnrollment = useCallback((payload: any) => {
    const enrollment = payload.new;
    addNotification({
      type: "success",
      title: "Nova Matrícula! 🎓",
      message: `Nova matrícula registrada no sistema`,
      actionUrl: "/alunos",
      actionLabel: "Ver matrícula",
    });
  }, [addNotification]);

  const handleLowStock = useCallback((payload: any) => {
    const reagent = payload.new;
    if (reagent.current_stock < reagent.minimum_stock) {
      addNotification({
        type: "error",
        title: "Estoque Baixo! ⚠️",
        message: `${reagent.name} está abaixo do estoque mínimo`,
        actionUrl: "/laboratorio",
        actionLabel: "Ver laboratório",
      });
    }
  }, [addNotification]);

  // Nova: WhatsApp Lead
  const handleNewWhatsAppLead = useCallback((payload: any) => {
    const lead = payload.new;
    addNotification({
      type: "success",
      title: "Novo Lead WhatsApp! 📱",
      message: `${lead.nome || 'Novo contato'} enviou mensagem via WhatsApp`,
      actionUrl: "/leads-whatsapp",
      actionLabel: "Ver lead",
    });
  }, [addNotification]);

  // Nova: Comando WhatsApp
  const handleWhatsAppCommand = useCallback((payload: any) => {
    const task = payload.new;
    if (task.source === 'whatsapp') {
      addNotification({
        type: "info",
        title: "Comando WhatsApp Processado ✅",
        message: `Tarefa "${task.title}" criada via WhatsApp`,
        actionUrl: "/tarefas",
        actionLabel: "Ver tarefa",
      });
    }
  }, [addNotification]);

  // Nova: Finanças WhatsApp
  const handleWhatsAppFinance = useCallback((payload: any) => {
    const finance = payload.new;
    if (finance.source === 'whatsapp') {
      const tipo = finance.type === 'income' ? 'Receita' : 'Despesa';
      addNotification({
        type: finance.type === 'income' ? "success" : "warning",
        title: `${tipo} via WhatsApp 💰`,
        message: `${finance.description}: R$ ${finance.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        actionUrl: "/financas-empresa",
        actionLabel: "Ver finanças",
      });
    }
  }, [addNotification]);

  // Nova: XP Ganho
  // ✅ MATRIZ SUPREMA v2.0.0: XP/Conquistas apontam para /alunos (área do aluno)
  const handleXPGained = useCallback((payload: any) => {
    const xp = payload.new;
    addNotification({
      type: "success",
      title: "XP Conquistado! ⭐",
      message: `+${xp.amount} XP - ${xp.description || xp.source}`,
      actionUrl: "/alunos",
      actionLabel: "Ver progresso",
    });
  }, [addNotification]);

  // Nova: Conquista Desbloqueada
  const handleAchievementUnlocked = useCallback((payload: any) => {
    const achievement = payload.new;
    addNotification({
      type: "success",
      title: "Nova Conquista Desbloqueada! 🏆",
      message: `Você desbloqueou: ${achievement.achievement_code}`,
      actionUrl: "/alunos",
      actionLabel: "Ver conquistas",
    });
  }, [addNotification]);

  // Nova: Automação Executada
  // ✅ MATRIZ SUPREMA v2.0.0: Automações são gestão → /gestaofc
  const handleAutomationExecuted = useCallback((payload: any) => {
    const rule = payload.new;
    if (rule.is_active) {
      addNotification({
        type: "info",
        title: "Automação Executada ⚡",
        message: `Regra "${rule.rule_name}" foi executada com sucesso`,
        actionUrl: "/gestaofc",
        actionLabel: "Ver automações",
      });
    }
  }, [addNotification]);

  useEffect(() => {
    if (!user?.id) return;

    // Subscribe to realtime changes
    const channel = supabase
      .channel('realtime-notifications-v3')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'income' },
        handleNewSale
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'students' },
        handleNewStudent
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'payments' },
        handleNewPayment
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'calendar_tasks' },
        handleTaskReminder
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_roles' },
        handleRoleChange
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'enrollments' },
        handleNewEnrollment
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'reagents' },
        handleLowStock
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'whatsapp_leads' },
        handleNewWhatsAppLead
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'command_tasks' },
        handleWhatsAppCommand
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'command_finance' },
        handleWhatsAppFinance
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'xp_history' },
        handleXPGained
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'user_achievements' },
        handleAchievementUnlocked
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'custom_rules' },
        handleAutomationExecuted
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    user?.id, 
    handleNewSale, 
    handleNewStudent, 
    handleNewPayment, 
    handleTaskReminder, 
    handleRoleChange, 
    handleNewEnrollment, 
    handleLowStock,
    handleNewWhatsAppLead,
    handleWhatsAppCommand,
    handleWhatsAppFinance,
    handleXPGained,
    handleAchievementUnlocked,
    handleAutomationExecuted
  ]);
}
