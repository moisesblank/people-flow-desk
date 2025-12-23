// ============================================
// CENTRAL DO ALUNO - SIMULADOS ENEM
// Química ENEM - Prof. Moisés Medeiros
// ============================================

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, Clock, Target, Trophy, Play, 
  Calendar, BarChart2, CheckCircle2, Lock
} from "lucide-react";
import { motion } from "framer-motion";
import { useQuantumReactivity } from "@/hooks/useQuantumReactivity";

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

const simulados: Simulado[] = [
  { id: "1", titulo: "Simulado ENEM 2024 - Modelo 1", tipo: "completo", questoes: 45, duracao: "5h", dataLiberacao: "2024-01-15", realizado: true, nota: 780, bloqueado: false },
  { id: "2", titulo: "Simulado ENEM 2024 - Modelo 2", tipo: "completo", questoes: 45, duracao: "5h", dataLiberacao: "2024-02-01", realizado: true, nota: 820, bloqueado: false },
  { id: "3", titulo: "Química Geral - Intensivo", tipo: "parcial", questoes: 20, duracao: "2h", dataLiberacao: "2024-02-15", realizado: false, bloqueado: false },
  { id: "4", titulo: "Química Orgânica - Foco ENEM", tipo: "parcial", questoes: 15, duracao: "1h30", dataLiberacao: "2024-03-01", realizado: false, bloqueado: false },
  { id: "5", titulo: "Treino Rápido - Estequiometria", tipo: "rapido", questoes: 10, duracao: "30min", dataLiberacao: "2024-03-10", realizado: false, bloqueado: true },
];

const tipoConfig = {
  completo: { label: "Completo", color: "bg-primary" },
  parcial: { label: "Parcial", color: "bg-purple-500" },
  rapido: { label: "Rápido", color: "bg-green-500" },
};

export default function AlunoSimulados() {
  const { gpuAnimationProps } = useQuantumReactivity();

  const [tab, setTab] = useState("disponiveis");

  const estatisticas = {
    simuladosFeitos: 8,
    mediaNotas: 756,
    melhorNota: 820,
    ranking: 15,
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

        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <BarChart2 className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">#{estatisticas.ranking}</p>
              <p className="text-xs text-muted-foreground">No ranking</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="disponiveis">Disponíveis</TabsTrigger>
          <TabsTrigger value="realizados">Realizados</TabsTrigger>
          <TabsTrigger value="calendario">Calendário</TabsTrigger>
        </TabsList>

        <TabsContent value="disponiveis" className="space-y-4 mt-6">
          {simulados.filter(s => !s.realizado).map((simulado, index) => (
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
          ))}
        </TabsContent>

        <TabsContent value="realizados" className="space-y-4 mt-6">
          {simulados.filter(s => s.realizado).map((simulado, index) => (
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
          ))}
        </TabsContent>

        <TabsContent value="calendario" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Calendário de Simulados</CardTitle>
              <CardDescription>Próximos simulados programados</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Calendário de simulados será exibido aqui
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
