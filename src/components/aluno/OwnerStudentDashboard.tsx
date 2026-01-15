// ============================================
// VISÃO DIVINA DO OWNER - SANTUÁRIO BETA v10.0
// Dashboard de Onisciência para o Arquiteto
// 🔒 DADOS 100% REAIS - ZERO MOCKS
// ============================================

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, Brain, TrendingUp, Award, Clock, Target, 
  Zap, Activity, Eye, AlertTriangle, ChevronRight,
  BarChart3, Sparkles, Atom, Crown, Flame, BookOpen,
  GraduationCap, Trophy, Star, ArrowUpRight, ArrowDownRight,
  Database
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useOptimizedAnimation, STAGGER_DISABLED } from "@/hooks/useOptimizedAnimation";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// 🎬 OPTIMIZED: Removed stagger animations per strategy
// Using static rendering for list items
const container = STAGGER_DISABLED.container;
const item = STAGGER_DISABLED.item;

// ============================================
// 🔒 HOOK DE DADOS REAIS DO OWNER
// ============================================
function useOwnerPlatformStats() {
  return useQuery({
    queryKey: ['owner-platform-stats'],
    queryFn: async () => {
      // Buscar contagem de alunos por status
      const { data: alunosData, error: alunosError } = await supabase
        .from('user_roles')
        .select('role, user_id', { count: 'exact' })
        .in('role', ['beta', 'aluno_gratuito', 'aluno_presencial', 'beta_expira']);

      if (alunosError) {
        console.error('[OWNER] Erro ao buscar alunos:', alunosError);
      }

      const totalAlunos = alunosData?.length || 0;

      // Buscar XP total distribuído
      const { data: gamificationData, error: gamError } = await supabase
        .from('user_gamification')
        .select('total_xp');

      if (gamError) {
        console.error('[OWNER] Erro ao buscar gamificação:', gamError);
      }

      const xpTotalDistribuido = gamificationData?.reduce((acc, g) => acc + (g.total_xp || 0), 0) || 0;

      // Buscar aulas assistidas (lesson_progress)
      const { count: aulasAssistidas } = await supabase
        .from('lesson_progress')
        .select('*', { count: 'exact', head: true })
        .eq('completed', true);

      // Buscar questões respondidas
      const { count: questoesRespondidas } = await supabase
        .from('question_attempts')
        .select('*', { count: 'exact', head: true });

      // Buscar acertos
      const { count: acertos } = await supabase
        .from('question_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('is_correct', true);

      const mediaAcertos = questoesRespondidas && questoesRespondidas > 0 
        ? Math.round((acertos || 0) / questoesRespondidas * 100) 
        : 0;

      // Buscar top alunos por XP
      const { data: topAlunos } = await supabase
        .from('user_gamification')
        .select(`
          user_id,
          total_xp,
          current_level,
          current_streak
        `)
        .order('total_xp', { ascending: false })
        .limit(5);

      // Buscar nomes dos top alunos
      const topAlunosComNomes = await Promise.all(
        (topAlunos || []).map(async (aluno) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('nome')
            .eq('id', aluno.user_id)
            .maybeSingle();
          
          return {
            ...aluno,
            nome: profile?.nome || 'Aluno',
          };
        })
      );

      return {
        totalAlunos,
        xpTotalDistribuido,
        aulasAssistidas: aulasAssistidas || 0,
        questoesRespondidas: questoesRespondidas || 0,
        mediaAcertos,
        topAlunos: topAlunosComNomes,
      };
    },
    staleTime: 60_000, // 1 minuto
    refetchOnWindowFocus: false,
  });
}

