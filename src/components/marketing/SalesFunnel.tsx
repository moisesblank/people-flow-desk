// ============================================
// FUNIL DE VENDAS DINÂMICO
// Visualização completa do pipeline de vendas com dados do DB
// ============================================

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Users, Eye, MousePointer, ShoppingCart, CreditCard, ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMarketingCampaigns } from "@/hooks/useMarketingCampaigns";

const stageConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  visitantes: { icon: Eye, color: "from-blue-500 to-blue-600", label: "Visitantes" },
  leads: { icon: Users, color: "from-purple-500 to-purple-600", label: "Leads" },
  interessados: { icon: MousePointer, color: "from-amber-500 to-amber-600", label: "Interessados" },
  carrinho: { icon: ShoppingCart, color: "from-emerald-500 to-emerald-600", label: "Carrinho" },
  compras: { icon: CreditCard, color: "from-primary to-primary/80", label: "Compras" },
};

const stageOrder = ['visitantes', 'leads', 'interessados', 'carrinho', 'compras'];

export function SalesFunnel() {
  const { funnelData, isLoading, refetch } = useMarketingCampaigns();

  // Ordenar dados do funil
  const orderedFunnelData = stageOrder
    .map(stage => funnelData.find(d => d.stage === stage))
    .filter(Boolean);

  const maxValue = orderedFunnelData[0]?.value || 1;

  // Calcular conversões
  const getConversion = (index: number, value: number) => {
    if (index === 0) return 100;
    const prevValue = orderedFunnelData[index - 1]?.value || 1;
    return (value / prevValue) * 100;
  };

  // Calcular métricas
  const totalVisitors = orderedFunnelData[0]?.value || 0;
  const totalCompras = orderedFunnelData[orderedFunnelData.length - 1]?.value || 0;
  const conversionRate = totalVisitors > 0 ? ((totalCompras / totalVisitors) * 100).toFixed(2) : '0';

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Funil de Vendas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Funil de Vendas
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {orderedFunnelData.map((data, index) => {
          if (!data) return null;
          const config = stageConfig[data.stage] || stageConfig.visitantes;
          const Icon = config.icon;
          const width = (data.value / maxValue) * 100;
          const isLast = index === orderedFunnelData.length - 1;
          const conversion = getConversion(index, data.value);
          
          return (
            <motion.div
              key={data.stage}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${config.color} flex-shrink-0`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">{config.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-foreground">
                        {data.value.toLocaleString('pt-BR')}
                      </span>
                      {index > 0 && (
                        <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-600">
                          {conversion.toFixed(1)}%
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="relative h-8 rounded-lg overflow-hidden bg-secondary/30">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${width}%` }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                      className={`absolute inset-y-0 left-0 bg-gradient-to-r ${config.color} rounded-lg`}
                    />
                  </div>
                </div>
              </div>
              
              {!isLast && (
                <div className="absolute left-5 top-full h-4 flex items-center justify-center">
                  <ArrowRight className="h-3 w-3 text-muted-foreground rotate-90" />
                </div>
              )}
            </motion.div>
          );
        })}
        
        {/* Métricas do Funil */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-border/50">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{conversionRate}%</p>
            <p className="text-xs text-muted-foreground">Taxa Conversão Total</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">R$ 89</p>
            <p className="text-xs text-muted-foreground">Custo por Lead</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">R$ 2.450</p>
            <p className="text-xs text-muted-foreground">Ticket Médio</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
