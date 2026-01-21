// ============================================
// MOISÉS MEDEIROS - Push Notifications Manager
// Sistema de Push Notifications do Navegador
// ============================================

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface PushNotificationPreferences {
  enabled: boolean;
  sales: boolean;
  tasks: boolean;
  payments: boolean;
  students: boolean;
  whatsapp: boolean;
  system: boolean;
}

const DEFAULT_PREFERENCES: PushNotificationPreferences = {
  enabled: false,
  sales: true,
  tasks: true,
  payments: true,
  students: true,
  whatsapp: true,
  system: true,
};

export function usePushNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [preferences, setPreferences] = useState<PushNotificationPreferences>(DEFAULT_PREFERENCES);
  const [isSupported, setIsSupported] = useState(false);

  // Check browser support
  useEffect(() => {
    setIsSupported("Notification" in window);
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Load preferences from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("push_notification_preferences");
    if (stored) {
      try {
        setPreferences(JSON.parse(stored));
      } catch (e) {
        console.error("Error loading notification preferences:", e);
      }
    }
  }, []);

  // Save preferences
  const savePreferences = useCallback((newPrefs: Partial<PushNotificationPreferences>) => {
    setPreferences((prev) => {
      const updated = { ...prev, ...newPrefs };
      localStorage.setItem("push_notification_preferences", JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Request permission
  const requestPermission = useCallback(async () => {
    if (!isSupported) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === "granted") {
        savePreferences({ enabled: true });
        // Show welcome notification
        showNotification(
          "Notificações Ativadas! 🔔",
          "Você receberá alertas importantes em tempo real.",
          { tag: "welcome", requireInteraction: false }
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }, [isSupported, savePreferences]);

  // Show notification
  const showNotification = useCallback(
    (
      title: string,
      body: string,
      options?: {
        tag?: string;
        icon?: string;
        badge?: string;
        requireInteraction?: boolean;
        data?: any;
        onClick?: () => void;
      }
    ) => {
      if (!isSupported || permission !== "granted" || !preferences.enabled) {
        return null;
      }

      try {
        const notification = new Notification(title, {
          body,
          icon: options?.icon || "/favicon.png",
          badge: options?.badge || "/favicon.png",
          tag: options?.tag,
          requireInteraction: options?.requireInteraction ?? false,
          data: options?.data,
        });

        if (options?.onClick) {
          notification.onclick = () => {
            window.focus();
            options.onClick?.();
            notification.close();
          };
        }

        // Auto close after 5 seconds
        setTimeout(() => notification.close(), 5000);

        return notification;
      } catch (error) {
        console.error("Error showing notification:", error);
        return null;
      }
    },
    [isSupported, permission, preferences.enabled]
  );

  // Notification handlers for different types
  const notifySale = useCallback(
    (amount: number, source: string) => {
      if (!preferences.sales) return;
      showNotification(
        "Nova Venda! 💰",
        `R$ ${(amount / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} - ${source}`,
        {
          tag: "sale",
          onClick: () => (window.location.href = "/entradas"),
        }
      );
    },
    [preferences.sales, showNotification]
  );

  const notifyTask = useCallback(
    (title: string, priority?: string) => {
      if (!preferences.tasks) return;
      showNotification(
        priority === "alta" ? "Tarefa Urgente! 🔴" : "Lembrete de Tarefa 📋",
        title,
        {
          tag: "task",
          requireInteraction: priority === "alta",
          onClick: () => (window.location.href = "/tarefas"),
        }
      );
    },
    [preferences.tasks, showNotification]
  );

  const notifyPayment = useCallback(
    (description: string, isOverdue: boolean) => {
      if (!preferences.payments) return;
      showNotification(
        isOverdue ? "Pagamento Atrasado! ⚠️" : "Pagamento Pendente 💳",
        description,
        {
          tag: "payment",
          requireInteraction: isOverdue,
          onClick: () => (window.location.href = "/pagamentos"),
        }
      );
    },
    [preferences.payments, showNotification]
  );

  const notifyStudent = useCallback(
    (name: string) => {
      if (!preferences.students) return;
      showNotification("Novo Aluno! 🎓", `${name} se matriculou`, {
        tag: "student",
        onClick: () => (window.location.href = "/alunos/dashboard"),
      });
    },
    [preferences.students, showNotification]
  );

  const notifyWhatsApp = useCallback(
    (name: string, message: string) => {
      if (!preferences.whatsapp) return;
      showNotification(`WhatsApp: ${name} 📱`, message, {
        tag: "whatsapp",
        onClick: () => (window.location.href = "/central-whatsapp"),
      });
    },
    [preferences.whatsapp, showNotification]
  );

  const notifySystem = useCallback(
    (title: string, message: string) => {
      if (!preferences.system) return;
      showNotification(title, message, { tag: "system" });
    },
    [preferences.system, showNotification]
  );

  return {
    isSupported,
    permission,
    preferences,
    requestPermission,
    savePreferences,
    showNotification,
    notifySale,
    notifyTask,
    notifyPayment,
    notifyStudent,
    notifyWhatsApp,
    notifySystem,
  };
}
