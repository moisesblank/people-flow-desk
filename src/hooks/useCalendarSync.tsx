// ============================================
// HOOK: Sincronização de Calendário
// Integra tarefas com Google Calendar + Lembretes
// ============================================

import { useState, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface Task {
  id: string;
  title: string;
  description: string | null;
  task_date: string;
  task_time: string | null;
  priority: string;
  category: string;
  reminder_enabled: boolean;
  user_id: string;
}

interface SyncResult {
  success: boolean;
  google?: { success: boolean; eventId?: string; error?: string };
  email?: { success: boolean; error?: string };
  message?: string;
}

export const useCalendarSync = () => {
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Obter token do Google Calendar salvo no localStorage
  const getGoogleToken = useCallback(() => {
    return localStorage.getItem('google_calendar_token');
  }, []);

  // Sincronizar tarefa com Google Calendar e enviar email
  const syncTask = useCallback(async (task: Task): Promise<SyncResult> => {
    setSyncing(true);
    setError(null);

    try {
      const accessToken = getGoogleToken();
      const userEmail = user?.email || 'moisesblank@gmail.com';

      const { data, error: fnError } = await supabase.functions.invoke('task-reminder', {
        body: {
          action: 'create_event',
          task: {
            ...task,
            user_id: user?.id || task.user_id,
          },
          email: userEmail,
          accessToken,
        },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Erro ao sincronizar');
      }

      // Mostrar feedback
      const messages: string[] = [];
      
      if (data.results?.google?.success) {
        messages.push('✓ Adicionado ao Google Calendar');
      } else if (accessToken && data.results?.google?.error) {
        messages.push('⚠ Google Calendar: ' + data.results.google.error);
      }
      
      if (data.results?.email?.success) {
        messages.push('✓ Email de lembrete enviado');
      } else if (task.reminder_enabled && data.results?.email?.error) {
        messages.push('⚠ Email: ' + data.results.email.error);
      }

      if (messages.length > 0) {
        toast({
          title: "Tarefa sincronizada!",
          description: messages.join('\n'),
        });
      }

      return data;
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Erro na sincronização",
        description: err.message,
        variant: "destructive",
      });
      return { success: false };
    } finally {
      setSyncing(false);
    }
  }, [user, toast, getGoogleToken]);

  // Sincronizar todas as tarefas pendentes
  const syncAllTasks = useCallback(async (): Promise<{ syncedCount: number }> => {
    setSyncing(true);
    setError(null);

    try {
      const accessToken = getGoogleToken();
      
      if (!accessToken) {
        throw new Error('Conecte seu Google Calendar primeiro');
      }

      const { data, error: fnError } = await supabase.functions.invoke('task-reminder', {
        body: {
          action: 'sync_all',
          userId: user?.id,
          accessToken,
        },
      });

      if (fnError) throw new Error(fnError.message);

      toast({
        title: "Sincronização completa!",
        description: `${data.syncedCount} tarefas sincronizadas com Google Calendar`,
      });

      return { syncedCount: data.syncedCount || 0 };
    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Erro na sincronização",
        description: err.message,
        variant: "destructive",
      });
      return { syncedCount: 0 };
    } finally {
      setSyncing(false);
    }
  }, [user, toast, getGoogleToken]);

  // Enviar lembrete por email para uma tarefa específica
  const sendReminder = useCallback(async (task: Task): Promise<boolean> => {
    setSyncing(true);

    try {
      const userEmail = user?.email || 'moisesblank@gmail.com';

      const { data, error: fnError } = await supabase.functions.invoke('task-reminder', {
        body: {
          action: 'send_reminder',
          task,
          email: userEmail,
        },
      });

      if (fnError) throw new Error(fnError.message);

      if (data.success) {
        toast({
          title: "Lembrete enviado!",
          description: `Email enviado para ${userEmail}`,
        });
      }

      return data.success;
    } catch (err: any) {
      toast({
        title: "Erro ao enviar lembrete",
        description: err.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setSyncing(false);
    }
  }, [user, toast]);

  // Verificar se Google Calendar está conectado
  const isGoogleConnected = useCallback(() => {
    return !!getGoogleToken();
  }, [getGoogleToken]);

  return {
    syncing,
    error,
    syncTask,
    syncAllTasks,
    sendReminder,
    isGoogleConnected: isGoogleConnected(),
  };
};
