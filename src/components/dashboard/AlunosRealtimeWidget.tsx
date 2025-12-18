// 👥 TRAMON v8 - Widget de Alunos em Tempo Real
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, UserPlus, TrendingUp, DollarSign,
  GraduationCap, RefreshCw, ExternalLink
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface AlunoStats {
  total: number;
  ativos: number;
  novosHoje: number;
  receitaTotal: number;
  ticketMedio: number;
}

export function AlunosRealtimeWidget() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AlunoStats>({
    total: 0,
    ativos: 0,
    novosHoje: 0,
    receitaTotal: 0,
    ticketMedio: 0,
  });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    fetchAlunoStats();
    
    // Realtime subscription
    const channel = supabase
      .channel('alunos-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'alunos' },
        () => fetchAlunoStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAlunoStats = async () => {
    try {
      // Total de alunos
      const { count: total } = await supabase
        .from('alunos')
        .select('*', { count: 'exact', head: true });

      // Alunos ativos
      const { count: ativos } = await supabase
        .from('alunos')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ativo');

      // Novos hoje
      const hoje = new Date().toISOString().split('T')[0];
      const { count: novosHoje } = await supabase
        .from('alunos')
        .select('*', { count: 'exact', head: true })
        .gte('data_matricula', hoje);

      // Receita total
      const { data: receitas } = await supabase
        .from('alunos')
        .select('valor_pago');

      const receitaTotal = receitas?.reduce((sum, a) => sum + (a.valor_pago || 0), 0) || 0;
      const ticketMedio = total && total > 0 ? receitaTotal / total : 0;

      setStats({
        total: total || 0,
        ativos: ativos || 0,
        novosHoje: novosHoje || 0,
        receitaTotal,
        ticketMedio,
      });

    } catch (error) {
      console.error('Error fetching aluno stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const sincronizarWordPress = async () => {
    setSyncing(true);
    try {
      const { error } = await supabase.functions.invoke('sync-wordpress-users');
      if (error) throw error;
      
      // Recarregar stats
      await fetchAlunoStats();
    } catch (error) {
      console.error('Error syncing WordPress:', error);
    } finally {
      setSyncing(false);
    }
  };

  const statCards = [
    {
      label: "Total de Alunos",
      value: stats.total,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Alunos Ativos",
      value: stats.ativos,
      icon: GraduationCap,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      label: "Novos Hoje",
      value: stats.novosHoje,
      icon: UserPlus,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      label: "Receita Total",
      value: `R$ ${stats.receitaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      isMonetary: true,
    },
  ];

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-background to-blue-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            Alunos em Tempo Real
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={sincronizarWordPress}
              disabled={syncing}
              className="text-xs h-7"
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${syncing ? 'animate-spin' : ''}`} />
              Sincronizar WP
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => navigate('/alunos')}
            >
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {statCards.map((stat, index) => {
                const Icon = stat.icon;
                
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-3 rounded-lg ${stat.bgColor} border border-border/30`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`w-4 h-4 ${stat.color}`} />
                      <span className="text-xs text-muted-foreground">{stat.label}</span>
                    </div>
                    <div className={`text-xl font-bold ${stat.isMonetary ? 'text-emerald-600' : ''}`}>
                      {stat.isMonetary ? stat.value : stat.value.toLocaleString('pt-BR')}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Ticket Médio */}
            <div className="p-3 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Ticket Médio</span>
                </div>
                <span className="text-lg font-bold text-primary">
                  R$ {stats.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Indicador de conversão */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Taxa de Retenção</span>
              <Badge variant="secondary" className="text-green-600">
                {stats.total > 0 ? Math.round((stats.ativos / stats.total) * 100) : 0}%
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
