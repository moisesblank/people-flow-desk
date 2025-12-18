// 📊 TRAMON v8 - Métricas Diárias Widget
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, TrendingDown, DollarSign, Users, 
  CheckSquare, Target, ArrowUpRight, ArrowDownRight 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface MetricaConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  format: (value: number) => string;
}

const METRICAS_CONFIG: Record<string, MetricaConfig> = {
  entradas: {
    label: "Entradas",
    icon: DollarSign,
    color: "text-green-500",
    format: (v) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  },
  gastos: {
    label: "Gastos",
    icon: TrendingDown,
    color: "text-red-500",
    format: (v) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  },
  lucro: {
    label: "Lucro",
    icon: TrendingUp,
    color: "text-emerald-500",
    format: (v) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  },
  novos_alunos: {
    label: "Novos Alunos",
    icon: Users,
    color: "text-blue-500",
    format: (v) => String(v)
  },
  tarefas_concluidas: {
    label: "Tarefas",
    icon: CheckSquare,
    color: "text-purple-500",
    format: (v) => String(v)
  },
};

export function MetricasDiariasWidget() {
  const [metricas, setMetricas] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [produtividade, setProdutividade] = useState(0);

  useEffect(() => {
    fetchMetricasHoje();
  }, []);

  const fetchMetricasHoje = async () => {
    try {
      const hoje = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('metricas_diarias')
        .select('*')
        .eq('data', hoje)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setMetricas({
          entradas: data.receita_bruta || 0,
          gastos: data.valor_cancelado || 0,
          lucro: data.receita_liquida || 0,
          novos_alunos: data.novos_alunos || 0,
          tarefas_concluidas: data.aulas_concluidas || 0,
          tarefas_total: data.alunos_ativos || 0
        });

        // Calcular produtividade baseado em webhooks processados
        const webhooksTotal = data.webhooks_recebidos || 0;
        const webhooksProcessados = data.webhooks_processados || 0;
        if (webhooksTotal > 0) {
          setProdutividade(Math.round((webhooksProcessados / webhooksTotal) * 100));
        }
      }

    } catch (error) {
      console.error('Error fetching metricas:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVariation = (key: string): { value: number; positive: boolean } => {
    // Simulação de variação - em produção, comparar com dia anterior
    const variations: Record<string, number> = {
      entradas: 12.5,
      gastos: -5.2,
      lucro: 18.3,
      novos_alunos: 2,
    };
    return { 
      value: Math.abs(variations[key] || 0), 
      positive: (variations[key] || 0) >= 0 
    };
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500">
              <Target className="w-4 h-4 text-white" />
            </div>
            Métricas de Hoje
          </div>
          <Badge variant="outline" className="text-xs">
            {new Date().toLocaleDateString('pt-BR')}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(METRICAS_CONFIG).slice(0, 4).map(([key, config], index) => {
                const value = metricas[key] || 0;
                const variation = getVariation(key);
                const Icon = config.icon;

                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 rounded-lg bg-card/50 border border-border/50"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Icon className={`w-4 h-4 ${config.color}`} />
                      {variation.value > 0 && (
                        <div className={`flex items-center text-xs ${variation.positive ? 'text-green-500' : 'text-red-500'}`}>
                          {variation.positive ? (
                            <ArrowUpRight className="w-3 h-3" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3" />
                          )}
                          {variation.value}%
                        </div>
                      )}
                    </div>
                    <div className="text-lg font-bold">{config.format(value)}</div>
                    <div className="text-xs text-muted-foreground">{config.label}</div>
                  </motion.div>
                );
              })}
            </div>

            {/* Barra de Produtividade */}
            <div className="p-3 rounded-lg bg-card/50 border border-border/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Produtividade</span>
                <span className="text-sm font-bold text-purple-500">{produtividade}%</span>
              </div>
              <Progress value={produtividade} className="h-2" />
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <span>{metricas.tarefas_concluidas || 0} concluídas</span>
                <span>{metricas.tarefas_total || 0} total</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
