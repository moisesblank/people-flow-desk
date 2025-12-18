// 📡 TRAMON v8 - Status de Webhooks em Tempo Real
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Webhook, CheckCircle2, XCircle, Clock, RefreshCw, 
  ArrowRight, Zap, Globe
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface WebhookLog {
  id: string;
  source: string;
  event: string;
  status: string;
  created_at: string;
  processed_at: string | null;
}

const SOURCE_COLORS: Record<string, string> = {
  hotmart: "bg-orange-500",
  wordpress: "bg-blue-500",
  whatsapp: "bg-green-500",
  manual: "bg-purple-500",
  stripe: "bg-indigo-500",
};

const STATUS_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  pending: { icon: Clock, color: "text-yellow-500" },
  processing: { icon: RefreshCw, color: "text-blue-500" },
  processed: { icon: CheckCircle2, color: "text-green-500" },
  error: { icon: XCircle, color: "text-red-500" },
};

export function WebhooksStatusWidget() {
  const [webhooks, setWebhooks] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, processed: 0, errors: 0 });

  useEffect(() => {
    fetchWebhooks();
    
    // Realtime subscription
    const channel = supabase
      .channel('webhooks-status')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'webhooks_queue' },
        () => fetchWebhooks()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchWebhooks = async () => {
    try {
      const { data, error } = await supabase
        .from('webhooks_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setWebhooks(data || []);

      // Calculate stats
      const { data: allWebhooks } = await supabase
        .from('webhooks_queue')
        .select('status');

      if (allWebhooks) {
        setStats({
          total: allWebhooks.length,
          pending: allWebhooks.filter(w => w.status === 'pending').length,
          processed: allWebhooks.filter(w => w.status === 'processed').length,
          errors: allWebhooks.filter(w => w.status === 'error').length,
        });
      }
    } catch (error) {
      console.error('Error fetching webhooks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSourceColor = (source: string) => SOURCE_COLORS[source] || "bg-gray-500";
  
  const getStatusConfig = (status: string) => STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500">
              <Webhook className="w-4 h-4 text-white" />
            </div>
            Webhooks
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs">
              <Clock className="w-3 h-3 mr-1" />
              {stats.pending}
            </Badge>
            <Badge variant="outline" className="text-xs text-green-500">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              {stats.processed}
            </Badge>
            {stats.errors > 0 && (
              <Badge variant="destructive" className="text-xs">
                <XCircle className="w-3 h-3 mr-1" />
                {stats.errors}
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : webhooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Globe className="w-8 h-8 mb-2" />
              <span className="text-sm">Nenhum webhook recente</span>
            </div>
          ) : (
            <div className="space-y-2">
              {webhooks.map((webhook, index) => {
                const statusConfig = getStatusConfig(webhook.status);
                const StatusIcon = statusConfig.icon;
                
                return (
                  <motion.div
                    key={webhook.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-2 rounded-lg bg-card/50 border border-border/50 hover:bg-card/80 transition-colors"
                  >
                    <div className={`w-2 h-2 rounded-full ${getSourceColor(webhook.source)}`} />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium uppercase">{webhook.source}</span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground truncate">
                          {webhook.event}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(webhook.created_at), { 
                          addSuffix: true, 
                          locale: ptBR 
                        })}
                      </span>
                    </div>
                    
                    <StatusIcon className={`w-4 h-4 ${statusConfig.color} ${webhook.status === 'processing' ? 'animate-spin' : ''}`} />
                  </motion.div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
