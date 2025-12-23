// ============================================
// 🔬 CENTRAL DE DIAGNÓSTICO v3.0
// Monitor completo do sistema ENA
// Owner Only - Visão Total
// ============================================

import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Activity, 
  Stethoscope, 
  Database, 
  Webhook, 
  Server, 
  Shield, 
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Zap,
  HardDrive,
  Brain,
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const CentralDiagnostico = () => {
  // Status geral do sistema
  const { data: systemStatus, refetch: refetchSystem, isLoading: loadingSystem } = useQuery({
    queryKey: ['diagnostico-system-status'],
    queryFn: async () => {
      const checks = { database: false, auth: false, storage: false, functions: false };

      const { error: dbError } = await supabase.from('profiles').select('id').limit(1);
      checks.database = !dbError;

      const { data: { user } } = await supabase.auth.getUser();
      checks.auth = !!user;

      const { data: buckets } = await supabase.storage.listBuckets();
      checks.storage = !!buckets && buckets.length > 0;

      try {
        const response = await supabase.functions.invoke('sna-gateway', { body: { action: 'health' } });
        checks.functions = !response.error;
      } catch {
        checks.functions = false;
      }

      return checks;
    },
    refetchInterval: 30000
  });

  // Webhooks recentes - usando colunas corretas
  const { data: webhookStats } = useQuery({
    queryKey: ['diagnostico-webhooks'],
    queryFn: async () => {
      const { data: events } = await supabase
        .from('integration_events')
        .select('id, event_type, source, processed, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

      const { count: totalToday } = await supabase
        .from('integration_events')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', new Date().toISOString().split('T')[0]);

      const { count: processedToday } = await supabase
        .from('integration_events')
        .select('id', { count: 'exact', head: true })
        .eq('processed', true)
        .gte('created_at', new Date().toISOString().split('T')[0]);

      const total = totalToday || 0;
      const processed = processedToday || 0;
      
      return {
        recent: events || [],
        totalToday: total,
        processedToday: processed,
        successRate: total > 0 ? Math.round((processed / total) * 100) : 100
      };
    },
    refetchInterval: 15000
  });

  // SNA Jobs status
  const { data: snaStatus } = useQuery({
    queryKey: ['diagnostico-sna'],
    queryFn: async () => {
      const { data: jobsData } = await supabase
        .from('sna_jobs')
        .select('id, job_type, status, priority, created_at')
        .order('created_at', { ascending: false })
        .limit(20);

      const { count: pending } = await supabase
        .from('sna_jobs')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: processing } = await supabase
        .from('sna_jobs')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'processing');

      const { count: failed } = await supabase
        .from('sna_jobs')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'failed');

      return {
        jobs: jobsData || [],
        pending: pending || 0,
        processing: processing || 0,
        failed: failed || 0
      };
    },
    refetchInterval: 10000
  });

  // Eventos de segurança - usando colunas corretas
  const { data: securityEvents } = useQuery({
    queryKey: ['diagnostico-security'],
    queryFn: async () => {
      const { data: events } = await supabase
        .from('security_events')
        .select('id, event_type, severity, source, description, created_at')
        .order('created_at', { ascending: false })
        .limit(30);

      const { count: criticalToday } = await supabase
        .from('security_events')
        .select('id', { count: 'exact', head: true })
        .gte('severity', 80)
        .gte('created_at', new Date().toISOString().split('T')[0]);

      return {
        recent: events || [],
        criticalToday: criticalToday || 0
      };
    },
    refetchInterval: 20000
  });

  // Usuários online
  const { data: usersOnline } = useQuery({
    queryKey: ['diagnostico-users-online'],
    queryFn: async () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      const { count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('is_online', true)
        .gte('last_activity_at', fiveMinutesAgo);

      return count || 0;
    },
    refetchInterval: 30000
  });

  const handleRefreshAll = () => {
    refetchSystem();
    toast.success('Diagnóstico atualizado!');
  };

  const getStatusBadge = (processed: boolean | null) => {
    if (processed) {
      return <Badge className="gap-1 bg-green-500/10 text-green-500 border-green-500/20"><CheckCircle2 className="h-3 w-3" />processado</Badge>;
    }
    return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />pendente</Badge>;
  };

  const getJobStatusBadge = (status: string) => {
    const isSuccess = status === 'completed';
    const isFailed = status === 'failed';
    const isProcessing = status === 'processing';
    
    if (isSuccess) return <Badge className="gap-1 bg-green-500/10 text-green-500 border-green-500/20"><CheckCircle2 className="h-3 w-3" />{status}</Badge>;
    if (isFailed) return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />{status}</Badge>;
    if (isProcessing) return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3 animate-spin" />{status}</Badge>;
    return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" />{status}</Badge>;
  };

  const getSeverityColor = (severity: number | null) => {
    const sev = severity || 0;
    if (sev >= 80) return 'text-red-500 bg-red-500/10';
    if (sev >= 50) return 'text-yellow-500 bg-yellow-500/10';
    if (sev >= 20) return 'text-blue-500 bg-blue-500/10';
    return 'text-muted-foreground bg-muted';
  };

  return (
    <>
      <Helmet>
        <title>Central de Diagnóstico | Gestão Moisés Medeiros</title>
      </Helmet>

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Stethoscope className="h-6 w-6 text-primary" />
              Central de Diagnóstico
            </h1>
            <p className="text-muted-foreground mt-1">Monitoramento completo do sistema ENA</p>
          </div>
          <Button onClick={handleRefreshAll} disabled={loadingSystem}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loadingSystem ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Database className={`h-5 w-5 ${systemStatus?.database ? 'text-green-500' : 'text-red-500'}`} />
                <div>
                  <p className="text-xs text-muted-foreground">Database</p>
                  <p className="font-semibold">{systemStatus?.database ? 'Online' : 'Offline'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Shield className={`h-5 w-5 ${systemStatus?.auth ? 'text-green-500' : 'text-red-500'}`} />
                <div>
                  <p className="text-xs text-muted-foreground">Auth</p>
                  <p className="font-semibold">{systemStatus?.auth ? 'Ativo' : 'Inativo'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <HardDrive className={`h-5 w-5 ${systemStatus?.storage ? 'text-green-500' : 'text-red-500'}`} />
                <div>
                  <p className="text-xs text-muted-foreground">Storage</p>
                  <p className="font-semibold">{systemStatus?.storage ? 'Online' : 'Offline'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Zap className={`h-5 w-5 ${systemStatus?.functions ? 'text-green-500' : 'text-yellow-500'}`} />
                <div>
                  <p className="text-xs text-muted-foreground">Functions</p>
                  <p className="font-semibold">{systemStatus?.functions ? 'Ativas' : 'Verificando'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-xs text-muted-foreground">Online</p>
                  <p className="font-semibold">{usersOnline || 0} usuários</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className={`h-5 w-5 ${(securityEvents?.criticalToday || 0) > 0 ? 'text-red-500' : 'text-green-500'}`} />
                <div>
                  <p className="text-xs text-muted-foreground">Alertas</p>
                  <p className="font-semibold">{securityEvents?.criticalToday || 0} críticos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="webhooks" className="space-y-4">
          <TabsList>
            <TabsTrigger value="webhooks" className="gap-2"><Webhook className="h-4 w-4" />Webhooks</TabsTrigger>
            <TabsTrigger value="sna" className="gap-2"><Brain className="h-4 w-4" />SNA Jobs</TabsTrigger>
            <TabsTrigger value="security" className="gap-2"><Shield className="h-4 w-4" />Segurança</TabsTrigger>
          </TabsList>

          <TabsContent value="webhooks">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Webhook className="h-5 w-5" />Eventos de Webhook
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="outline">{webhookStats?.totalToday || 0} hoje</Badge>
                    <Badge variant={webhookStats?.successRate === 100 ? "default" : "secondary"}>
                      {webhookStats?.successRate || 100}% processados
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {webhookStats?.recent?.map((event: any) => (
                      <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Server className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{event.event_type}</p>
                            <p className="text-xs text-muted-foreground">{event.source}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(event.processed)}
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(event.created_at), 'HH:mm:ss', { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    ))}
                    {(!webhookStats?.recent || webhookStats.recent.length === 0) && (
                      <p className="text-center text-muted-foreground py-8">Nenhum evento recente</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sna">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Brain className="h-5 w-5" />SNA Jobs Queue
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="outline">{snaStatus?.pending || 0} pendentes</Badge>
                    <Badge variant="secondary">{snaStatus?.processing || 0} processando</Badge>
                    {(snaStatus?.failed || 0) > 0 && <Badge variant="destructive">{snaStatus?.failed || 0} falhas</Badge>}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {snaStatus?.jobs?.map((job: any) => (
                      <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Zap className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{job.job_type}</p>
                            <p className="text-xs text-muted-foreground">Prioridade: {job.priority}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getJobStatusBadge(job.status)}
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(job.created_at), 'HH:mm:ss', { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    ))}
                    {(!snaStatus?.jobs || snaStatus.jobs.length === 0) && (
                      <p className="text-center text-muted-foreground py-8">Nenhum job na fila</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5" />Eventos de Segurança
                  </CardTitle>
                  {(securityEvents?.criticalToday || 0) > 0 && (
                    <Badge variant="destructive">{securityEvents?.criticalToday} críticos hoje</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {securityEvents?.recent?.map((event: any) => (
                      <div key={event.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded ${getSeverityColor(event.severity)}`}>
                            <Activity className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{event.event_type}</p>
                            <p className="text-xs text-muted-foreground">{event.description || event.source}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">Sev: {event.severity || 0}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(event.created_at), 'HH:mm:ss', { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    ))}
                    {(!securityEvents?.recent || securityEvents.recent.length === 0) && (
                      <p className="text-center text-muted-foreground py-8">Nenhum evento de segurança</p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

export default CentralDiagnostico;
