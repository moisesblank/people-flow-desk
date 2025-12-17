// ============================================
// MOISÉS MEDEIROS - Notification Settings
// Configurações de Push Notifications
// ============================================

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  BellOff,
  BellRing,
  DollarSign,
  CheckSquare,
  CreditCard,
  GraduationCap,
  MessageSquare,
  Settings,
  Smartphone,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { usePushNotifications, PushNotificationPreferences } from "@/hooks/usePushNotifications";
import { toast } from "sonner";

const notificationTypes = [
  {
    key: "sales" as keyof PushNotificationPreferences,
    icon: DollarSign,
    title: "Vendas",
    description: "Novas vendas e entradas financeiras",
    color: "text-stats-green",
  },
  {
    key: "tasks" as keyof PushNotificationPreferences,
    icon: CheckSquare,
    title: "Tarefas",
    description: "Lembretes e tarefas pendentes",
    color: "text-stats-blue",
  },
  {
    key: "payments" as keyof PushNotificationPreferences,
    icon: CreditCard,
    title: "Pagamentos",
    description: "Pagamentos pendentes e vencidos",
    color: "text-stats-purple",
  },
  {
    key: "students" as keyof PushNotificationPreferences,
    icon: GraduationCap,
    title: "Alunos",
    description: "Matrículas e atividade de alunos",
    color: "text-amber-500",
  },
  {
    key: "whatsapp" as keyof PushNotificationPreferences,
    icon: MessageSquare,
    title: "WhatsApp",
    description: "Mensagens e comandos do WhatsApp",
    color: "text-green-500",
  },
  {
    key: "system" as keyof PushNotificationPreferences,
    icon: Settings,
    title: "Sistema",
    description: "Atualizações e alertas do sistema",
    color: "text-muted-foreground",
  },
];

export function NotificationSettings() {
  const {
    isSupported,
    permission,
    preferences,
    requestPermission,
    savePreferences,
    showNotification,
  } = usePushNotifications();

  const [isLoading, setIsLoading] = useState(false);

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    try {
      const granted = await requestPermission();
      if (granted) {
        toast.success("Notificações ativadas com sucesso!");
      } else {
        toast.error("Permissão de notificações negada. Verifique as configurações do navegador.");
      }
    } catch (error) {
      toast.error("Erro ao ativar notificações");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleCategory = (key: keyof PushNotificationPreferences, value: boolean) => {
    savePreferences({ [key]: value });
    toast.success(`Notificações de ${notificationTypes.find((t) => t.key === key)?.title} ${value ? "ativadas" : "desativadas"}`);
  };

  const handleTestNotification = () => {
    showNotification(
      "Teste de Notificação 🔔",
      "Esta é uma notificação de teste. Tudo funcionando!",
      {
        tag: "test",
        requireInteraction: false,
      }
    );
    toast.success("Notificação de teste enviada!");
  };

  if (!isSupported) {
    return (
      <Card className="border-amber-500/30 bg-amber-500/5">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10">
              <BellOff className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <h3 className="font-semibold text-amber-700 dark:text-amber-400">
                Navegador não suportado
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Seu navegador não suporta notificações push. Tente usar Chrome, Firefox ou Edge.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Enable Card */}
      <Card className={permission === "granted" && preferences.enabled ? "border-stats-green/30" : ""}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${permission === "granted" && preferences.enabled ? "bg-stats-green/10" : "bg-muted"}`}>
                <BellRing className={`h-6 w-6 ${permission === "granted" && preferences.enabled ? "text-stats-green" : "text-muted-foreground"}`} />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Push Notifications
                  {permission === "granted" && preferences.enabled && (
                    <Badge className="bg-stats-green/20 text-stats-green border-stats-green/30">
                      Ativo
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Receba alertas em tempo real no seu navegador
                </CardDescription>
              </div>
            </div>
            
            {permission === "granted" ? (
              <Switch
                checked={preferences.enabled}
                onCheckedChange={(checked) => savePreferences({ enabled: checked })}
              />
            ) : (
              <Button onClick={handleEnableNotifications} disabled={isLoading}>
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="mr-2"
                  >
                    <Bell className="h-4 w-4" />
                  </motion.div>
                ) : (
                  <Bell className="h-4 w-4 mr-2" />
                )}
                Ativar Notificações
              </Button>
            )}
          </div>
        </CardHeader>

        {permission === "granted" && preferences.enabled && (
          <CardContent className="pt-0">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground flex-1">
                Notificações aparecerão mesmo quando a aba não estiver em foco
              </p>
              <Button variant="outline" size="sm" onClick={handleTestNotification}>
                Testar
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Category Settings */}
      {permission === "granted" && preferences.enabled && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Categorias de Notificação</CardTitle>
            <CardDescription>
              Escolha quais tipos de notificação você deseja receber
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {notificationTypes.map((type, index) => {
              const Icon = type.icon;
              return (
                <motion.div
                  key={type.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  {index > 0 && <Separator className="mb-4" />}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-muted">
                        <Icon className={`h-4 w-4 ${type.color}`} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{type.title}</p>
                        <p className="text-xs text-muted-foreground">{type.description}</p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences[type.key]}
                      onCheckedChange={(checked) => handleToggleCategory(type.key, checked)}
                    />
                  </div>
                </motion.div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Privacy Notice */}
      <Card className="border-muted bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Privacidade</p>
              <p className="text-xs text-muted-foreground mt-1">
                Suas preferências são salvas localmente no navegador. 
                Nenhum dado de notificação é enviado a terceiros.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
