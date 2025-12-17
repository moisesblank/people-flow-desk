// ==============================================================================
// CARD DE ESTATÍSTICAS DO WHATSAPP
// Para usar no Dashboard e outras páginas
// ==============================================================================

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, CheckSquare, DollarSign, Users, 
  TrendingUp, TrendingDown, Zap, Star
} from 'lucide-react';
import { useWhatsAppStats } from '@/hooks/useWhatsAppData';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export function WhatsAppStatsCard() {
  const { data: stats, isLoading } = useWhatsAppStats();
  
  if (isLoading || !stats) {
    return (
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="animate-pulse flex gap-4">
            <div className="h-12 w-12 bg-muted rounded-xl"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const formatCurrency = (value: number) => {
    if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(1)}k`;
    }
    return `R$ ${value.toFixed(0)}`;
  };
  
  return (
    <Link to="/central-whatsapp">
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Card className="glass-card border-green-500/30 hover:border-green-500/50 transition-all cursor-pointer overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              {/* Ícone com animação de pulso */}
              <div className="relative">
                <div className="absolute inset-0 bg-green-500/20 rounded-xl animate-ping"></div>
                <div className="relative p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
              </div>
              
              {/* Conteúdo */}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">Central WhatsApp</h3>
                  <Badge className="bg-green-500/20 text-green-500 text-[10px]">
                    <Zap className="h-2 w-2 mr-1" />
                    LIVE
                  </Badge>
                </div>
                
                {/* Métricas inline */}
                <div className="flex items-center gap-3 mt-1 text-xs">
                  <span className="flex items-center gap-1 text-blue-400">
                    <MessageSquare className="h-3 w-3" />
                    {stats.messagesHoje} msgs
                  </span>
                  <span className="flex items-center gap-1 text-orange-400">
                    <CheckSquare className="h-3 w-3" />
                    {stats.tarefasPendentes} tarefas
                  </span>
                  <span className="flex items-center gap-1 text-red-400">
                    <TrendingDown className="h-3 w-3" />
                    {formatCurrency(stats.gastosHoje)}
                  </span>
                  <span className="flex items-center gap-1 text-purple-400">
                    <Star className="h-3 w-3" />
                    {stats.vipConversas} VIP
                  </span>
                </div>
              </div>
              
              {/* Indicador de atividade */}
              <div className="flex flex-col items-end">
                <span className="text-xs text-muted-foreground">Conversas</span>
                <span className="text-lg font-bold text-green-500">{stats.totalConversas}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </Link>
  );
}
