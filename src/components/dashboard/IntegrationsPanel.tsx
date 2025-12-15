import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Link2, 
  Unplug, 
  Settings, 
  RefreshCw,
  CheckCircle,
  XCircle,
  ExternalLink,
  Copy,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Integration {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
  last_sync: string | null;
  sync_status: string;
  config: any;
}

const integrationIcons: Record<string, string> = {
  hotmart: "🔥",
  asaas: "💳",
  "google analytics": "📊",
  youtube: "📺",
  "google calendar": "📅",
  "make.com": "⚡",
};

export function IntegrationsPanel() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState("");

  useEffect(() => {
    fetchIntegrations();
    generateWebhookUrl();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const { data, error } = await supabase
        .from("synapse_integrations")
        .select("*")
        .order("name");

      if (error) throw error;
      setIntegrations((data as Integration[]) || []);
    } catch (error) {
      console.error("Error fetching integrations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateWebhookUrl = () => {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || "fyikfsasudgzsjmumdlw";
    const url = `https://${projectId}.supabase.co/functions/v1/webhook-synapse`;
    setWebhookUrl(url);
  };

  const copyWebhookUrl = (source?: string) => {
    const url = source ? `${webhookUrl}?source=${source}` : webhookUrl;
    navigator.clipboard.writeText(url);
    toast.success("URL copiada!", { description: url });
  };

  const toggleIntegration = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("synapse_integrations")
        .update({ 
          is_active: !currentStatus,
          sync_status: !currentStatus ? "active" : "disabled"
        })
        .eq("id", id);

      if (error) throw error;
      
      toast.success(!currentStatus ? "Integração ativada!" : "Integração desativada");
      fetchIntegrations();
    } catch (error) {
      console.error("Error toggling integration:", error);
      toast.error("Erro ao atualizar integração");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Link2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Integrações Externas</h3>
            <p className="text-xs text-muted-foreground">Configure suas fontes de dados</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={fetchIntegrations}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Webhook URL */}
      <div className="mb-6 p-4 rounded-xl bg-secondary/50 border border-border/50">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-[hsl(var(--stats-gold))]" />
            <span className="text-sm font-medium">URL do Webhook Universal</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => copyWebhookUrl()}>
            <Copy className="h-4 w-4 mr-1" /> Copiar
          </Button>
        </div>
        <code className="text-xs text-muted-foreground break-all block bg-background/50 p-2 rounded">
          {webhookUrl}
        </code>
        <p className="text-xs text-muted-foreground mt-2">
          Use <code>?source=hotmart</code>, <code>?source=asaas</code> ou <code>?source=make</code> para identificar a origem
        </p>
      </div>

      {/* Integrations List */}
      <div className="space-y-3">
        {integrations.map((integration, index) => (
          <motion.div
            key={integration.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
              integration.is_active 
                ? "bg-[hsl(var(--stats-green))]/5 border-[hsl(var(--stats-green))]/20" 
                : "bg-secondary/30 border-border/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{integrationIcons[integration.name.toLowerCase()] || "🔗"}</span>
              <div>
                <p className="font-medium text-foreground">{integration.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant={integration.is_active ? "default" : "secondary"} className="text-[10px]">
                    {integration.type}
                  </Badge>
                  {integration.last_sync && (
                    <span className="text-xs text-muted-foreground">
                      Sync: {new Date(integration.last_sync).toLocaleString("pt-BR")}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {integration.is_active ? (
                <CheckCircle className="h-4 w-4 text-[hsl(var(--stats-green))]" />
              ) : (
                <XCircle className="h-4 w-4 text-muted-foreground" />
              )}
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => copyWebhookUrl(integration.name.toLowerCase().replace(/\s+/g, "").replace(".com", ""))}
              >
                <Copy className="h-3 w-3" />
              </Button>

              <Button
                variant={integration.is_active ? "destructive" : "default"}
                size="sm"
                onClick={() => toggleIntegration(integration.id, integration.is_active)}
              >
                {integration.is_active ? (
                  <>
                    <Unplug className="h-3 w-3 mr-1" /> Desativar
                  </>
                ) : (
                  <>
                    <Link2 className="h-3 w-3 mr-1" /> Ativar
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Help */}
      <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/20">
        <div className="flex items-start gap-3">
          <ExternalLink className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="text-sm font-medium text-foreground">Como configurar?</p>
            <ol className="text-xs text-muted-foreground mt-2 space-y-1 list-decimal list-inside">
              <li>Copie a URL do webhook acima</li>
              <li>No Hotmart/Asaas/Make, adicione como "Webhook URL"</li>
              <li>Selecione os eventos que deseja receber (vendas, reembolsos, etc)</li>
              <li>Salve e os dados começarão a chegar em tempo real!</li>
            </ol>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
