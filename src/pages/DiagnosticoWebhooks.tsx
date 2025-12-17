import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Webhook, 
  Clock,
  Copy,
  ExternalLink,
  Zap,
  ShoppingCart,
  Users,
  BarChart3,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface WebhookEvent {
  id: string;
  source: string;
  event_type: string;
  payload: any;
  processed: boolean;
  created_at: string;
}

const DiagnosticoWebhooks = () => {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  const webhookUrl = "https://fyikfsasudgzsjmumdlw.supabase.co/functions/v1/wordpress-webhook";

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('integration_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
      toast.error('Erro ao carregar eventos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();

    // Realtime subscription
    const channel = supabase
      .channel('webhook-events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'integration_events'
        },
        (payload) => {
          setEvents(prev => [payload.new as WebhookEvent, ...prev]);
          toast.success('🎉 Novo evento recebido!', {
            description: `${payload.new.event_type} de ${payload.new.source}`
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado!');
  };

  const testWebhook = async () => {
    setTestStatus('testing');
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-webhook-secret': 'moisesmedeiros2024'
        },
        body: JSON.stringify({
          event_type: 'test_connection',
          user_email: 'teste@moisesmedeiros.com.br',
          user_name: 'Teste de Conexão',
          event_data: {
            source: 'diagnostico_dashboard',
            timestamp: new Date().toISOString()
          }
        })
      });

      if (response.ok) {
        setTestStatus('success');
        toast.success('✅ Webhook funcionando!', {
          description: 'A conexão está ativa e recebendo dados'
        });
        setTimeout(() => fetchEvents(), 1000);
      } else {
        throw new Error('Resposta não OK');
      }
    } catch (error) {
      setTestStatus('error');
      toast.error('❌ Erro no teste', {
        description: 'Verifique as configurações do webhook'
      });
    } finally {
      setTimeout(() => setTestStatus('idle'), 3000);
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'woocommerce_order':
        return <ShoppingCart className="h-4 w-4 text-green-500" />;
      case 'user_registered':
        return <Users className="h-4 w-4 text-blue-500" />;
      case 'google_analytics':
        return <BarChart3 className="h-4 w-4 text-orange-500" />;
      case 'test_connection':
        return <Zap className="h-4 w-4 text-yellow-500" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getEventBadgeColor = (eventType: string) => {
    switch (eventType) {
      case 'woocommerce_order':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'user_registered':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'google_analytics':
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'test_connection':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const wordpressEvents = events.filter(e => e.source === 'wordpress');
  const woocommerceEvents = events.filter(e => e.event_type === 'woocommerce_order');
  const analyticsEvents = events.filter(e => e.event_type === 'google_analytics');

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Webhook className="h-8 w-8 text-primary" />
              Diagnóstico de Webhooks
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitore e teste a conexão com seu site WordPress
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchEvents} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button 
              onClick={testWebhook} 
              disabled={testStatus === 'testing'}
              className={
                testStatus === 'success' ? 'bg-green-500 hover:bg-green-600' :
                testStatus === 'error' ? 'bg-red-500 hover:bg-red-600' : ''
              }
            >
              {testStatus === 'testing' ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : testStatus === 'success' ? (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              ) : testStatus === 'error' ? (
                <XCircle className="h-4 w-4 mr-2" />
              ) : (
                <Zap className="h-4 w-4 mr-2" />
              )}
              {testStatus === 'testing' ? 'Testando...' : 
               testStatus === 'success' ? 'Conectado!' :
               testStatus === 'error' ? 'Falhou' : 'Testar Conexão'}
            </Button>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Activity className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{events.length}</p>
                  <p className="text-xs text-muted-foreground">Total de Eventos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{wordpressEvents.length}</p>
                  <p className="text-xs text-muted-foreground">WordPress</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <ShoppingCart className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{woocommerceEvents.length}</p>
                  <p className="text-xs text-muted-foreground">WooCommerce</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <BarChart3 className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{analyticsEvents.length}</p>
                  <p className="text-xs text-muted-foreground">Analytics</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Configuração do Webhook */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Webhook className="h-5 w-5" />
              Configuração do Webhook
            </CardTitle>
            <CardDescription>
              Use estas informações no Uncanny Automator do WordPress
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">URL do Webhook:</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-3 bg-background rounded-lg text-sm break-all border">
                  {webhookUrl}
                </code>
                <Button size="icon" variant="outline" onClick={() => copyToClipboard(webhookUrl)}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Header de Autenticação:</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-3 bg-background rounded-lg text-sm border">
                  x-webhook-secret: moisesmedeiros2024
                </code>
                <Button size="icon" variant="outline" onClick={() => copyToClipboard('x-webhook-secret: moisesmedeiros2024')}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-500">Lembre-se:</p>
                  <p className="text-muted-foreground">No Automator, configure o Header como JSON e inclua o Content-Type: application/json</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Events Log */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Eventos Recebidos
              {events.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  Tempo real
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Últimos 50 eventos recebidos do WordPress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <TabsList className="mb-4">
                <TabsTrigger value="all">Todos ({events.length})</TabsTrigger>
                <TabsTrigger value="wordpress">WordPress ({wordpressEvents.length})</TabsTrigger>
                <TabsTrigger value="woocommerce">WooCommerce ({woocommerceEvents.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                <EventList events={events} getEventIcon={getEventIcon} getEventBadgeColor={getEventBadgeColor} />
              </TabsContent>
              <TabsContent value="wordpress">
                <EventList events={wordpressEvents} getEventIcon={getEventIcon} getEventBadgeColor={getEventBadgeColor} />
              </TabsContent>
              <TabsContent value="woocommerce">
                <EventList events={woocommerceEvents} getEventIcon={getEventIcon} getEventBadgeColor={getEventBadgeColor} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const EventList = ({ 
  events, 
  getEventIcon, 
  getEventBadgeColor 
}: { 
  events: WebhookEvent[], 
  getEventIcon: (type: string) => JSX.Element,
  getEventBadgeColor: (type: string) => string
}) => {
  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Webhook className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium">Nenhum evento ainda</p>
        <p className="text-sm">Configure o Automator e os eventos aparecerão aqui em tempo real</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-2">
        {events.map((event) => (
          <div 
            key={event.id} 
            className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                {getEventIcon(event.event_type)}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={getEventBadgeColor(event.event_type)}>
                      {event.event_type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      de {event.source}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(event.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                  </p>
                  {event.payload && (
                    <details className="mt-2">
                      <summary className="text-xs text-primary cursor-pointer hover:underline">
                        Ver payload
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-w-md">
                        {JSON.stringify(event.payload, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
              <Badge variant={event.processed ? "default" : "secondary"}>
                {event.processed ? (
                  <><CheckCircle2 className="h-3 w-3 mr-1" /> Processado</>
                ) : (
                  <><Clock className="h-3 w-3 mr-1" /> Pendente</>
                )}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};

export default DiagnosticoWebhooks;
