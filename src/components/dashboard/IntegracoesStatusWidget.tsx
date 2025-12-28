// 🔗 TRAMON v8 - Status de Integrações em Tempo Real
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Link2, CheckCircle2, XCircle, AlertCircle, RefreshCw,
  Globe, MessageSquare, Youtube, Instagram, Facebook,
  CreditCard, Database, Webhook
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface IntegrationStatus {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  status: 'connected' | 'warning' | 'disconnected' | 'checking';
  lastSync: string | null;
  health: number;
}

// WordPress removido em 2025-12-28
const INTEGRATIONS: IntegrationStatus[] = [
  { id: 'hotmart', name: 'Hotmart', icon: CreditCard, status: 'connected', lastSync: null, health: 100 },
  { id: 'whatsapp', name: 'WhatsApp', icon: MessageSquare, status: 'connected', lastSync: null, health: 100 },
  { id: 'youtube', name: 'YouTube', icon: Youtube, status: 'connected', lastSync: null, health: 100 },
  { id: 'instagram', name: 'Instagram', icon: Instagram, status: 'checking', lastSync: null, health: 75 },
  { id: 'facebook', name: 'Facebook Ads', icon: Facebook, status: 'checking', lastSync: null, health: 85 },
  { id: 'supabase', name: 'Database', icon: Database, status: 'connected', lastSync: null, health: 100 },
  { id: 'webhooks', name: 'Webhooks', icon: Webhook, status: 'connected', lastSync: null, health: 95 },
];

export function IntegracoesStatusWidget() {
  const { toast } = useToast();
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>(INTEGRATIONS);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    checkIntegrationsHealth();
  }, []);

  const checkIntegrationsHealth = async () => {
    try {
      // Verificar webhooks recentes
      const { data: webhooks } = await supabase
        .from('webhooks_queue')
        .select('source, status')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      // Verificar logs de integração
      const { data: logs } = await supabase
        .from('logs_integracao_detalhado')
        .select('source, status')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      // Atualizar status baseado nos dados
      setIntegrations(prev => prev.map(integration => {
        const recentWebhooks = webhooks?.filter(w => w.source === integration.id) || [];
        const recentLogs = logs?.filter(l => l.source === integration.id) || [];
        
        const hasErrors = recentWebhooks.some(w => w.status === 'error') || 
                          recentLogs.some(l => l.status === 'error');
        const hasActivity = recentWebhooks.length > 0 || recentLogs.length > 0;

        return {
          ...integration,
          status: hasErrors ? 'warning' : (hasActivity ? 'connected' : integration.status),
          health: hasErrors ? 75 : (hasActivity ? 100 : integration.health)
        };
      }));

    } catch (error) {
      console.error('Error checking integrations:', error);
    }
  };

  const syncAllIntegrations = async () => {
    setSyncing(true);
    try {
      await supabase.functions.invoke('automacoes', {
        body: { tipo: 'sync_metrics' }
      });

      toast({
        title: "✅ Sincronização iniciada",
        description: "Todas as integrações estão sendo sincronizadas",
      });

      setTimeout(checkIntegrationsHealth, 5000);
    } catch (error) {
      toast({
        title: "❌ Erro na sincronização",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle2 className="w-3 h-3 text-green-500" />;
      case 'warning': return <AlertCircle className="w-3 h-3 text-yellow-500" />;
      case 'disconnected': return <XCircle className="w-3 h-3 text-red-500" />;
      default: return <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500/10 border-green-500/30';
      case 'warning': return 'bg-yellow-500/10 border-yellow-500/30';
      case 'disconnected': return 'bg-red-500/10 border-red-500/30';
      default: return 'bg-blue-500/10 border-blue-500/30';
    }
  };

  const connectedCount = integrations.filter(i => i.status === 'connected').length;
  const totalHealth = Math.round(integrations.reduce((sum, i) => sum + i.health, 0) / integrations.length);

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-teal-500">
              <Link2 className="w-4 h-4 text-white" />
            </div>
            Integrações
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {connectedCount}/{integrations.length}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={syncAllIntegrations}
              disabled={syncing}
            >
              <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Health Bar */}
        <div className="p-3 rounded-lg bg-muted/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Saúde Geral</span>
            <span className={`text-sm font-bold ${totalHealth >= 90 ? 'text-green-500' : totalHealth >= 70 ? 'text-yellow-500' : 'text-red-500'}`}>
              {totalHealth}%
            </span>
          </div>
          <Progress value={totalHealth} className="h-2" />
        </div>

        {/* Integrations Grid */}
        <div className="grid grid-cols-2 gap-2">
          {integrations.map((integration, index) => {
            const Icon = integration.icon;
            return (
              <motion.div
                key={integration.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center gap-2 p-2 rounded-lg border ${getStatusColor(integration.status)}`}
              >
                <Icon className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{integration.name}</div>
                </div>
                {getStatusIcon(integration.status)}
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
