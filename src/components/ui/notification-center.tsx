// ============================================
// MOISES MEDEIROS v5.0 - NOTIFICATION CENTER
// Pilar 5: Sistema de Notificações
// ============================================

import { useState, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuantumReactivity } from "@/hooks/useQuantumReactivity";
import { 
  Bell, 
  Check, 
  CheckCheck, 
  X, 
  AlertCircle,
  Info,
  CheckCircle2,
  AlertTriangle,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

// Types
export interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

const notificationIcons = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
};

const notificationColors = {
  info: "text-stats-blue bg-stats-blue/10 border-stats-blue/20",
  success: "text-stats-green bg-stats-green/10 border-stats-green/20",
  warning: "text-stats-gold bg-stats-gold/10 border-stats-gold/20",
  error: "text-destructive bg-destructive/10 border-destructive/20",
};

function NotificationItem({ 
  notification, 
  onMarkAsRead, 
  onDelete 
}: { 
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const { gpuAnimationProps } = useQuantumReactivity();

  const Icon = notificationIcons[notification.type];
  const colorClass = notificationColors[notification.type];
  
  const timeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return "Agora";
    if (diffMins < 60) return `${diffMins}min`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  };

  return (
    <motion.div
      {...gpuAnimationProps.fadeUp}
      className={cn(
        "p-4 rounded-xl border transition-all will-change-transform transform-gpu",
        notification.read 
          ? "bg-card/30 border-border/30" 
          : "bg-card/60 border-border/50 shadow-sm"
      )}
    >
      <div className="flex gap-3">
        <div className={cn("p-2 rounded-lg border shrink-0", colorClass)}>
          <Icon className="h-4 w-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className={cn(
              "text-sm font-medium truncate",
              notification.read ? "text-muted-foreground" : "text-foreground"
            )}>
              {notification.title}
            </h4>
            <span className="text-xs text-muted-foreground shrink-0">
              {timeAgo(notification.timestamp)}
            </span>
          </div>
          
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {notification.message}
          </p>
          
          <div className="flex items-center gap-2 mt-2">
            {notification.actionUrl && notification.actionLabel && (
              <a 
                href={notification.actionUrl}
                className="text-xs text-primary hover:underline"
              >
                {notification.actionLabel}
              </a>
            )}
            
            <div className="flex-1" />
            
            {!notification.read && (
              <button
                onClick={() => onMarkAsRead(notification.id)}
                className="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Marcar como lida"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
            )}
            
            <button
              onClick={() => onDelete(notification.id)}
              className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              aria-label="Excluir notificação"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ✅ forwardRef para compatibilidade com Radix UI (Tooltip, Popover triggers)
export const NotificationCenter = forwardRef<HTMLDivElement, NotificationCenterProps>(
  function NotificationCenter({
    notifications,
    onMarkAsRead,
    onMarkAllAsRead,
    onDelete,
    onClearAll,
  }, ref) {
    const { gpuAnimationProps } = useQuantumReactivity();

    const [isOpen, setIsOpen] = useState(false);
    const unreadCount = notifications.filter(n => !n.read).length;

    return (
      <div ref={ref}>
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label={`Notificações${unreadCount > 0 ? `, ${unreadCount} não lidas` : ''}`}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <motion.span
                  {...gpuAnimationProps.scaleIn}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center will-change-transform transform-gpu"
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </motion.span>
              )}
            </Button>
          </PopoverTrigger>
          
          <PopoverContent 
            className="w-96 p-0 border-border/50 bg-card/95 backdrop-blur-xl"
            align="end"
            sideOffset={8}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/30">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Notificações</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    {unreadCount} nova{unreadCount > 1 ? "s" : ""}
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onMarkAllAsRead}
                    className="h-8 px-2 text-xs"
                  >
                    <CheckCheck className="h-3.5 w-3.5 mr-1" />
                    Marcar todas
                  </Button>
                )}
              </div>
            </div>
            
            {/* Notifications List */}
            <ScrollArea className="h-[400px]">
              <div className="p-3 space-y-2">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                      <Bell className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Nenhuma notificação
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Você está em dia!
                    </p>
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {notifications.map(notification => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        onMarkAsRead={onMarkAsRead}
                        onDelete={onDelete}
                      />
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </ScrollArea>
            
            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-border/30">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClearAll}
                  className="w-full h-8 text-xs text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  Limpar todas as notificações
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>
    );
  }
);
NotificationCenter.displayName = 'NotificationCenter';

// Hook para gerenciar notificações
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, "id" | "timestamp" | "read">) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      timestamp: new Date(),
      read: false,
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  };
}