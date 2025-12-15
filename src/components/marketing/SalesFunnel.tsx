// ============================================
// FUNIL DE VENDAS AVANÇADO
// Visualização completa do pipeline de vendas
// ============================================

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Users, Eye, MousePointer, ShoppingCart, CreditCard, ArrowRight } from "lucide-react";

interface FunnelStage {
  name: string;
  value: number;
  conversion: number;
  icon: React.ElementType;
  color: string;
}

const funnelData: FunnelStage[] = [
  { name: "Visitantes", value: 45000, conversion: 100, icon: Eye, color: "from-blue-500 to-blue-600" },
  { name: "Leads", value: 8500, conversion: 18.9, icon: Users, color: "from-purple-500 to-purple-600" },
  { name: "Interessados", value: 2400, conversion: 28.2, icon: MousePointer, color: "from-amber-500 to-amber-600" },
  { name: "Carrinho", value: 890, conversion: 37.1, icon: ShoppingCart, color: "from-emerald-500 to-emerald-600" },
  { name: "Compras", value: 356, conversion: 40.0, icon: CreditCard, color: "from-primary to-primary/80" },
];

export function SalesFunnel() {
  const maxValue = funnelData[0].value;

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Funil de Vendas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {funnelData.map((stage, index) => {
          const width = (stage.value / maxValue) * 100;
          const isLast = index === funnelData.length - 1;
          
          return (
            <motion.div
              key={stage.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${stage.color} flex-shrink-0`}>
                  <stage.icon className="h-4 w-4 text-white" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">{stage.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-foreground">
                        {stage.value.toLocaleString('pt-BR')}
                      </span>
                      {index > 0 && (
                        <Badge variant="secondary" className="text-xs bg-emerald-500/10 text-emerald-600">
                          {stage.conversion.toFixed(1)}%
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="relative h-8 rounded-lg overflow-hidden bg-secondary/30">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${width}%` }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                      className={`absolute inset-y-0 left-0 bg-gradient-to-r ${stage.color} rounded-lg`}
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
            <p className="text-2xl font-bold text-foreground">0.79%</p>
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
