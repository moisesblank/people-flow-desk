import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Sparkles, 
  Brain, 
  Link2, 
  Zap, 
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Copy,
  Settings,
  Shield,
  Database,
  Activity,
  Server,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Integration {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
  last_sync: string | null;
  sync_status: string;
  error_message: string | null;
  config: any;
}

interface EventLog {
  id: string;
  event_type: string;
  source: string;
  created_at: string;
  processed: boolean;
}

const integrationMeta: Record<string, { icon: string; color: string; description: string }> = {
  hotmart: { 
    icon: "🔥", 
    color: "from-orange-500/20 to-orange-600/10",
    description: "Receba vendas e assinaturas em tempo real" 
  },
  asaas: { 
    icon: "💳", 
    color: "from-blue-500/20 to-blue-600/10",
    description: "Pagamentos, cobranças e faturas" 
  },
  "google analytics": { 
    icon: "📊", 
    color: "from-yellow-500/20 to-yellow-600/10",
    description: "Tráfego e comportamento do site" 
  },
  youtube: { 
    icon: "📺", 
    color: "from-red-500/20 to-red-600/10",
    description: "Visualizações, inscritos e engajamento" 
  },
  "google calendar": { 
    icon: "📅", 
    color: "from-green-500/20 to-green-600/10",
    description: "Agenda e compromissos sincronizados" 
  },
  "make.com": { 
    icon: "⚡", 
    color: "from-purple-500/20 to-purple-600/10",
    description: "Automações e workflows personalizados" 
  },
};

