import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Satellite, RefreshCw, Filter, CheckCircle, XCircle, Clock, Eye, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FuturisticPageHeader } from "@/components/ui/futuristic-page-header";

interface WebhookLog {
  id: string;
  source: string;
  event: string;
  status: string;
  payload_entrada: unknown;
  payload_saida: unknown;
  acoes_executadas: unknown;
  ias_acionadas: string[] | null;
  erro_detalhado: string | null;
  tempo_total_ms: number | null;
  created_at: string;
}

interface QueueItem {
  id: string;
  source: string;
  event: string;
  status: string;
  retry_count: number;
  error_message: string | null;
  created_at: string;
  processed_at: string | null;
}

const sourceIcons: Record<string, string> = {
  hotmart: "🔥",
  wordpress: "🌐",
  whatsapp: "💬",
  rdstation: "📧",
  youtube: "📺",
  unknown: "❓",
};

const statusColors: Record<string, string> = {
  sucesso: "bg-green-500/10 text-green-500 border-green-500/30",
  completed: "bg-green-500/10 text-green-500 border-green-500/30",
  erro: "bg-red-500/10 text-red-500 border-red-500/30",
  failed: "bg-red-500/10 text-red-500 border-red-500/30",
  processando: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  processing: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  pending: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  iniciado: "bg-blue-500/10 text-blue-500 border-blue-500/30",
};

export default function CentralMonitoramento() {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterSource, setFilterSource] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();

    // Subscribe to realtime updates
    const logsChannel = supabase
      .channel("logs_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "logs_integracao_detalhado" },
        () => {
          if (autoRefresh) fetchData();
        }
      )
      .subscribe();

    const queueChannel = supabase
      .channel("queue_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "webhooks_queue" },
        () => {
          if (autoRefresh) fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(logsChannel);
      supabase.removeChannel(queueChannel);
    };
  }, [autoRefresh]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Buscar logs de integração
      let logsQuery = supabase
        .from("logs_integracao_detalhado")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (filterSource !== "all") {
        logsQuery = logsQuery.eq("source", filterSource);
      }
      if (filterStatus !== "all") {
        logsQuery = logsQuery.eq("status", filterStatus);
      }

      const { data: logsData, error: logsError } = await logsQuery;

      if (!logsError && logsData) {
        setLogs(logsData as unknown as WebhookLog[]);
      }

      // Buscar itens na fila
      const { data: queueData, error: queueError } = await supabase
        .from("webhooks_queue")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (!queueError && queueData) {
        setQueueItems(queueData);
      }
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os logs.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "sucesso":
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "erro":
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-amber-500 animate-spin" />;
    }
  };

  const pendingCount = queueItems.filter((q) => q.status === "pending").length;
  const processingCount = queueItems.filter((q) => q.status === "processing").length;
  const successCount = logs.filter((l) => l.status === "sucesso").length;
  const errorCount = logs.filter((l) => l.status === "erro").length;

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      <FuturisticPageHeader
        title="Central de Monitoramento"
        subtitle="Acompanhe todas as integrações em tempo real"
        icon={Satellite}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Na Fila</p>
                <p className="text-2xl font-bold text-blue-500">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500/30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Processando</p>
                <p className="text-2xl font-bold text-amber-500">{processingCount}</p>
              </div>
              <RefreshCw className="h-8 w-8 text-amber-500/30 animate-spin" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Sucesso</p>
                <p className="text-2xl font-bold text-green-500">{successCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500/30" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Erros</p>
                <p className="text-2xl font-bold text-red-500">{errorCount}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
            <div className="flex items-center gap-4">
              <Button
                variant={autoRefresh ? "default" : "outline"}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`} />
                Auto-refresh {autoRefresh ? "ON" : "OFF"}
              </Button>
              <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                Atualizar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select value={filterSource} onValueChange={setFilterSource}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Plataforma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="hotmart">🔥 Hotmart</SelectItem>
                <SelectItem value="wordpress">🌐 WordPress</SelectItem>
                <SelectItem value="whatsapp">💬 WhatsApp</SelectItem>
                <SelectItem value="rdstation">📧 RD Station</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="sucesso">✅ Sucesso</SelectItem>
                <SelectItem value="erro">❌ Erro</SelectItem>
                <SelectItem value="processando">⏳ Processando</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Feed de Eventos */}
      <Card>
        <CardHeader>
          <CardTitle>📜 Feed de Eventos em Tempo Real</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <AnimatePresence mode="popLayout">
              {logs.map((log, index) => (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.02 }}
                  className={`flex items-center justify-between p-4 mb-2 rounded-lg border ${
                    statusColors[log.status] || "bg-muted"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(log.status)}
                    <span className="text-2xl">{sourceIcons[log.source] || "❓"}</span>
                    <div>
                      <p className="font-medium">
                        {log.source.toUpperCase()}: {log.event}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {log.ias_acionadas?.length > 0 && (
                          <span className="mr-2">IAs: {log.ias_acionadas.join(", ")}</span>
                        )}
                        {log.tempo_total_ms && <span>{log.tempo_total_ms}ms</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">
                      {new Date(log.created_at).toLocaleString("pt-BR")}
                    </span>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
                        <DialogHeader>
                          <DialogTitle>
                            Detalhes: {log.source}:{log.event}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-medium mb-2">Status</h4>
                            <Badge className={statusColors[log.status]}>
                              {log.status.toUpperCase()}
                            </Badge>
                          </div>
                          
                          {log.erro_detalhado && (
                            <div>
                              <h4 className="font-medium mb-2 text-red-500">Erro</h4>
                              <pre className="bg-red-500/10 p-3 rounded text-sm overflow-auto">
                                {log.erro_detalhado}
                              </pre>
                            </div>
                          )}

                          <div>
                            <h4 className="font-medium mb-2">Ações Executadas</h4>
                            <div className="flex flex-wrap gap-2">
                              {(Array.isArray(log.acoes_executadas) ? log.acoes_executadas : []).map((acao: string, i: number) => (
                                <Badge key={i} variant="outline">
                                  {acao}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium mb-2">Payload de Entrada</h4>
                            <pre className="bg-muted p-3 rounded text-sm overflow-auto max-h-[200px]">
                              {JSON.stringify(log.payload_entrada, null, 2)}
                            </pre>
                          </div>

                          {log.payload_saida && (
                            <div>
                              <h4 className="font-medium mb-2">Payload de Saída</h4>
                              <pre className="bg-muted p-3 rounded text-sm overflow-auto max-h-[200px]">
                                {JSON.stringify(log.payload_saida, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
