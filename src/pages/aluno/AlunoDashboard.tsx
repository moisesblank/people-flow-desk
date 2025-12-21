// ============================================
// CENTRAL DO ALUNO - DASHBOARD
// Química ENEM - Prof. Moisés Medeiros
// ============================================

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, PlayCircle, Trophy, Target, Calendar, 
  Clock, TrendingUp, Star, Zap, Brain, Award
} from "lucide-react";
import { motion } from "framer-motion";

interface StudyStats {
  horasEstudadas: number;
  aulasAssistidas: number;
  questoesResolvidas: number;
  acertos: number;
  pontuacaoSimulado: number;
  ranking: number;
  diasConsecutivos: number;
  xpTotal: number;
  nivel: number;
}

export default function AlunoDashboard() {
  const [stats, setStats] = useState<StudyStats>({
    horasEstudadas: 47,
    aulasAssistidas: 32,
    questoesResolvidas: 456,
    acertos: 78,
    pontuacaoSimulado: 720,
    ranking: 15,
    diasConsecutivos: 12,
    xpTotal: 4500,
    nivel: 8
  });

  const progressoGeral = 65;

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header de Boas-vindas */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 p-6 md:p-8 text-white"
      >
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                Olá, futuro(a) aprovado(a)! 🧪
              </h1>
              <p className="text-white/80">
                Continue assim! Você está no caminho certo para a aprovação.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold">{stats.diasConsecutivos}</div>
                <div className="text-xs text-white/70">dias seguidos</div>
              </div>
              <div className="h-12 w-px bg-white/20" />
              <div className="text-center">
                <div className="flex items-center gap-1 text-3xl font-bold">
                  <Zap className="w-6 h-6 text-yellow-400" />
                  {stats.xpTotal}
                </div>
                <div className="text-xs text-white/70">XP total</div>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">Progresso geral do curso</span>
              <span className="text-sm font-bold">{progressoGeral}%</span>
            </div>
            <Progress value={progressoGeral} className="h-3 bg-white/20" />
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Clock className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.horasEstudadas}h</p>
                  <p className="text-xs text-muted-foreground">Horas estudadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <PlayCircle className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.aulasAssistidas}</p>
                  <p className="text-xs text-muted-foreground">Aulas assistidas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/20">
                  <Brain className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.questoesResolvidas}</p>
                  <p className="text-xs text-muted-foreground">Questões feitas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border-amber-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20">
                  <Trophy className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">#{stats.ranking}</p>
                  <p className="text-xs text-muted-foreground">No ranking</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Próximas Aulas */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Próximas Aulas
            </CardTitle>
            <CardDescription>Continue de onde parou</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { titulo: "Estequiometria - Cálculos", modulo: "Química Geral", progresso: 75, duracao: "45 min" },
              { titulo: "Reações Redox", modulo: "Eletroquímica", progresso: 0, duracao: "52 min" },
              { titulo: "Funções Orgânicas", modulo: "Química Orgânica", progresso: 0, duracao: "38 min" },
            ].map((aula, index) => (
              <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                  <PlayCircle className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{aula.titulo}</h4>
                  <p className="text-sm text-muted-foreground">{aula.modulo}</p>
                  {aula.progresso > 0 && (
                    <Progress value={aula.progresso} className="h-1 mt-2" />
                  )}
                </div>
                <div className="text-right">
                  <Badge variant={aula.progresso > 0 ? "default" : "secondary"}>
                    {aula.progresso > 0 ? "Continuar" : "Iniciar"}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">{aula.duracao}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Conquistas Recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Conquistas
            </CardTitle>
            <CardDescription>Suas medalhas recentes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { nome: "Primeira Semana", icon: "🔥", desc: "7 dias seguidos" },
              { nome: "Mestre Estequio", icon: "⚗️", desc: "100% no módulo" },
              { nome: "Maratonista", icon: "🏃", desc: "5h em um dia" },
            ].map((conquista, index) => (
              <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-amber-500/10">
                <div className="text-2xl">{conquista.icon}</div>
                <div>
                  <p className="font-medium text-sm">{conquista.nome}</p>
                  <p className="text-xs text-muted-foreground">{conquista.desc}</p>
                </div>
              </div>
            ))}
            <Button variant="outline" className="w-full mt-2">
              Ver todas as conquistas
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Performance no Simulado */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Desempenho nos Simulados
          </CardTitle>
          <CardDescription>Sua evolução ao longo do tempo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-8 py-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-primary">{stats.pontuacaoSimulado}</div>
              <p className="text-sm text-muted-foreground">Última pontuação</p>
            </div>
            <div className="h-16 w-px bg-border" />
            <div className="text-center">
              <div className="text-5xl font-bold text-green-500">{stats.acertos}%</div>
              <p className="text-sm text-muted-foreground">Taxa de acertos</p>
            </div>
            <div className="h-16 w-px bg-border" />
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Star className="w-8 h-8 text-amber-500 fill-amber-500" />
                <span className="text-5xl font-bold">Nível {stats.nivel}</span>
              </div>
              <p className="text-sm text-muted-foreground">Seu nível atual</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