export default function Integracoes() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [eventLogs, setEventLogs] = useState<EventLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");

  useEffect(() => {
    fetchData();
    generateWebhookUrl();

    // Subscribe to realtime events
    const channel = supabase
      .channel("integration-events")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "integration_events",
        },
        () => {
          fetchEventLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchIntegrations(), fetchEventLogs()]);
    setIsLoading(false);
  };

  const fetchIntegrations = async () => {
    const { data, error } = await supabase
      .from("synapse_integrations")
      .select("*")
      .order("name");

    if (!error) setIntegrations((data as Integration[]) || []);
  };

  const fetchEventLogs = async () => {
    const { data, error } = await supabase
      .from("integration_events")
      .select("id, event_type, source, created_at, processed")
      .order("created_at", { ascending: false })
      .limit(20);

    if (!error) setEventLogs((data as EventLog[]) || []);
  };

  const generateWebhookUrl = () => {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || "fyikfsasudgzsjmumdlw";
    setWebhookUrl(`https://${projectId}.supabase.co/functions/v1/webhook-synapse`);
  };

  const copyWebhookUrl = (source?: string) => {
    const url = source ? `${webhookUrl}?source=${source}` : webhookUrl;
    navigator.clipboard.writeText(url);
    toast.success("URL copiada!", { description: url });
  };

  const toggleIntegration = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("synapse_integrations")
      .update({ 
        is_active: !currentStatus,
        sync_status: !currentStatus ? "active" : "disabled",
        last_sync: !currentStatus ? new Date().toISOString() : null
      })
      .eq("id", id);

    if (error) {
      toast.error("Erro ao atualizar integração");
    } else {
      toast.success(!currentStatus ? "Integração ativada!" : "Integração desativada");
      fetchIntegrations();
    }
  };

  const testWebhook = async () => {
    try {
      const response = await supabase.functions.invoke("webhook-synapse", {
        body: {
          event: "test.webhook",
          source: "manual_test",
          data: {
            message: "Teste de conexão do sistema",
            timestamp: new Date().toISOString()
          }
        }
      });

      if (response.error) throw response.error;
      toast.success("Webhook testado com sucesso!", { description: "Verifique os logs abaixo" });
      fetchEventLogs();
    } catch (error) {
      toast.error("Erro ao testar webhook");
    }
  };

  return (
    <div className="p-4 md:p-8 lg:p-12">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <motion.div 
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                  <Brain className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold tracking-wider text-primary">CURSO - MOISÉS MEDEIROS</span>
                </div>
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
                Integrações
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl">
                Configure webhooks e conecte suas ferramentas ao sistema de gestão.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => fetchData()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              <Button onClick={testWebhook}>
                <Zap className="h-4 w-4 mr-2" />
                Testar Webhook
              </Button>
            </div>
          </div>
        </motion.header>

        {/* Webhook URL Card */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-6 mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary/50">
              <Link2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Webhook Universal</h2>
              <p className="text-sm text-muted-foreground">
                Use esta URL em todas as suas integrações externas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50 border border-border/50">
            <code className="flex-1 text-sm text-foreground font-mono break-all">
              {webhookUrl}
            </code>
            <Button onClick={() => copyWebhookUrl()}>
              <Copy className="h-4 w-4 mr-2" />
              Copiar
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {["hotmart", "asaas", "make", "zapier"].map((source) => (
              <Button
                key={source}
                variant="outline"
                size="sm"
                className="justify-start"
                onClick={() => copyWebhookUrl(source)}
              >
                <Copy className="h-3 w-3 mr-2" />
                ?source={source}
              </Button>
            ))}
          </div>
        </motion.section>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Integrations */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              Integrações Disponíveis
            </h2>
            
            <div className="space-y-3">
              {integrations.map((integration, index) => {
                const meta = integrationMeta[integration.name.toLowerCase()] || {
                  icon: "🔗",
                  color: "from-secondary to-secondary/50",
                  description: "Integração externa"
                };
                
                return (
                  <motion.div
                    key={integration.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className={`glass-card rounded-xl p-4 bg-gradient-to-r ${meta.color} border ${
                      integration.is_active ? "border-[hsl(var(--stats-green))]/30" : "border-border/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-3xl">{meta.icon}</span>
                        <div>
                          <h3 className="font-semibold text-foreground">{integration.name}</h3>
                          <p className="text-xs text-muted-foreground">{meta.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={integration.is_active ? "default" : "secondary"} className="text-[10px]">
                              {integration.type}
                            </Badge>
                            {integration.is_active && (
                              <span className="flex items-center gap-1 text-[10px] text-[hsl(var(--stats-green))]">
                                <Activity className="h-3 w-3" />
                                Ativo
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <Switch
                        checked={integration.is_active}
                        onCheckedChange={() => toggleIntegration(integration.id, integration.is_active)}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>

          {/* Event Logs */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-[hsl(var(--stats-green))]" />
              Logs em Tempo Real
            </h2>
            
            <div className="glass-card rounded-xl p-4 max-h-[500px] overflow-y-auto">
              {eventLogs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Nenhum evento recebido ainda</p>
                  <p className="text-xs mt-1">Configure seus webhooks e envie dados</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {eventLogs.map((log, index) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.02 * index }}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {log.processed ? (
                          <CheckCircle className="h-4 w-4 text-[hsl(var(--stats-green))]" />
                        ) : (
                          <Clock className="h-4 w-4 text-[hsl(var(--stats-gold))]" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-foreground">{log.event_type}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px]">
                              {log.source}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(log.created_at).toLocaleString("pt-BR")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.section>
        </div>

        {/* Help Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-8 glass-card rounded-2xl p-6"
        >
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-[hsl(var(--stats-blue))]/10">
              <ExternalLink className="h-6 w-6 text-[hsl(var(--stats-blue))]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-3">
                Como Configurar Integrações
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-foreground mb-2">🔥 Hotmart</h3>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Acesse Hotmart → Ferramentas → Webhooks</li>
                    <li>Clique em "Adicionar Webhook"</li>
                    <li>Cole a URL: <code className="text-xs bg-secondary px-1 rounded">{webhookUrl}?source=hotmart</code></li>
                    <li>Selecione eventos: PURCHASE_APPROVED, PURCHASE_REFUNDED</li>
                    <li>Salve e pronto!</li>
                  </ol>
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-2">💳 Asaas</h3>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Acesse Asaas → Integrações → Webhooks</li>
                    <li>Adicione um novo webhook</li>
                    <li>Cole a URL: <code className="text-xs bg-secondary px-1 rounded">{webhookUrl}?source=asaas</code></li>
                    <li>Selecione: PAYMENT_RECEIVED, PAYMENT_CONFIRMED</li>
                    <li>Ative e salve!</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
