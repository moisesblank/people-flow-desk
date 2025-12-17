// ==============================================================================
// CARD DE ESTATÍSTICAS DO WHATSAPP - MELHORADO v2.0
// Central de Comando - Dashboard Principal
// ==============================================================================

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, CheckSquare, DollarSign, Users, 
  TrendingUp, TrendingDown, Zap, Star, ArrowRight,
  Wallet, Clock, Activity, Phone, ExternalLink
} from 'lucide-react';
import { useWhatsAppStats } from '@/hooks/useWhatsAppData';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';

export function WhatsAppStatsCard() {
  const { data: stats, isLoading } = useWhatsAppStats();
  const navigate = useNavigate();
  
  if (isLoading || !stats) {
    return (
      <Card className="glass-card border-green-500/20">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 bg-green-500/20 rounded-2xl"></div>
              <div className="flex-1 space-y-2">
                <div className="h-5 bg-muted rounded w-48"></div>
                <div className="h-4 bg-muted rounded w-32"></div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-20 bg-muted rounded-xl"></div>
              ))}
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
  
  const statsItems = [
    {
      label: 'Mensagens Hoje',
      value: stats.messagesHoje,
      icon: MessageSquare,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30'
    },
    {
      label: 'Tarefas Pendentes',
      value: stats.tarefasPendentes,
      icon: CheckSquare,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/30'
    },
    {
      label: 'Gastos via WhatsApp',
      value: formatCurrency(stats.gastosHoje),
      icon: Wallet,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30'
    },
    {
      label: 'Conversas VIP',
      value: stats.vipConversas,
      icon: Star,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30'
    }
  ];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="glass-card border-green-500/30 hover:border-green-500/50 transition-all overflow-hidden relative">
        {/* Gradient background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-green-500/10 via-emerald-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-green-600/10 to-transparent rounded-full blur-2xl pointer-events-none" />
        
        <CardContent className="p-6 relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {/* Ícone animado */}
              <div className="relative">
                <motion.div 
                  className="absolute inset-0 bg-green-500/30 rounded-2xl"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <div className="relative p-4 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/25">
                  <Phone className="h-7 w-7 text-white" />
                </div>
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-foreground">Central WhatsApp</h3>
                  <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 text-[10px] animate-pulse">
                    <Activity className="h-2.5 w-2.5 mr-1" />
                    LIVE
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Controle financeiro e tarefas via WhatsApp
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right mr-4">
                <p className="text-xs text-muted-foreground">Conversas Ativas</p>
                <p className="text-3xl font-bold text-green-500">{stats.totalConversas}</p>
              </div>
              <Button 
                variant="outline" 
                className="border-green-500/30 hover:bg-green-500/10 hover:border-green-500/50 gap-2"
                onClick={() => navigate('/central-whatsapp')}
              >
                Abrir Central
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statsItems.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-xl ${item.bgColor} border ${item.borderColor} hover:scale-[1.02] transition-transform cursor-default`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <item.icon className={`h-4 w-4 ${item.color}`} />
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                </div>
                <p className={`text-2xl font-bold ${item.color}`}>
                  {item.value}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="mt-6 pt-4 border-t border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Envie mensagens para controlar suas finanças</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">
                  "Gastei 50 reais de gasolina"
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  "Me lembre de pagar conta amanhã"
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
