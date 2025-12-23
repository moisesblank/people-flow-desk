// ==============================================================================
// WIDGET DE FINANÇAS DO WHATSAPP
// Mostra lançamentos financeiros criados via WhatsApp
// ==============================================================================

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, TrendingUp, TrendingDown, DollarSign,
  ExternalLink, Calendar, ArrowUpCircle, ArrowDownCircle
} from 'lucide-react';
import { useWhatsAppFinance, useWhatsAppStats } from '@/hooks/useWhatsAppData';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuantumReactivity } from '@/hooks/useQuantumReactivity';
import { Link } from 'react-router-dom';

interface WhatsAppFinanceWidgetProps {
  limit?: number;
  showHeader?: boolean;
  compact?: boolean;
}

export function WhatsAppFinanceWidget({ 
  limit = 10, 
  showHeader = true,
  compact = false 
}: WhatsAppFinanceWidgetProps) {
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
  const { data: finance = [], isLoading } = useWhatsAppFinance(period);
  const { data: stats } = useWhatsAppStats();
  
  const displayItems = finance.slice(0, limit);
  
  const totals = finance.reduce((acc, item) => {
    if (item.type === 'expense') acc.expenses += item.amount;
    if (item.type === 'income') acc.income += item.amount;
    if (item.type === 'payable') acc.payable += item.amount;
    if (item.type === 'receivable') acc.receivable += item.amount;
    return acc;
  }, { expenses: 0, income: 0, payable: 0, receivable: 0 });
  
  const balance = totals.income - totals.expenses;
  
  const getTypeConfig = (type: string) => {
    const config: Record<string, { label: string; icon: any; className: string }> = {
      expense: { 
        label: 'Gasto', 
        icon: ArrowDownCircle, 
        className: 'text-red-500 bg-red-500/10' 
      },
      income: { 
        label: 'Receita', 
        icon: ArrowUpCircle, 
        className: 'text-green-500 bg-green-500/10' 
      },
      payable: { 
        label: 'A Pagar', 
        icon: TrendingDown, 
        className: 'text-orange-500 bg-orange-500/10' 
      },
      receivable: { 
        label: 'A Receber', 
        icon: TrendingUp, 
        className: 'text-blue-500 bg-blue-500/10' 
      },
    };
    return config[type] || config.expense;
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };
  
  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="glass-card border-green-500/20">
      {showHeader && (
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-green-500" />
              Finanças via WhatsApp
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/financas-empresa">
                <ExternalLink className="h-3 w-3 mr-1" />
                Ver todas
              </Link>
            </Button>
          </div>
        </CardHeader>
      )}
      <CardContent className={compact ? "p-2" : "p-4"}>
        {/* Resumo rápido */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="p-2 rounded-lg bg-red-500/10 text-center">
            <p className="text-[10px] text-muted-foreground">Gastos</p>
            <p className="text-sm font-bold text-red-500">
              {formatCurrency(totals.expenses)}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-green-500/10 text-center">
            <p className="text-[10px] text-muted-foreground">Receitas</p>
            <p className="text-sm font-bold text-green-500">
              {formatCurrency(totals.income)}
            </p>
          </div>
          <div className={`p-2 rounded-lg text-center ${balance >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
            <p className="text-[10px] text-muted-foreground">Saldo</p>
            <p className={`text-sm font-bold ${balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {formatCurrency(balance)}
            </p>
          </div>
        </div>
        
        {/* Filtro de período */}
        <Tabs value={period} onValueChange={(v) => setPeriod(v as any)} className="mb-3">
          <TabsList className="grid grid-cols-3 h-7">
            <TabsTrigger value="today" className="text-xs">Hoje</TabsTrigger>
            <TabsTrigger value="week" className="text-xs">Semana</TabsTrigger>
            <TabsTrigger value="month" className="text-xs">Mês</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {/* Lista de lançamentos */}
        <ScrollArea className={compact ? "h-[150px]" : "h-[180px]"}>
          {displayItems.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-4">
              <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
              Nenhum lançamento no período
            </div>
          ) : (
            <AnimatePresence>
              {displayItems.map((item, index) => {
                const config = getTypeConfig(item.type);
                const Icon = config.icon;
                
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ delay: index * 0.03 }}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className={`p-1.5 rounded-lg ${config.className}`}>
                      <Icon className="h-3 w-3" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.description}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>{item.date ? format(new Date(item.date), 'dd/MM', { locale: ptBR }) : 'Sem data'}</span>
                        {item.counterparty && <span>• {item.counterparty}</span>}
                      </div>
                    </div>
                    <span className={`text-sm font-bold ${
                      item.type === 'expense' || item.type === 'payable' 
                        ? 'text-red-500' 
                        : 'text-green-500'
                    }`}>
                      {item.type === 'expense' || item.type === 'payable' ? '-' : '+'}
                      {formatCurrency(item.amount)}
                    </span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
