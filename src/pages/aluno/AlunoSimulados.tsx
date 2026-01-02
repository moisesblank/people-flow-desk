// ============================================
// CENTRAL DO ALUNO - SIMULADOS ENEM
// Química ENEM - Prof. Moisés Medeiros
// Integrado com QUESTION_DOMAIN: SIMULADOS
// ============================================

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, Clock, Target, Trophy, Play, 
  Calendar, BarChart2, CheckCircle2, Lock, FileQuestion, Zap
} from "lucide-react";
import { motion } from "framer-motion";
import { useQuantumReactivity } from "@/hooks/useQuantumReactivity";
import { supabase } from "@/integrations/supabase/client";
import { LoadingState } from "@/components/LoadingState";
import { cn } from "@/lib/utils";

interface Simulado {
  id: string;
  titulo: string;
  tipo: "completo" | "parcial" | "rapido";
  questoes: number;
  duracao: string;
  dataLiberacao: string;
  realizado: boolean;
  nota?: number;
  bloqueado: boolean;
}

// Mock data para simulados estruturados (será substituído por dados reais do banco)
const simuladosMock: Simulado[] = [
  { id: "1", titulo: "Simulado ENEM 2024 - Modelo 1", tipo: "completo", questoes: 45, duracao: "5h", dataLiberacao: "2024-01-15", realizado: true, nota: 780, bloqueado: false },
  { id: "2", titulo: "Simulado ENEM 2024 - Modelo 2", tipo: "completo", questoes: 45, duracao: "5h", dataLiberacao: "2024-02-01", realizado: true, nota: 820, bloqueado: false },
];

const tipoConfig = {
  completo: { label: "Completo", color: "bg-primary" },
  parcial: { label: "Parcial", color: "bg-purple-500" },
  rapido: { label: "Rápido", color: "bg-green-500" },
};

