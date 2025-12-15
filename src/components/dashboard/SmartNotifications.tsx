// ============================================
// MOISÉS MEDEIROS v8.0 - SMART NOTIFICATIONS
// Notificações Inteligentes com Priorização
// ============================================

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, 
  X, 
  AlertTriangle,
  CheckCircle2,
  Info,
  Clock,
  DollarSign,
  Users,
  Calendar,
  ArrowRight,
  Volume2,
  VolumeX
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SmartNotification {
  id: string;
  type: "success" | "warning" | "info" | "urgent";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  category: "financial" | "task" | "student" | "system";
  priority: number;
}

export function SmartNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    if (!user?.id) return;

    // Fetch existing notifications
    fetchNotifications();

    // Subscribe to realtime notifications
    const channel = supabase
      .channel("smart-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = mapNotification(payload.new);
          setNotifications(prev => [newNotif, ...prev]);
          
          if (soundEnabled) {
            playNotificationSound();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, soundEnabled]);

  const fetchNotifications = async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      setNotifications(data.map(mapNotification));
    }
  };

  const mapNotification = (raw: any): SmartNotification => {
    return {
      id: raw.id,
      type: raw.type || "info",
      title: raw.title,
      message: raw.message,
      timestamp: new Date(raw.created_at),
      read: raw.read || false,
      actionUrl: raw.action_url,
      actionLabel: raw.metadata?.action_label || "Ver detalhes",
      category: raw.metadata?.category || "system",
      priority: raw.metadata?.priority || 5,
    };
  };

  const playNotificationSound = () => {
    const audio = new Audio("/notification.mp3");
    audio.volume = 0.3;
    audio.play().catch(() => {
      // Ignore autoplay errors
    });
  };

  const markAsRead = async (id: string) => {
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id);

    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;

    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);

    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const dismissNotification = async (id: string) => {
    await supabase
      .from("notifications")
      .delete()
      .eq("id", id);

    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type: SmartNotification["type"], category: SmartNotification["category"]) => {
    if (category === "financial") return DollarSign;
    if (category === "task") return Calendar;
    if (category === "student") return Users;
    
    switch (type) {
      case "success": return CheckCircle2;
      case "warning": return AlertTriangle;
      case "urgent": return AlertTriangle;
      default: return Info;
    }
  };

  const getTypeStyles = (type: SmartNotification["type"]) => {
    switch (type) {
      case "success": 
        return { 
          bg: "bg-[hsl(var(--stats-green))]/10", 
          border: "border-[hsl(var(--stats-green))]/30",
          icon: "text-[hsl(var(--stats-green))]" 
        };
      case "warning": 
        return { 
          bg: "bg-[hsl(var(--stats-gold))]/10", 
          border: "border-[hsl(var(--stats-gold))]/30",
          icon: "text-[hsl(var(--stats-gold))]" 
        };
      case "urgent": 
        return { 
          bg: "bg-destructive/10", 
          border: "border-destructive/30",
          icon: "text-destructive" 
        };
      default: 
        return { 
          bg: "bg-[hsl(var(--stats-blue))]/10", 
          border: "border-[hsl(var(--stats-blue))]/30",
          icon: "text-[hsl(var(--stats-blue))]" 
        };
    }
  };

  const filteredNotifications = filter === "unread" 
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      {/* Notification Bell */}
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Bell className="h-5 w-5" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </div>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, x: 10 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, y: -10, x: 10 }}
              className="absolute right-0 top-12 w-96 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-border bg-muted/30">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground">Notificações</h3>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      disabled={unreadCount === 0}
                      className="text-xs"
                    >
                      Marcar todas como lidas
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setSoundEnabled(!soundEnabled)}
                    >
                      {soundEnabled ? (
                        <Volume2 className="h-4 w-4" />
                      ) : (
                        <VolumeX className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2">
                  <Button
                    variant={filter === "all" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setFilter("all")}
                    className="text-xs"
                  >
                    Todas
                  </Button>
                  <Button
                    variant={filter === "unread" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setFilter("unread")}
                    className="text-xs"
                  >
                    Não lidas
                    {unreadCount > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 justify-center">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </div>
              </div>

              {/* Notifications List */}
              <ScrollArea className="h-[400px]">
                {filteredNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                    <Bell className="h-12 w-12 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">
                      {filter === "unread" ? "Nenhuma notificação não lida" : "Nenhuma notificação"}
                    </p>
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {filteredNotifications.map((notification, index) => {
                      const Icon = getIcon(notification.type, notification.category);
                      const styles = getTypeStyles(notification.type);

                      return (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className={`relative p-3 rounded-xl transition-all ${
                            notification.read ? "bg-transparent" : styles.bg
                          } border ${notification.read ? "border-transparent" : styles.border} hover:bg-muted/50`}
                          onClick={() => !notification.read && markAsRead(notification.id)}
                        >
                          <div className="flex gap-3">
                            <div className={`p-2 rounded-lg ${styles.bg} shrink-0`}>
                              <Icon className={`h-4 w-4 ${styles.icon}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className={`text-sm font-medium ${notification.read ? "text-muted-foreground" : "text-foreground"}`}>
                                    {notification.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                    {notification.message}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    dismissNotification(notification.id);
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                              
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDistanceToNow(notification.timestamp, { 
                                    addSuffix: true, 
                                    locale: ptBR 
                                  })}
                                </span>
                                
                                {notification.actionUrl && (
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="h-auto p-0 text-xs text-primary"
                                    asChild
                                  >
                                    <a href={notification.actionUrl}>
                                      {notification.actionLabel}
                                      <ArrowRight className="h-3 w-3 ml-1" />
                                    </a>
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Unread Indicator */}
                          {!notification.read && (
                            <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>

              {/* Footer */}
              <div className="p-3 border-t border-border bg-muted/30">
                <Button variant="ghost" className="w-full text-xs" asChild>
                  <a href="/configuracoes?tab=notifications">
                    Configurar notificações
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </a>
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
