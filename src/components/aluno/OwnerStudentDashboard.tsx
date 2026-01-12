// ============================================
// VISÃO DIVINA DO OWNER - SANTUÁRIO BETA v9.0
// Dashboard de Onisciência para o Arquiteto
// Métricas, Alunos, IA e Controle Total
// ============================================

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, Brain, TrendingUp, Award, Clock, Target, 
  Zap, Activity, Eye, AlertTriangle, ChevronRight,
  BarChart3, Sparkles, Atom, Crown, Flame, BookOpen,
  GraduationCap, Trophy, Star, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useOptimizedAnimation, STAGGER_DISABLED } from "@/hooks/useOptimizedAnimation";

// 🎬 OPTIMIZED: Removed stagger animations per strategy
// Using static rendering for list items
const container = STAGGER_DISABLED.container;
const item = STAGGER_DISABLED.item;

// Mock data - será substituído por dados reais do Supabase
const ownerStats = {
  totalAlunos: 847,
  alunosAtivos: 789,
  alunosEmRisco: 23,
  taxaRetencao: 93.2,
  mediaEngajamento: 78.5,
  aulasAssistidas: 15420,
  questoesRespondidas: 89340,
  mediaAcertos: 72.4,
  xpTotalDistribuido: 2450000,
  ticketMedio: 297.00,
  receitaMes: 42580.00,
  churnMes: 2.1,
};

const alunosDestaque = [
  { nome: "Maria Silva", xp: 12500, nivel: 15, streak: 45, status: "🔥 On Fire" },
  { nome: "João Santos", xp: 11200, nivel: 14, streak: 38, status: "⭐ Rising Star" },
  { nome: "Ana Oliveira", xp: 10800, nivel: 13, streak: 32, status: "🚀 Momentum" },
  { nome: "Pedro Costa", xp: 9500, nivel: 12, streak: 28, status: "💪 Dedicado" },
];

const alunosRisco = [
  { nome: "Lucas Ferreira", diasInativo: 7, ultimoAcesso: "14/06", risco: "alto" },
  { nome: "Julia Martins", diasInativo: 5, ultimoAcesso: "16/06", risco: "medio" },
  { nome: "Carlos Lima", diasInativo: 4, ultimoAcesso: "17/06", risco: "medio" },
];

const metricsCards = [
  { 
    title: "Alunos Ativos", 
    value: ownerStats.alunosAtivos, 
    total: ownerStats.totalAlunos,
    icon: Users, 
    color: "from-cyan-500 to-blue-600",
    trend: "+12%",
    trendUp: true
  },
  { 
    title: "Taxa de Retenção", 
    value: `${ownerStats.taxaRetencao}%`, 
    icon: Target, 
    color: "from-green-500 to-emerald-600",
    trend: "+2.3%",
    trendUp: true
  },
  { 
    title: "Engajamento Médio", 
    value: `${ownerStats.mediaEngajamento}%`, 
    icon: Activity, 
    color: "from-purple-500 to-violet-600",
    trend: "+5.1%",
    trendUp: true
  },
  { 
    title: "Alunos em Risco", 
    value: ownerStats.alunosEmRisco, 
    icon: AlertTriangle, 
    color: "from-amber-500 to-orange-600",
    trend: "-8%",
    trendUp: false,
    alert: true
  },
];

