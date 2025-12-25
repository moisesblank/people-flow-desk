// ============================================
// MOISES MEDEIROS v5.0 - NOTIFICATIONS DATABASE HOOK
// Pilar 5: Notificações e Alertas Proativos
// ============================================

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Notification } from "@/components/ui/notification-center";
import { toast } from "sonner";

interface DatabaseNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  action_url: string | null;
  metadata: any;
  created_at: string;
  expires_at: string | null;
}

export function useNotificationsDatabase() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch notifications from database
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, user_id, type, title, message, read, action_url, metadata, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      const mapped: Notification[] = (data || []).map((n: DatabaseNotification) => ({
        id: n.id,
        type: n.type as Notification["type"],
        title: n.title,
        message: n.message,
        read: n.read,
        timestamp: new Date(n.created_at),
        actionUrl: n.action_url || undefined,
        actionLabel: n.metadata?.actionLabel,
      }));

      setNotifications(mapped);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Add notification to database
  const addNotification = useCallback(async (
    notification: Omit<Notification, "id" | "timestamp" | "read">
  ) => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from("notifications")
        .insert({
          user_id: user.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          action_url: notification.actionUrl,
          metadata: notification.actionLabel ? { actionLabel: notification.actionLabel } : null,
        })
        .select()
        .single();

      if (error) throw error;

      // Add to local state immediately
      const newNotification: Notification = {
        id: data.id,
        type: data.type as Notification["type"],
        title: data.title,
        message: data.message,
        read: data.read,
        timestamp: new Date(data.created_at),
        actionUrl: data.action_url || undefined,
        actionLabel: notification.actionLabel,
      };

      setNotifications(prev => [newNotification, ...prev]);
    } catch (error) {
      console.error("Error adding notification:", error);
    }
  }, [user?.id]);

  // Mark as read
  const markAsRead = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", id);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success("Todas as notificações marcadas como lidas");
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  }, [user?.id]);

  // Delete notification
  const deleteNotification = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  }, []);

  // Clear all notifications
  const clearAll = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;

      setNotifications([]);
      toast.success("Todas as notificações foram removidas");
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  }, [user?.id]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Realtime subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const n = payload.new as DatabaseNotification;
          const newNotification: Notification = {
            id: n.id,
            type: n.type as Notification["type"],
            title: n.title,
            message: n.message,
            read: n.read,
            timestamp: new Date(n.created_at),
            actionUrl: n.action_url || undefined,
            actionLabel: n.metadata?.actionLabel,
          };

          setNotifications(prev => {
            // Avoid duplicates
            if (prev.some(p => p.id === newNotification.id)) return prev;
            return [newNotification, ...prev];
          });

          // Show toast for new notification
          toast(n.title, {
            description: n.message,
            action: n.action_url
              ? {
                  label: "Ver",
                  onClick: () => window.location.href = n.action_url!,
                }
              : undefined,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return {
    notifications,
    isLoading,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    refetch: fetchNotifications,
  };
}
