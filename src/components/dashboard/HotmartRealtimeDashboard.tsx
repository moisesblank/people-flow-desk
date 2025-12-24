// ============================================
// HOTMART REALTIME DASHBOARD v2.0
// Dashboard completo com vendas em tempo real
// ============================================

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  Users,
  CheckCircle,
  XCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Zap,
  Eye,
  RefreshCw,
  Bell
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface HotmartStats {
  vendasHoje: number;
  receitaHoje: number;
  vendasMes: number;
  receitaMes: number;
  alunosAtivos: number;
  alunosNovosHoje: number;
  taxaConversao: number;
  ticketMedio: number;
}

interface RecentSale {
  id: string;
  buyer_name: string;
  buyer_email: string;
  valor_bruto: number;
  product_name: string;
  status: string;
  created_at: string;
  affiliate_name?: string;
}

interface IntegrationEvent {
  id: string;
  event_type: string;
  source: string;
  payload: any;
  created_at: string;
  processed: boolean;
}

export function HotmartRealtimeDashboard() {
  const [stats, setStats] = useState<HotmartStats>({
    vendasHoje: 0,
    receitaHoje: 0,
    vendasMes: 0,
    receitaMes: 0,
    alunosAtivos: 0,
    alunosNovosHoje: 0,
    taxaConversao: 0,
    ticketMedio: 0
  });
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [recentEvents, setRecentEvents] = useState<IntegrationEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [newSaleAlert, setNewSaleAlert] = useState<RecentSale | null>(null);

  // Buscar dados
  const fetchData = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      // Vendas de hoje
      const { data: vendasHoje } = await supabase
        .from("transacoes_hotmart_completo")
        .select("*")
        .gte("created_at", today.toISOString())
        .in("status", ["approved", "purchase_approved", "purchase_complete"]);

      // Vendas do mês
      const { data: vendasMes } = await supabase
        .from("transacoes_hotmart_completo")
        .select("*")
        .gte("created_at", startOfMonth.toISOString())
        .in("status", ["approved", "purchase_approved", "purchase_complete"]);

      // Alunos ativos
      const { count: alunosAtivos } = await supabase
        .from("alunos")
        .select("*", { count: "exact", head: true })
        .eq("status", "ativo");

      // Alunos novos hoje
      const { count: alunosNovosHoje } = await supabase
        .from("alunos")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today.toISOString());

      // Últimas vendas
      const { data: ultimasVendas } = await supabase
        .from("transacoes_hotmart_completo")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

      // Últimos eventos de integração
      const { data: ultimosEventos } = await supabase
        .from("integration_events")
        .select("*")
        .eq("source", "hotmart")
        .order("created_at", { ascending: false })
        .limit(10);

      // Calcular stats
      const receitaHoje = vendasHoje?.reduce((acc, v) => acc + (v.valor_bruto || 0), 0) || 0;
      const receitaMes = vendasMes?.reduce((acc, v) => acc + (v.valor_bruto || 0), 0) || 0;
      const qtdVendasMes = vendasMes?.length || 0;
      const ticketMedio = qtdVendasMes > 0 ? receitaMes / qtdVendasMes : 0;

      setStats({
        vendasHoje: vendasHoje?.length || 0,
        receitaHoje,
        vendasMes: qtdVendasMes,
        receitaMes,
        alunosAtivos: alunosAtivos || 0,
        alunosNovosHoje: alunosNovosHoje || 0,
        taxaConversao: 0, // Calcular com dados de leads
        ticketMedio
      });

      setRecentSales(ultimasVendas || []);
      setRecentEvents(ultimosEventos || []);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Erro ao buscar dados Hotmart:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Realtime - Novas transações
    const transacoesChannel = supabase
      .channel("hotmart_transacoes_realtime")
      .on(
        "postgres_changes",
        { 
          event: "INSERT", 
          schema: "public", 
          table: "transacoes_hotmart_completo"
        },
        (payload) => {
          // 🛡️ LEI V: Log sem dados sensíveis
          if (import.meta.env.DEV) {
            console.log("[Hotmart Dashboard] Nova transação recebida");
          }
          const newSale = payload.new as RecentSale;
          
          // Mostrar alerta de nova venda
          if (["approved", "purchase_approved", "purchase_complete"].includes(newSale.status)) {
            setNewSaleAlert(newSale);
            setTimeout(() => setNewSaleAlert(null), 5000);
          }
          
          fetchData();
        }
      )
      .subscribe();

    // Realtime - Eventos de integração
    const eventsChannel = supabase
      .channel("hotmart_events_realtime")
      .on(
        "postgres_changes",
        { 
          event: "INSERT", 
          schema: "public", 
          table: "integration_events",
          filter: "source=eq.hotmart"
        },
        () => fetchData()
      )
      .subscribe();

    // Auto-refresh a cada 30 segundos
    const interval = setInterval(fetchData, 30000);

    return () => {
      supabase.removeChannel(transacoesChannel);
      supabase.removeChannel(eventsChannel);
      clearInterval(interval);
    };
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase() || "";
    if (["approved", "purchase_approved", "purchase_complete"].includes(statusLower)) {
      return "bg-green-500/10 text-green-500 border-green-500/30";
    }
    if (["canceled", "refunded", "chargeback"].includes(statusLower)) {
      return "bg-red-500/10 text-red-500 border-red-500/30";
    }
    return "bg-amber-500/10 text-amber-500 border-amber-500/30";
  };

  return (
    <div className="space-y-6">
      {/* Alerta de Nova Venda */}
      <AnimatePresence>
        {newSaleAlert && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className="fixed top-4 right-4 z-50"
          >
            <Card className="bg-green-500/10 border-green-500/50 shadow-2xl shadow-green-500/20">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Bell className="h-6 w-6 text-green-500 animate-bounce" />
                </div>
                <div>
                  <p className="font-bold text-green-500">🎉 NOVA VENDA!</p>
                  <p className="text-sm">{newSaleAlert.buyer_name}</p>
                  <p className="text-lg font-bold text-green-400">
                    {formatCurrency(newSaleAlert.valor_bruto || 0)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header com status de conexão */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm text-muted-foreground">
            Conectado ao Hotmart em tempo real
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Atualizado {formatDistanceToNow(lastUpdate, { locale: ptBR, addSuffix: true })}
          </span>
          <Button variant="ghost" size="sm" onClick={fetchData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Vendas Hoje */}
        <motion.div whileHover={{ scale: 1.02 }}>
          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border-green-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Vendas Hoje</p>
                  <p className="text-3xl font-bold text-green-500">{stats.vendasHoje}</p>
                  <p className="text-sm text-green-400">{formatCurrency(stats.receitaHoje)}</p>
                </div>
                <div className="h-14 w-14 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Zap className="h-7 w-7 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Vendas Mês */}
        <motion.div whileHover={{ scale: 1.02 }}>
          <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border-blue-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Vendas Mês</p>
                  <p className="text-3xl font-bold text-blue-500">{stats.vendasMes}</p>
                  <p className="text-sm text-blue-400">{formatCurrency(stats.receitaMes)}</p>
                </div>
                <div className="h-14 w-14 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <TrendingUp className="h-7 w-7 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Alunos Ativos */}
        <motion.div whileHover={{ scale: 1.02 }}>
          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/5 border-purple-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Alunos Ativos</p>
                  <p className="text-3xl font-bold text-purple-500">{stats.alunosAtivos}</p>
                  <p className="text-sm text-purple-400">+{stats.alunosNovosHoje} hoje</p>
                </div>
                <div className="h-14 w-14 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Users className="h-7 w-7 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Ticket Médio */}
        <motion.div whileHover={{ scale: 1.02 }}>
          <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ticket Médio</p>
                  <p className="text-3xl font-bold text-amber-500">
                    {formatCurrency(stats.ticketMedio)}
                  </p>
                </div>
                <div className="h-14 w-14 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <DollarSign className="h-7 w-7 text-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Duas colunas: Vendas Recentes + Eventos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimas Vendas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Últimas Vendas
              <Badge variant="outline" className="ml-auto">
                {recentSales.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-3">
                {recentSales.map((sale, index) => (
                  <motion.div
                    key={sale.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        ["approved", "purchase_approved"].includes(sale.status?.toLowerCase())
                          ? "bg-green-500/10"
                          : "bg-amber-500/10"
                      }`}>
                        {["approved", "purchase_approved"].includes(sale.status?.toLowerCase())
                          ? <CheckCircle className="h-5 w-5 text-green-500" />
                          : <Clock className="h-5 w-5 text-amber-500" />
                        }
                      </div>
                      <div>
                        <p className="font-medium text-sm">{sale.buyer_name || "Cliente"}</p>
                        <p className="text-xs text-muted-foreground">
                          {sale.product_name?.substring(0, 40)}...
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(sale.created_at), { locale: ptBR, addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-500">{formatCurrency(sale.valor_bruto || 0)}</p>
                      <Badge className={getStatusColor(sale.status)} variant="outline">
                        {sale.status === "approved" || sale.status === "purchase_approved" ? "Aprovado" : sale.status}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Eventos de Integração */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              Eventos em Tempo Real
              <div className="ml-auto flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-muted-foreground">Live</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {recentEvents.map((event, index) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className="p-3 rounded-lg bg-muted/20 border border-border/50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={event.processed ? "text-green-500 border-green-500/30" : "text-amber-500 border-amber-500/30"}
                        >
                          {event.processed ? "✓" : "⏳"}
                        </Badge>
                        <span className="text-sm font-medium">{event.event_type}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(event.created_at), { locale: ptBR, addSuffix: true })}
                      </span>
                    </div>
                    {event.payload?.email && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {event.payload.email} • {formatCurrency(event.payload.value || 0)}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default HotmartRealtimeDashboard;