export function OwnerStudentDashboard() {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState("visao-geral");

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header Hero - Visão Divina */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-6 md:p-8"
      >
        {/* Efeitos visuais */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-cyan-400/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/3 w-32 h-32 bg-pink-400/10 rounded-full blur-2xl animate-float" />
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
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                Santuário BETA - Central de Comando
              </h1>
              <p className="text-white/80 text-lg">
                Monitore, analise e otimize a jornada de {ownerStats.totalAlunos} alunos em tempo real
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
                  <span className="text-3xl font-black text-white">{(ownerStats.xpTotalDistribuido / 1000000).toFixed(1)}M</span>
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
                  <div className={`flex items-center gap-1 text-sm font-medium ${metric.trendUp ? 'text-green-500' : 'text-amber-500'}`}>
                    {metric.trendUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                    {metric.trend}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-3xl font-black text-foreground">{metric.value}</p>
                  <p className="text-sm text-muted-foreground font-medium">{metric.title}</p>
                  {metric.total && (
                    <Progress value={(Number(String(metric.value).replace(/\D/g, '')) / metric.total) * 100} className="h-1.5 mt-2" />
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Tabs de Navegação */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 lg:w-fit">
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
          <TabsTrigger value="financeiro" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Financeiro</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab: Visão Geral */}
        <TabsContent value="visao-geral" className="space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Top Alunos */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  Top Alunos do Mês
                </CardTitle>
                <CardDescription>Os discípulos mais dedicados</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {alunosDestaque.map((aluno, index) => (
                  <motion.div 
                    key={index}
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
                          {aluno.xp.toLocaleString()} XP
                        </span>
                        <span>Nível {aluno.nivel}</span>
                        <span className="flex items-center gap-1">
                          <Flame className="w-3 h-3 text-orange-500" />
                          {aluno.streak} dias
                        </span>
                      </div>
                    </div>
                    <Badge variant="secondary">{aluno.status}</Badge>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* Alunos em Risco */}
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-600">
                  <AlertTriangle className="w-5 h-5" />
                  Alunos em Risco
                </CardTitle>
                <CardDescription>Requerem atenção imediata</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {alunosRisco.map((aluno, index) => (
                  <motion.div 
                    key={index}
                    className="p-4 rounded-2xl bg-background border border-amber-500/20 space-y-2"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{aluno.nome}</p>
                      <Badge variant={aluno.risco === 'alto' ? 'destructive' : 'outline'} className="text-xs">
                        {aluno.risco === 'alto' ? '🔴 Alto' : '🟡 Médio'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{aluno.diasInativo} dias inativo</span>
                      <span>Último: {aluno.ultimoAcesso}</span>
                    </div>
                    <Button size="sm" className="w-full mt-2" variant="outline">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Enviar Reengajamento
                    </Button>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Métricas de Aprendizado */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-500" />
                Métricas de Aprendizado
              </CardTitle>
              <CardDescription>Performance geral da plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center p-4 rounded-2xl bg-blue-500/10">
                  <p className="text-4xl font-black text-blue-500">{ownerStats.aulasAssistidas.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Aulas Assistidas</p>
                </div>
                <div className="text-center p-4 rounded-2xl bg-green-500/10">
                  <p className="text-4xl font-black text-green-500">{ownerStats.questoesRespondidas.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Questões Respondidas</p>
                </div>
                <div className="text-center p-4 rounded-2xl bg-purple-500/10">
                  <p className="text-4xl font-black text-purple-500">{ownerStats.mediaAcertos}%</p>
                  <p className="text-sm text-muted-foreground">Média de Acertos</p>
                </div>
                <div className="text-center p-4 rounded-2xl bg-amber-500/10">
                  <p className="text-4xl font-black text-amber-500">{(ownerStats.xpTotalDistribuido / 1000).toLocaleString()}K</p>
                  <p className="text-sm text-muted-foreground">XP Total Distribuído</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Alunos */}
        <TabsContent value="alunos">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Alunos</CardTitle>
              <CardDescription>Lista completa e filtros avançados em breve</CardDescription>
            </CardHeader>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Módulo de gestão de alunos será expandido nas próximas versões</p>
              <Button className="mt-4" variant="outline" onClick={() => navigate('/alunos-gestao')}>
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

        {/* Tab: Financeiro */}
        <TabsContent value="financeiro">
          <div className="grid lg:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-green-500/20">
                    <TrendingUp className="w-6 h-6 text-green-500" />
                  </div>
                  <span className="text-sm text-muted-foreground">Receita do Mês</span>
                </div>
                <p className="text-4xl font-black text-green-500">
                  R$ {ownerStats.receitaMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-blue-500/20">
                    <Star className="w-6 h-6 text-blue-500" />
                  </div>
                  <span className="text-sm text-muted-foreground">Ticket Médio</span>
                </div>
                <p className="text-4xl font-black text-blue-500">
                  R$ {ownerStats.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-500/10 to-orange-500/5">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-amber-500/20">
                    <AlertTriangle className="w-6 h-6 text-amber-500" />
                  </div>
                  <span className="text-sm text-muted-foreground">Churn Rate</span>
                </div>
                <p className="text-4xl font-black text-amber-500">
                  {ownerStats.churnMes}%
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