export default function AlunoSimulados() {
  const { gpuAnimationProps } = useQuantumReactivity();
  const [tab, setTab] = useState("questoes");

  // QUESTION_DOMAIN: Buscar questões com tag SIMULADOS
  const { data: simuladosQuestions, isLoading: isLoadingQuestions } = useQuery({
    queryKey: ['aluno-questions', 'SIMULADOS'],
    queryFn: async () => {
      // ⚡ ESCALA 45K: Sem limite artificial para questões de simulado
      const { data, error } = await supabase
        .from('quiz_questions')
        .select('id, question_text, difficulty, banca, ano, macro, micro, points, tags, is_active')
        .contains('tags', ['SIMULADOS'])
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 0,
  });

  const estatisticas = {
    simuladosFeitos: 8,
    mediaNotas: 756,
    melhorNota: 820,
    questoesSimulado: simuladosQuestions?.length || 0,
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header com Stats */}
      <motion.div
        {...gpuAnimationProps.fadeUp}
        className="grid md:grid-cols-4 gap-4 will-change-transform transform-gpu"
      >
        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Brain className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{estatisticas.simuladosFeitos}</p>
              <p className="text-xs text-muted-foreground">Simulados feitos</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <Target className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{estatisticas.mediaNotas}</p>
              <p className="text-xs text-muted-foreground">Média TRI</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border-amber-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <Trophy className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{estatisticas.melhorNota}</p>
              <p className="text-xs text-muted-foreground">Melhor nota</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/20">
              <FileQuestion className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{estatisticas.questoesSimulado}</p>
              <p className="text-xs text-muted-foreground">Questões Simulado</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="questoes" className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            Questões
          </TabsTrigger>
          <TabsTrigger value="disponiveis">Simulados</TabsTrigger>
          <TabsTrigger value="realizados">Realizados</TabsTrigger>
        </TabsList>

        {/* QUESTION_DOMAIN: Questões SIMULADOS */}
        <TabsContent value="questoes" className="space-y-4 mt-6">
          <Card className="border-red-500/30 bg-gradient-to-r from-red-500/5 to-transparent">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Badge className="bg-red-600 text-white">SIMULADOS</Badge>
                Questões para Simulado
                <Badge className="bg-amber-500 text-white ml-auto">
                  <Trophy className="h-3 w-3 mr-1" />
                  10 pts cada
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingQuestions ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingState />
                </div>
              ) : simuladosQuestions && simuladosQuestions.length > 0 ? (
                <div className="grid gap-3 max-h-[500px] overflow-y-auto pr-2">
                  {simuladosQuestions.map((q: any, i: number) => (
                    <motion.div 
                      key={q.id}
                      {...gpuAnimationProps.fadeUp}
                      transition={{ ...(gpuAnimationProps.fadeUp.transition ?? {}), delay: i * 0.05 }}
                      className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors will-change-transform transform-gpu"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm line-clamp-2 mb-2">{q.question_text?.substring(0, 180)}...</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={cn(
                              "text-xs",
                              q.difficulty === 'facil' && 'bg-green-500',
                              q.difficulty === 'medio' && 'bg-yellow-500',
                              q.difficulty === 'dificil' && 'bg-red-500',
                            )}>
                              {q.difficulty === 'facil' ? 'Fácil' : q.difficulty === 'medio' ? 'Médio' : 'Difícil'}
                            </Badge>
                            {q.banca && <Badge variant="outline" className="text-xs">{q.banca}</Badge>}
                            {q.ano && <Badge variant="secondary" className="text-xs">{q.ano}</Badge>}
                            {q.macro && <Badge variant="outline" className="text-xs">{q.macro}</Badge>}
                          </div>
                        </div>
                        <Button size="sm" className="shrink-0">
                          <Play className="h-3 w-3 mr-1" />
                          Resolver
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileQuestion className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma questão de simulado disponível ainda.</p>
                  <p className="text-sm mt-1">Em breve novas questões serão adicionadas!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="disponiveis" className="space-y-4 mt-6">
          {simuladosMock.filter(s => !s.realizado).length > 0 ? (
            simuladosMock.filter(s => !s.realizado).map((simulado, index) => (
              <motion.div
                key={simulado.id}
                {...gpuAnimationProps.fadeUp}
                transition={{ ...(gpuAnimationProps.fadeUp.transition ?? {}), delay: index * 0.1 }}
                className="will-change-transform transform-gpu"
              >
                <Card className={`transition-all hover:shadow-lg ${simulado.bloqueado ? "opacity-60" : ""}`}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={tipoConfig[simulado.tipo].color}>
                            {tipoConfig[simulado.tipo].label}
                          </Badge>
                          {simulado.bloqueado && (
                            <Badge variant="secondary">
                              <Lock className="w-3 h-3 mr-1" />
                              Bloqueado
                            </Badge>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold">{simulado.titulo}</h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Brain className="w-4 h-4" />
                            {simulado.questoes} questões
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {simulado.duracao}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(simulado.dataLiberacao).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                      </div>
                      <Button size="lg" disabled={simulado.bloqueado}>
                        <Play className="w-4 h-4 mr-2" />
                        {simulado.bloqueado ? "Em breve" : "Iniciar Simulado"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <Card className="text-center py-8">
              <CardContent>
                <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Nenhum simulado disponível no momento.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="realizados" className="space-y-4 mt-6">
          {simuladosMock.filter(s => s.realizado).length > 0 ? (
            simuladosMock.filter(s => s.realizado).map((simulado, index) => (
              <motion.div
                key={simulado.id}
                {...gpuAnimationProps.fadeUp}
                transition={{ ...(gpuAnimationProps.fadeUp.transition ?? {}), delay: index * 0.1 }}
                className="will-change-transform transform-gpu"
              >
                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={tipoConfig[simulado.tipo].color}>
                            {tipoConfig[simulado.tipo].label}
                          </Badge>
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Concluído
                          </Badge>
                        </div>
                        <h3 className="text-lg font-semibold">{simulado.titulo}</h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Brain className="w-4 h-4" />
                            {simulado.questoes} questões
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {simulado.duracao}
                          </span>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-4xl font-bold text-primary">{simulado.nota}</div>
                        <p className="text-sm text-muted-foreground">Pontuação TRI</p>
                      </div>
                      <Button variant="outline">
                        Ver Gabarito
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            <Card className="text-center py-8">
              <CardContent>
                <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Você ainda não completou nenhum simulado.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
