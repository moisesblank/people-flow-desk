// ============================================
// MOISÉS MEDEIROS v10.0 - INTEGRAÇÕES
// FASE 10: Novas Integrações Stripe + WhatsApp
// ============================================

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useQuantumReactivity } from "@/hooks/useQuantumReactivity";
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
  Globe,
  Github,
  Cloud,
  Cpu,
  HardDrive,
  Lock,
  Unlock,
  TrendingUp,
  AlertTriangle,
  CreditCard,
  MessageCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { WhatsAppShare } from "@/components/integrations/WhatsAppShare";
import { StripeIntegration } from "@/components/integrations/StripeIntegration";

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
  wordpress: { 
    icon: "🌐", 
    color: "from-blue-500/20 to-blue-600/10",
    description: "Sincronize posts e páginas do seu site" 
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
  github: { 
    icon: "🐙", 
    color: "from-gray-500/20 to-gray-600/10",
    description: "Sincronização de código e versionamento" 
  },
  "lovable cloud": { 
    icon: "☁️", 
    color: "from-pink-500/20 to-pink-600/10",
    description: "Backend e banco de dados gerenciado" 
  },
  "lovable ai": { 
    icon: "🤖", 
    color: "from-violet-500/20 to-violet-600/10",
    description: "Inteligência artificial integrada" 
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
    setWebhookUrl(`https://${projectId}.supabase.co/functions/v1/webhook-curso-quimica`);
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
      const response = await supabase.functions.invoke("webhook-curso-quimica", {
        body: {
          event: "test.webhook",
          source: "manual_test",
          data: {
            message: "Teste de conexão do sistema Curso de Química",
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

  const { gpuAnimationProps, shouldAnimate } = useQuantumReactivity();

  return (
    <div className="p-4 md:p-8 lg:p-12">
      <div className="mx-auto max-w-7xl">
        {/* Header - GPU optimized */}
        <motion.header 
          {...gpuAnimationProps.fadeUp}
          className="mb-10 will-change-transform transform-gpu"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <motion.div 
                className="flex items-center gap-3"
                {...gpuAnimationProps.slideIn}
              >
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
                  <Brain className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold tracking-wider text-primary">MOISÉS MEDEIROS</span>
                </div>
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
                Integrações
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl">
                Configure webhooks e conecte suas ferramentas ao Curso de Química.
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

        {/* Platform Status Cards - GPU optimized */}
        <motion.section
          {...gpuAnimationProps.fadeUp}
          transition={{ delay: 0.1 }}
          className="grid gap-4 md:grid-cols-3 mb-8 will-change-transform transform-gpu"
        >
          {/* Lovable Cloud Status */}
          <div className="glass-card rounded-xl p-5 bg-gradient-to-br from-pink-500/10 to-purple-500/10 border border-pink-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-pink-500/20">
                  <Cloud className="h-5 w-5 text-pink-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Lovable Cloud</h3>
                  <p className="text-xs text-muted-foreground">Backend & Database</p>
                </div>
              </div>
              <Badge className="bg-[hsl(var(--stats-green))] text-white">
                <CheckCircle className="h-3 w-3 mr-1" />
                Ativo
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Uso do mês</span>
                <span className="text-foreground font-medium">$0,02 / $25</span>
              </div>
              <Progress value={0.08} className="h-1.5" />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Database className="h-3 w-3" />
                <span>PostgreSQL • Edge Functions • Storage</span>
              </div>
            </div>
          </div>

          {/* GitHub Status */}
          <div className="glass-card rounded-xl p-5 bg-gradient-to-br from-gray-500/10 to-slate-500/10 border border-gray-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-500/20">
                  <Github className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">GitHub</h3>
                  <p className="text-xs text-muted-foreground">@moisesblank</p>
                </div>
              </div>
              <Badge className="bg-[hsl(var(--stats-green))] text-white">
                <CheckCircle className="h-3 w-3 mr-1" />
                Conectado
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                <span>Repositório privado sincronizado</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[hsl(var(--stats-green))]">
                <TrendingUp className="h-3 w-3" />
                <span>Sync bidirecional ativo</span>
              </div>
            </div>
          </div>

          {/* Lovable AI Status */}
          <div className="glass-card rounded-xl p-5 bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-violet-500/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-violet-500/20">
                  <Cpu className="h-5 w-5 text-violet-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Lovable AI</h3>
                  <p className="text-xs text-muted-foreground">Gemini 2.5 Flash</p>
                </div>
              </div>
              <Badge className="bg-[hsl(var(--stats-green))] text-white">
                <CheckCircle className="h-3 w-3 mr-1" />
                Ativo
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Uso IA</span>
                <span className="text-foreground font-medium">$0 / $1</span>
              </div>
              <Progress value={0} className="h-1.5" />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="h-3 w-3" />
                <span>Tutor IA • Assistente • Automações</span>
              </div>
            </div>
          </div>
        </motion.section>

        {/* NEW: Payment & Communication Integrations */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="grid gap-6 md:grid-cols-2 mb-8"
        >
          {/* Stripe Integration */}
          <StripeIntegration 
            isConnected={false}
            onConnect={() => {
              toast.info("Configurar Stripe", {
                description: "Use a integração Stripe nas configurações do projeto Lovable.",
              });
            }}
          />

          {/* WhatsApp Integration */}
          <div className="glass-card rounded-xl p-6 bg-gradient-to-br from-[#25D366]/10 to-[#128C7E]/10 border border-[#25D366]/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#25D366]/20">
                  <MessageCircle className="h-5 w-5 text-[#25D366]" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">WhatsApp Business</h3>
                  <p className="text-xs text-muted-foreground">Comunicação direta</p>
                </div>
              </div>
              <Badge className="bg-[hsl(var(--stats-green))] text-white">
                <CheckCircle className="h-3 w-3 mr-1" />
                Disponível
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Envie mensagens, notificações e compartilhe relatórios diretamente no WhatsApp.
            </p>
            <div className="flex gap-2">
              <WhatsAppShare 
                title="Testar WhatsApp" 
                defaultMessage="Olá! Esta é uma mensagem de teste do sistema Moisés Medeiros." 
              />
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Configurar
              </Button>
            </div>
          </div>
        </motion.section>

        {/* Webhook URL Card */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
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
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-foreground mb-3">
                Como Configurar Integrações
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-foreground mb-2">🔥 Hotmart</h3>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Acesse Hotmart → Ferramentas → Webhooks</li>
                    <li>Clique em "Adicionar Webhook"</li>
                    <li>Cole a URL: <code className="text-xs bg-secondary px-1 rounded break-all">{webhookUrl}?source=hotmart</code></li>
                    <li>Adicione o Header: <code className="text-xs bg-secondary px-1 rounded">x-hotmart-hottok</code> com seu token</li>
                    <li>Selecione eventos: PURCHASE_APPROVED, PURCHASE_REFUNDED</li>
                    <li>Salve e pronto!</li>
                  </ol>
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-2">🌐 WordPress</h3>
                  <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                    <li>Instale plugin "WP Webhooks" no WordPress</li>
                    <li>Vá em WP Webhooks → Outgoing</li>
                    <li>Cole a URL: <code className="text-xs bg-secondary px-1 rounded break-all">{webhookUrl}?source=wordpress</code></li>
                    <li>Selecione eventos: Post Published, Post Updated</li>
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
