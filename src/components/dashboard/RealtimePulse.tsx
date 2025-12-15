// ============================================
// MOISÉS MEDEIROS v5.0 - REALTIME PULSE
// Dashboard em Tempo Real - Curso de Química
// Pilar: Data Intelligence & Live Updates
// ============================================

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Activity, 
  Zap, 
  TrendingUp, 
  DollarSign,
  Users,
  Radio,
  CheckCircle,
  Clock,
  AlertTriangle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Transaction {
  id: string;
  source: string;
  amount: number;
  status: string;
  customer_name: string;
  product_name: string;
  created_at: string;
}

interface DashboardStats {
  todayRevenue: number;
  todaySales: number;
  recentTransactions: Transaction[];
  isConnected: boolean;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

function formatTime(date: string): string {
  return new Date(date).toLocaleTimeString("pt-BR", { 
    hour: "2-digit", 
    minute: "2-digit" 
  });
}

export function RealtimePulse() {
  const [stats, setStats] = useState<DashboardStats>({
    todayRevenue: 0,
    todaySales: 0,
    recentTransactions: [],
    isConnected: true,
  });
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    fetchStats();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel("dashboard-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "synapse_transactions",
        },
        (payload) => {
          console.log("New transaction:", payload);
          setPulse(true);
          setTimeout(() => setPulse(false), 1000);
          fetchStats();
        }
      )
      .subscribe();

    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  const fetchStats = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      
      // Fetch today's metrics
      const { data: metrics } = await supabase
        .from("synapse_metrics")
        .select("*")
        .eq("reference_date", today);

      const revenue = metrics?.find(m => m.metric_name === "daily_revenue")?.metric_value || 0;
      const sales = metrics?.find(m => m.metric_name === "daily_sales_count")?.metric_value || 0;

      // Fetch recent transactions
      const { data: transactions } = await supabase
        .from("synapse_transactions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      setStats({
        todayRevenue: Number(revenue),
        todaySales: Number(sales),
        recentTransactions: (transactions as Transaction[]) || [],
        isConnected: true,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      setStats(prev => ({ ...prev, isConnected: false }));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-3 w-3 text-[hsl(var(--stats-green))]" />;
      case "pending":
        return <Clock className="h-3 w-3 text-[hsl(var(--stats-gold))]" />;
      default:
        return <AlertTriangle className="h-3 w-3 text-destructive" />;
    }
  };

  const getSourceColor = (source: string) => {
    const colors: Record<string, string> = {
      hotmart: "bg-orange-500/20 text-orange-400",
      asaas: "bg-blue-500/20 text-blue-400",
      make: "bg-purple-500/20 text-purple-400",
    };
    return colors[source] || "bg-secondary text-muted-foreground";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-6 relative overflow-hidden"
    >
      {/* Animated pulse background */}
      <AnimatePresence>
        {pulse && (
          <motion.div
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: 3, opacity: 0 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[hsl(var(--stats-green))] rounded-full pointer-events-none"
            style={{ transformOrigin: "center" }}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${stats.isConnected ? "bg-[hsl(var(--stats-green))]/10" : "bg-destructive/10"}`}>
            <Activity className={`h-5 w-5 ${stats.isConnected ? "text-[hsl(var(--stats-green))]" : "text-destructive"}`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              Vendas em Tempo Real
              <motion.span
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Radio className="h-4 w-4 text-[hsl(var(--stats-green))]" />
              </motion.span>
            </h3>
            <p className="text-xs text-muted-foreground">Tempo real • Webhooks ativos</p>
          </div>
        </div>
        <div className={`w-2 h-2 rounded-full ${stats.isConnected ? "bg-[hsl(var(--stats-green))] animate-pulse" : "bg-destructive"}`} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <motion.div
          className="p-4 rounded-xl bg-[hsl(var(--stats-green))]/5 border border-[hsl(var(--stats-green))]/20"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-[hsl(var(--stats-green))]" />
            <span className="text-xs text-muted-foreground">Receita Hoje</span>
          </div>
          <p className="text-xl font-bold text-[hsl(var(--stats-green))]">
            {formatCurrency(stats.todayRevenue)}
          </p>
        </motion.div>

        <motion.div
          className="p-4 rounded-xl bg-[hsl(var(--stats-blue))]/5 border border-[hsl(var(--stats-blue))]/20"
          whileHover={{ scale: 1.02 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-[hsl(var(--stats-blue))]" />
            <span className="text-xs text-muted-foreground">Vendas Hoje</span>
          </div>
          <p className="text-xl font-bold text-[hsl(var(--stats-blue))]">
            {stats.todaySales}
          </p>
        </motion.div>
      </div>

      {/* Recent Transactions */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Últimas Transações
        </p>
        
        {stats.recentTransactions.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Aguardando transações...</p>
            <p className="text-xs mt-1">Configure os webhooks para receber dados em tempo real</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {stats.recentTransactions.map((tx, index) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(tx.status)}
                  <div>
                    <p className="text-sm font-medium text-foreground line-clamp-1">
                      {tx.customer_name || tx.product_name || "Transação"}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${getSourceColor(tx.source)}`}>
                        {tx.source.toUpperCase()}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(tx.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${tx.status === "approved" ? "text-[hsl(var(--stats-green))]" : "text-muted-foreground"}`}>
                  {formatCurrency(tx.amount)}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}
