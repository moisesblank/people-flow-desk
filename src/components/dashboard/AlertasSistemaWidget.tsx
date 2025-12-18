// 🔔 TRAMON v8 - Widget de Alertas do Sistema
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bell, AlertTriangle, CheckCircle2, Info, 
  X, Clock, Eye, ExternalLink 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface Alerta {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  origem: string;
  status: string;
  acao_sugerida: string | null;
  link: string | null;
  dados: unknown;
  created_at: string;
}

const TIPO_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; bgColor: string }> = {
  sucesso: { icon: CheckCircle2, color: "text-green-500", bgColor: "bg-green-500/10" },
  info: { icon: Info, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  importante: { icon: AlertTriangle, color: "text-amber-500", bgColor: "bg-amber-500/10" },
  urgente: { icon: AlertTriangle, color: "text-red-500", bgColor: "bg-red-500/10" },
};

export function AlertasSistemaWidget() {
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ novos: 0, total: 0 });

  useEffect(() => {
    fetchAlertas();
    
    // Realtime subscription para novos alertas
    const channel = supabase
      .channel('alertas-sistema')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'alertas_sistema' },
        (payload) => {
          const novoAlerta = payload.new as Alerta;
          setAlertas(prev => [novoAlerta, ...prev].slice(0, 20));
          setStats(prev => ({ ...prev, novos: prev.novos + 1 }));
          
          // Notificação toast para alertas urgentes
          if (novoAlerta.tipo === 'urgente' || novoAlerta.tipo === 'importante') {
            toast[novoAlerta.tipo === 'urgente' ? 'error' : 'warning'](novoAlerta.titulo, {
              description: novoAlerta.mensagem,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAlertas = async () => {
    try {
      const { data, error } = await supabase
        .from('alertas_sistema')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setAlertas(data || []);
      
      const novos = (data || []).filter(a => a.status === 'novo').length;
      setStats({ novos, total: (data || []).length });

    } catch (error) {
      console.error('Error fetching alertas:', error);
    } finally {
      setLoading(false);
    }
  };

  const marcarComoLido = async (id: string) => {
    try {
      await supabase
        .from('alertas_sistema')
        .update({ 
          status: 'lido',
          data_leitura: new Date().toISOString()
        })
        .eq('id', id);

      setAlertas(prev => 
        prev.map(a => a.id === id ? { ...a, status: 'lido' } : a)
      );
      setStats(prev => ({ ...prev, novos: Math.max(0, prev.novos - 1) }));

    } catch (error) {
      console.error('Error marking alerta as read:', error);
    }
  };

  const getTipoConfig = (tipo: string) => TIPO_CONFIG[tipo] || TIPO_CONFIG.info;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="p-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500">
                <Bell className="w-4 h-4 text-white" />
              </div>
              {stats.novos > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {stats.novos}
                </span>
              )}
            </div>
            Alertas do Sistema
          </div>
          <Badge variant="outline" className="text-xs">
            {stats.total} alertas
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[280px]">
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : alertas.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-8">
              <CheckCircle2 className="w-12 h-12 mb-2 text-green-500/50" />
              <span className="text-sm font-medium">Nenhum alerta</span>
              <span className="text-xs">Tudo funcionando normalmente</span>
            </div>
          ) : (
            <AnimatePresence>
              <div className="space-y-2">
                {alertas.map((alerta, index) => {
                  const config = getTipoConfig(alerta.tipo);
                  const Icon = config.icon;
                  const isNew = alerta.status === 'novo';
                  
                  return (
                    <motion.div
                      key={alerta.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-3 rounded-lg border transition-all ${
                        isNew 
                          ? `${config.bgColor} border-primary/30` 
                          : 'bg-card/30 border-border/30 opacity-70'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${config.color}`} />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`font-medium text-sm ${isNew ? '' : 'text-muted-foreground'}`}>
                              {alerta.titulo}
                            </span>
                            {isNew && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                Novo
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {alerta.mensagem}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {formatDistanceToNow(new Date(alerta.created_at), { 
                                addSuffix: true, 
                                locale: ptBR 
                              })}
                              <span className="px-1.5 py-0.5 rounded bg-muted/50">
                                {alerta.origem}
                              </span>
                            </div>
                            
                            <div className="flex gap-1">
                              {alerta.link && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6"
                                  onClick={() => window.open(alerta.link!, '_blank')}
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </Button>
                              )}
                              {isNew && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6"
                                  onClick={() => marcarComoLido(alerta.id)}
                                >
                                  <Eye className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                          
                          {alerta.acao_sugerida && isNew && (
                            <div className="mt-2 p-2 rounded bg-primary/5 border border-primary/20">
                              <span className="text-[10px] font-medium text-primary">
                                💡 {alerta.acao_sugerida}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </AnimatePresence>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