export function OwnerStudentDashboard() {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState("visao-geral");
  
  // 🔒 DADOS 100% REAIS
  const { data: stats, isLoading } = useOwnerPlatformStats();

  // Loading State
  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        <Skeleton className="h-48 w-full rounded-3xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Dados reais (ou zeros se não houver)
  const ownerStats = {
    totalAlunos: stats?.totalAlunos || 0,
    xpTotalDistribuido: stats?.xpTotalDistribuido || 0,
    aulasAssistidas: stats?.aulasAssistidas || 0,
    questoesRespondidas: stats?.questoesRespondidas || 0,
    mediaAcertos: stats?.mediaAcertos || 0,
  };

  const topAlunos = stats?.topAlunos || [];

  const metricsCards = [
    { 
      title: "Total de Alunos", 
      value: ownerStats.totalAlunos, 
      icon: Users, 
      color: "from-cyan-500 to-blue-600",
    },
    { 
      title: "XP Distribuído", 
      value: ownerStats.xpTotalDistribuido > 1000 
        ? `${(ownerStats.xpTotalDistribuido / 1000).toFixed(1)}K` 
        : ownerStats.xpTotalDistribuido, 
      icon: Zap, 
      color: "from-amber-500 to-yellow-600",
    },
    { 
      title: "Aulas Assistidas", 
      value: ownerStats.aulasAssistidas, 
      icon: BookOpen, 
      color: "from-purple-500 to-violet-600",
    },
    { 
      title: "Taxa de Acerto", 
      value: `${ownerStats.mediaAcertos}%`, 
      icon: Target, 
      color: "from-green-500 to-emerald-600",
    },
  ];

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header Hero - Visão Divina */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-6 md:p-8"
      >
        {/* 🎬 PERFORMANCE: Efeitos visuais estáticos (removido animate-pulse e animate-float) */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-cyan-400/15 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-pink-400/10 rounded-full blur-2xl" />
        </div>

        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Crown className="w-8 h-8 text-amber-400" />
                <Badge className="bg-white/20 text-white border-0 text-sm">
                  <Eye className="w-3 h-3 mr-1" />
                  VISÃO DIVINA • OWNER
                </Badge>
                <Badge className="bg-green-500/20 text-green-300 border-0 text-xs">
                  <Database className="w-3 h-3 mr-1" />
                  DADOS REAIS
                </Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                Santuário BETA - Central de Comando
              </h1>
              <p className="text-white/80 text-lg">
                Monitore {ownerStats.totalAlunos} alunos em tempo real
              </p>
            </div>

            <div className="flex items-center gap-4">
              <motion.div 
                className="text-center bg-white/10 rounded-2xl p-4 backdrop-blur-sm"
                whileHover={{ scale: 1.05 }}
              >
                <div className="flex items-center justify-center gap-1">
                  <GraduationCap className="w-6 h-6 text-cyan-300" />
                  <span className="text-3xl font-black text-white">{ownerStats.totalAlunos}</span>
                </div>
                <div className="text-xs text-white/70 font-medium">TOTAL ALUNOS</div>
              </motion.div>

              <motion.div 
                className="text-center bg-white/10 rounded-2xl p-4 backdrop-blur-sm"
                whileHover={{ scale: 1.05 }}
              >
                <div className="flex items-center justify-center gap-1">
                  <Zap className="w-6 h-6 text-yellow-400" />
                  <span className="text-3xl font-black text-white">
                    {ownerStats.xpTotalDistribuido > 1000000 
                      ? `${(ownerStats.xpTotalDistribuido / 1000000).toFixed(1)}M`
                      : ownerStats.xpTotalDistribuido > 1000
                        ? `${(ownerStats.xpTotalDistribuido / 1000).toFixed(0)}K`
                        : ownerStats.xpTotalDistribuido
                    }
                  </span>
                </div>
                <div className="text-xs text-white/70 font-medium">XP DISTRIBUÍDO</div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards Grid */}
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {metricsCards.map((metric, index) => (
          <motion.div key={index} variants={item}>
            <Card className={`border-0 bg-gradient-to-br ${metric.color.replace('from-', 'from-').replace('to-', 'to-')}/10 hover:shadow-lg transition-all duration-300 group cursor-pointer`}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-2xl bg-gradient-to-br ${metric.color} shadow-lg`}>
                    <metric.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-black text-foreground">{metric.value}</p>
                  <p className="text-sm text-muted-foreground font-medium">{metric.title}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Tabs de Navegação */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid grid-cols-3 lg:w-fit">
          <TabsTrigger value="visao-geral" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Visão Geral</span>
          </TabsTrigger>
          <TabsTrigger value="alunos" className="gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Alunos</span>
          </TabsTrigger>
          <TabsTrigger value="ia-insights" className="gap-2">
            <Brain className="w-4 h-4" />
            <span className="hidden sm:inline">IA Insights</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Visão Geral */}
        <TabsContent value="visao-geral" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Top Alunos - DADOS REAIS */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  Top Alunos por XP
                </CardTitle>
                <CardDescription>Os alunos mais dedicados (dados reais)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {topAlunos.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Nenhum aluno com XP ainda.</p>
                    <p className="text-sm">Os alunos aparecerão aqui conforme estudarem.</p>
                  </div>
                ) : (
                  topAlunos.map((aluno, index) => (
                    <motion.div 
                      key={aluno.user_id}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer group"
                      whileHover={{ x: 5 }}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                        index === 0 ? 'bg-gradient-to-br from-amber-400 to-yellow-500' :
                        index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400' :
                        index === 2 ? 'bg-gradient-to-br from-amber-600 to-orange-700' :
                        'bg-gradient-to-br from-slate-500 to-slate-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{aluno.nome}</p>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Zap className="w-3 h-3 text-yellow-500" />
                            {aluno.total_xp.toLocaleString()} XP
                          </span>
                          <span>Nível {aluno.current_level}</span>
                          <span className="flex items-center gap-1">
                            <Flame className="w-3 h-3 text-orange-500" />
                            {aluno.current_streak} dias
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </motion.div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Métricas de Aprendizado */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-500" />
                  Métricas Globais
                </CardTitle>
                <CardDescription>Performance da plataforma</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 rounded-2xl bg-blue-500/10">
                  <p className="text-3xl font-black text-blue-500">{ownerStats.aulasAssistidas.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Aulas Assistidas</p>
                </div>
                <div className="text-center p-4 rounded-2xl bg-green-500/10">
                  <p className="text-3xl font-black text-green-500">{ownerStats.questoesRespondidas.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Questões Respondidas</p>
                </div>
                <div className="text-center p-4 rounded-2xl bg-purple-500/10">
                  <p className="text-3xl font-black text-purple-500">{ownerStats.mediaAcertos}%</p>
                  <p className="text-sm text-muted-foreground">Média de Acertos</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab: Alunos */}
        <TabsContent value="alunos">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Alunos</CardTitle>
              <CardDescription>Acesse a gestão completa pela área administrativa</CardDescription>
            </CardHeader>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Para gestão completa de alunos, acesse:</p>
              <Button className="mt-4" variant="outline" onClick={() => navigate('/gestaofc/gestao-alunos')}>
                Ir para Gestão de Alunos
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: IA Insights */}
        <TabsContent value="ia-insights">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-500" />
                Insights de IA
              </CardTitle>
              <CardDescription>Análises preditivas e recomendações inteligentes</CardDescription>
            </CardHeader>
            <CardContent className="py-12 text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Atom className="w-10 h-10 text-white animate-spin-slow" />
              </div>
              <h3 className="text-xl font-bold mb-2">IA em Desenvolvimento</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                O módulo de insights inteligentes está sendo treinado para oferecer 
                previsões de churn, recomendações de conteúdo e otimizações automáticas.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
