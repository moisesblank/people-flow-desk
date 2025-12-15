// ============================================
// SINCRONIZAÇÃO GOOGLE CALENDAR
// Integração completa com Google Calendar
// ============================================

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { 
  CalendarDays, 
  RefreshCw, 
  Check, 
  X, 
  ExternalLink,
  Clock,
  MapPin,
  Users,
  Loader2,
  Unlink,
  Link2
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime: string };
  end: { dateTime: string };
  htmlLink?: string;
}

export function GoogleCalendarSync() {
  const { toast } = useToast();
  const { 
    loading, 
    error, 
    isConnected, 
    getAuthUrl, 
    exchangeToken, 
    listEvents, 
    syncTasks, 
    disconnect 
  } = useGoogleCalendar();
  
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [autoSync, setAutoSync] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  // Check for auth code in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code && !isConnected) {
      handleAuthCallback(code);
    }
  }, []);

  // Load events when connected
  useEffect(() => {
    if (isConnected) {
      loadEvents();
    }
  }, [isConnected]);

  const handleAuthCallback = async (code: string) => {
    const success = await exchangeToken(code);
    if (success) {
      toast({ title: "Conectado ao Google Calendar!" });
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
      loadEvents();
    } else {
      toast({ title: "Erro na conexão", variant: "destructive" });
    }
  };

  const handleConnect = async () => {
    const authUrl = await getAuthUrl();
    if (authUrl) {
      window.location.href = authUrl;
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setEvents([]);
    toast({ title: "Desconectado do Google Calendar" });
  };

  const loadEvents = async () => {
    const fetchedEvents = await listEvents();
    setEvents(fetchedEvents);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const count = await syncTasks();
      setLastSync(new Date());
      toast({ 
        title: "Sincronização concluída!", 
        description: `${count} tarefas sincronizadas` 
      });
      await loadEvents();
    } catch (err) {
      toast({ title: "Erro na sincronização", variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Google Calendar
            </CardTitle>
            <CardDescription>
              Sincronize suas tarefas com o Google Calendar
            </CardDescription>
          </div>
          <Badge 
            variant={isConnected ? "default" : "secondary"}
            className={isConnected ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : ""}
          >
            {isConnected ? (
              <>
                <Check className="h-3 w-3 mr-1" />
                Conectado
              </>
            ) : (
              <>
                <X className="h-3 w-3 mr-1" />
                Desconectado
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <CalendarDays className="h-8 w-8 text-primary" />
            </div>
            <h3 className="font-medium text-foreground mb-2">
              Conecte seu Google Calendar
            </h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
              Sincronize suas tarefas automaticamente e nunca perca um compromisso
            </p>
            <Button onClick={handleConnect} disabled={loading} className="gap-2">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Link2 className="h-4 w-4" />
              )}
              Conectar Google Calendar
            </Button>
          </div>
        ) : (
          <>
            {/* Controles */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
              <div className="flex items-center gap-3">
                <Switch 
                  checked={autoSync} 
                  onCheckedChange={setAutoSync} 
                />
                <div>
                  <p className="text-sm font-medium text-foreground">Sincronização automática</p>
                  <p className="text-xs text-muted-foreground">Atualiza a cada 30 minutos</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSync}
                disabled={syncing}
                className="gap-2"
              >
                {syncing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Sincronizar
              </Button>
            </div>

            {lastSync && (
              <p className="text-xs text-muted-foreground text-center">
                Última sincronização: {format(lastSync, "dd/MM 'às' HH:mm", { locale: ptBR })}
              </p>
            )}

            {/* Próximos eventos */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">Próximos Eventos</h4>
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum evento próximo
                </p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {events.slice(0, 5).map((event) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-lg border border-border/50 hover:border-primary/30 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {event.summary}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(parseISO(event.start.dateTime), "dd/MM HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                        {event.htmlLink && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => window.open(event.htmlLink, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Desconectar */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleDisconnect}
              className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Unlink className="h-4 w-4 mr-2" />
              Desconectar
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
