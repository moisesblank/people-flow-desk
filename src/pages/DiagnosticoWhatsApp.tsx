import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Helmet } from 'react-helmet';
import { 
  Activity, CheckCircle2, XCircle, Clock, MessageSquare, 
  Paperclip, AlertTriangle, RefreshCw, Wifi, WifiOff, 
  TrendingUp, Server, Zap
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';

const DiagnosticoWhatsApp = () => {
  // Buscar diagnósticos
  const { data: diagnostics = [], isLoading, refetch } = useQuery({
    queryKey: ['webhook-diagnostics'],
    queryFn: async () => {
      const { data } = await supabase
        .from('webhook_diagnostics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      return data || [];
    },
    refetchInterval: 10000
  });

  // Estatísticas do dia
  const { data: todayStats } = useQuery({
    queryKey: ['webhook-stats-today'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data: messages } = await supabase
        .from('whatsapp_messages')
        .select('id, direction, message_type')
        .gte('created_at', today);
      
      const { data: attachments } = await supabase
        .from('whatsapp_attachments')
        .select('id, download_status')
        .gte('created_at', today);
      
      const { data: conversations } = await supabase
        .from('whatsapp_conversations')
        .select('id, session_mode')
        .gte('updated_at', today);

      return {
        totalMessages: messages?.length || 0,
        inbound: messages?.filter(m => m.direction === 'inbound').length || 0,
        outbound: messages?.filter(m => m.direction === 'outbound').length || 0,
        attachments: attachments?.length || 0,
        attachmentsFailed: attachments?.filter(a => a.download_status === 'failed').length || 0,
        activeConversations: conversations?.length || 0,
        activeSessions: conversations?.filter(c => c.session_mode === 'ASSISTOR_ON').length || 0
      };
    },
    refetchInterval: 30000
  });

  // Último evento
  const lastEvent = diagnostics[0];
  const isOnline = lastEvent && 
    new Date(lastEvent.created_at).getTime() > Date.now() - 5 * 60 * 1000;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      success: 'bg-green-500/10 text-green-500 border-green-500/20',
      completed: 'bg-green-500/10 text-green-500 border-green-500/20',
      failed: 'bg-red-500/10 text-red-500 border-red-500/20',
      error: 'bg-red-500/10 text-red-500 border-red-500/20',
      processing: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    };
    return variants[status] || 'bg-muted text-muted-foreground';
  };

  return (
    <>
      <Helmet>
        <title>Diagnóstico WhatsApp | Gestão Moisés Medeiros</title>
      </Helmet>

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary" />
              Diagnóstico WhatsApp
            </h1>
            <p className="text-muted-foreground mt-1">
              Monitoramento em tempo real do webhook e integrações
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge 
              variant="outline" 
              className={`px-3 py-1 ${isOnline ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}
            >
              {isOnline ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <MessageSquare className="h-8 w-8 text-blue-500 opacity-80" />
                  <span className="text-2xl font-bold">{todayStats?.totalMessages || 0}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Mensagens Hoje</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <TrendingUp className="h-8 w-8 text-green-500 opacity-80" />
                  <span className="text-2xl font-bold">{todayStats?.inbound || 0}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Recebidas</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Zap className="h-8 w-8 text-purple-500 opacity-80" />
                  <span className="text-2xl font-bold">{todayStats?.outbound || 0}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Enviadas</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Paperclip className="h-8 w-8 text-orange-500 opacity-80" />
                  <span className="text-2xl font-bold">{todayStats?.attachments || 0}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Anexos</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className={`border-red-500/20 ${(todayStats?.attachmentsFailed || 0) > 0 ? 'bg-red-500/10' : 'bg-gradient-to-br from-gray-500/10 to-gray-600/5'}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <AlertTriangle className="h-8 w-8 text-red-500 opacity-80" />
                  <span className="text-2xl font-bold">{todayStats?.attachmentsFailed || 0}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Falhas</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Server className="h-8 w-8 text-cyan-500 opacity-80" />
                  <span className="text-2xl font-bold">{todayStats?.activeConversations || 0}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Conversas Ativas</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="bg-gradient-to-br from-pink-500/10 to-pink-600/5 border-pink-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <Activity className="h-8 w-8 text-pink-500 opacity-80" />
                  <span className="text-2xl font-bold">{todayStats?.activeSessions || 0}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Sessões ON</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Logs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Eventos do Webhook</CardTitle>
            <CardDescription>Últimos 100 eventos processados</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : diagnostics.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum evento registrado ainda
                </div>
              ) : (
                <div className="space-y-2">
                  {diagnostics.map((event: any, index: number) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      {getStatusIcon(event.status)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{event.event_type}</span>
                          <Badge variant="outline" className={`text-xs ${getStatusBadge(event.status)}`}>
                            {event.status}
                          </Badge>
                          {event.processing_time_ms && (
                            <span className="text-xs text-muted-foreground">
                              {event.processing_time_ms}ms
                            </span>
                          )}
                        </div>
                        {event.error_message && (
                          <p className="text-xs text-red-500 mt-1 truncate">{event.error_message}</p>
                        )}
                        {event.metadata && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {JSON.stringify(event.metadata)}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(event.created_at), { addSuffix: true, locale: ptBR })}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Webhook Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Configuração do Webhook</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">URL do Webhook</label>
                <code className="block mt-1 p-2 bg-muted rounded text-xs break-all">
                  https://fyikfsasudgzsjmumdlw.supabase.co/functions/v1/whatsapp-webhook
                </code>
              </div>
              <div>
                <label className="text-sm font-medium">Verify Token</label>
                <code className="block mt-1 p-2 bg-muted rounded text-xs">
                  tramon_moises_2024
                </code>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Trigger de Ativação</label>
                <code className="block mt-1 p-2 bg-muted rounded text-xs">
                  "meu assessor"
                </code>
              </div>
              <div>
                <label className="text-sm font-medium">Timeout de Sessão</label>
                <code className="block mt-1 p-2 bg-muted rounded text-xs">
                  8 horas
                </code>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Administradores Autorizados</label>
              <div className="flex gap-2 mt-1">
                <Badge>Moises - 5583998920105</Badge>
                <Badge>Bruna - 5583996354090</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default DiagnosticoWhatsApp;
