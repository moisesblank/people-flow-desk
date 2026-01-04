/**
 * 🎯 CENTRAL DO ALUNO — SIMULADOS
 * Constituição SYNAPSE Ω v10.0
 * 
 * Integração COMPLETA com SimuladoPlayer e dados reais.
 * Fase 4: Rotas/Integração
 */

import { useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, Clock, Target, Trophy, Play, 
  Calendar, CheckCircle2, Lock, FileText, Zap,
  Shield, Camera, AlertTriangle, Timer
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuantumReactivity } from "@/hooks/useQuantumReactivity";
import { LoadingState } from "@/components/LoadingState";
import { cn } from "@/lib/utils";
import { useSimuladosList, SimuladoListItem } from "@/hooks/simulados/useSimuladosList";
import { SimuladoPlayer } from "@/components/simulados";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { calculatePercentage } from "@/components/simulados/types";

export default function AlunoSimulados() {
  const { gpuAnimationProps } = useQuantumReactivity();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState("disponiveis");
  
  // Simulado ativo (do URL ou selecionado)
  const activeSimuladoId = searchParams.get("s");
  const [selectedSimuladoId, setSelectedSimuladoId] = useState<string | null>(activeSimuladoId);
  
  // Buscar simulados reais
  const { data: simuladosData, isLoading, refetch } = useSimuladosList();

  // Estatísticas calculadas
  const stats = {
    disponíveis: simuladosData?.available.length || 0,
    realizados: simuladosData?.completed.length || 0,
    emBreve: simuladosData?.upcoming.length || 0,
    total: (simuladosData?.available.length || 0) + 
           (simuladosData?.completed.length || 0) + 
           (simuladosData?.upcoming.length || 0),
  };

  // Handlers
  const handleSelectSimulado = useCallback((id: string) => {
    setSelectedSimuladoId(id);
    setSearchParams({ s: id });
  }, [setSearchParams]);

  const handleCloseSimulado = useCallback(() => {
    setSelectedSimuladoId(null);
    setSearchParams({});
    refetch(); // Atualizar lista após sair
  }, [setSearchParams, refetch]);

  const handleSimuladoComplete = useCallback(() => {
    // Refetch para atualizar estatísticas
    refetch();
  }, [refetch]);

  // Se há simulado ativo, mostrar player em fullscreen
  if (selectedSimuladoId) {
    return (
      <Dialog open={true} onOpenChange={(open) => !open && handleCloseSimulado()}>
        <DialogContent className="max-w-7xl w-full h-[95vh] p-0 overflow-hidden">
          <SimuladoPlayer
            simuladoId={selectedSimuladoId}
            onComplete={handleSimuladoComplete}
            onExit={handleCloseSimulado}
          />
        </DialogContent>
      </Dialog>
    );
  }

  if (isLoading) {
    return <LoadingState message="Carregando simulados..." />;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header com Stats */}
      <motion.div
        {...gpuAnimationProps.fadeUp}
        className="grid md:grid-cols-4 gap-4 will-change-transform transform-gpu"
      >
        <Card className="bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border-indigo-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/20">
              <FileText className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.disponíveis}</p>
              <p className="text-xs text-muted-foreground">Disponíveis</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.realizados}</p>
              <p className="text-xs text-muted-foreground">Realizados</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-yellow-500/10 border-amber-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20">
              <Calendar className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.emBreve}</p>
              <p className="text-xs text-muted-foreground">Em breve</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Trophy className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Banner XP */}
      <motion.div {...gpuAnimationProps.fadeUp}>
        <Card className="border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 to-violet-500/10">
          <CardContent className="py-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold">Ganhe XP e suba no ranking!</h3>
                <p className="text-sm text-muted-foreground">
                  Cada questão correta vale pontos. Apenas a primeira tentativa pontua.
                </p>
              </div>
              <Badge className="ml-auto bg-gradient-to-r from-indigo-500 to-violet-500 text-white border-0 px-4">
                +10 XP/questão
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="disponiveis" className="flex items-center gap-1">
            <Play className="h-3 w-3" />
            Disponíveis ({stats.disponíveis})
          </TabsTrigger>
          <TabsTrigger value="realizados" className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Realizados ({stats.realizados})
          </TabsTrigger>
          <TabsTrigger value="embreve" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Em Breve ({stats.emBreve})
          </TabsTrigger>
        </TabsList>

        {/* Simulados Disponíveis */}
        <TabsContent value="disponiveis" className="space-y-4 mt-6">
          {simuladosData?.available.length === 0 ? (
            <EmptyState 
              icon={FileText}
              title="Nenhum simulado disponível"
              description="Novos simulados serão liberados em breve!"
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {simuladosData?.available.map((simulado, index) => (
                <SimuladoCard
                  key={simulado.id}
                  simulado={simulado}
                  onStart={() => handleSelectSimulado(simulado.id)}
                  animationDelay={index * 0.05}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Simulados Realizados */}
        <TabsContent value="realizados" className="space-y-4 mt-6">
          {simuladosData?.completed.length === 0 ? (
            <EmptyState 
              icon={CheckCircle2}
              title="Nenhum simulado realizado"
              description="Complete seu primeiro simulado para ver aqui!"
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {simuladosData?.completed.map((simulado, index) => (
                <SimuladoCompletedCard
                  key={simulado.id}
                  simulado={simulado}
                  onReview={() => handleSelectSimulado(simulado.id)}
                  animationDelay={index * 0.05}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Simulados Em Breve */}
        <TabsContent value="embreve" className="space-y-4 mt-6">
          {simuladosData?.upcoming.length === 0 ? (
            <EmptyState 
              icon={Calendar}
              title="Nenhum simulado programado"
              description="Fique atento às novidades!"
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {simuladosData?.upcoming.map((simulado, index) => (
                <SimuladoUpcomingCard
                  key={simulado.id}
                  simulado={simulado}
                  animationDelay={index * 0.05}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================
// COMPONENTES AUXILIARES
// ============================================

interface SimuladoCardProps {
  simulado: SimuladoListItem;
  onStart: () => void;
  animationDelay?: number;
}

function SimuladoCard({ simulado, onStart, animationDelay = 0 }: SimuladoCardProps) {
  const hasRunningAttempt = simulado.user_attempt?.status === "RUNNING";
  const isRetake = simulado.user_attempt && !simulado.user_attempt.is_scored_for_ranking;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animationDelay }}
      className="will-change-transform transform-gpu"
    >
      <Card className={cn(
        "transition-all hover:shadow-lg hover:border-indigo-500/30",
        hasRunningAttempt && "border-amber-500/50"
      )}>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {simulado.is_hard_mode && (
                    <Badge className="bg-red-600 text-white">
                      <Shield className="w-3 h-3 mr-1" />
                      Hard Mode
                    </Badge>
                  )}
                  {simulado.requires_camera && (
                    <Badge variant="outline" className="border-amber-500 text-amber-500">
                      <Camera className="w-3 h-3 mr-1" />
                      Câmera
                    </Badge>
                  )}
                  {hasRunningAttempt && (
                    <Badge className="bg-amber-500 text-white">
                      <Timer className="w-3 h-3 mr-1" />
                      Em andamento
                    </Badge>
                  )}
                  {isRetake && (
                    <Badge variant="outline" className="border-muted-foreground">
                      Retake
                    </Badge>
                  )}
                </div>
                <h3 className="text-lg font-semibold">{simulado.title}</h3>
                {simulado.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {simulado.description}
                  </p>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <Target className="w-4 h-4" />
                {simulado.total_questions} questões
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {simulado.duration_minutes} min
              </span>
              <span className="flex items-center gap-1">
                <Trophy className="w-4 h-4" />
                +{simulado.total_questions * simulado.points_per_question} XP
              </span>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2">
              {simulado.ends_at && (
                <span className="text-xs text-muted-foreground">
                  Até {format(new Date(simulado.ends_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                </span>
              )}
              <Button 
                onClick={onStart}
                className="ml-auto bg-gradient-to-r from-indigo-500 to-violet-500"
              >
                <Play className="w-4 h-4 mr-2" />
                {hasRunningAttempt ? "Continuar" : "Iniciar"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface SimuladoCompletedCardProps {
  simulado: SimuladoListItem;
  onReview: () => void;
  animationDelay?: number;
}

function SimuladoCompletedCard({ simulado, onReview, animationDelay = 0 }: SimuladoCompletedCardProps) {
  const attempt = simulado.user_attempt;
  const percentage = attempt 
    ? calculatePercentage(attempt.correct_answers, simulado.total_questions) 
    : 0;
  const passed = percentage >= simulado.passing_score;
  const isGabaritoReleased = simulado.results_released_at 
    ? new Date() >= new Date(simulado.results_released_at)
    : true;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animationDelay }}
      className="will-change-transform transform-gpu"
    >
      <Card className={cn(
        "border-l-4",
        passed ? "border-l-green-500" : "border-l-amber-500"
      )}>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {passed ? (
                  <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Aprovado
                  </Badge>
                ) : (
                  <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Não atingiu meta
                  </Badge>
                )}
                {!attempt?.is_scored_for_ranking && (
                  <Badge variant="outline">Retake</Badge>
                )}
              </div>
              <h3 className="text-lg font-semibold">{simulado.title}</h3>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  {attempt?.correct_answers}/{simulado.total_questions} acertos
                </span>
                <span className="flex items-center gap-1">
                  <Trophy className="w-4 h-4" />
                  {attempt?.score || 0} XP
                </span>
              </div>
            </div>
            
            <div className="text-center shrink-0">
              <div className={cn(
                "text-4xl font-bold",
                passed ? "text-green-500" : "text-amber-500"
              )}>
                {percentage}%
              </div>
              <p className="text-sm text-muted-foreground">Acertos</p>
            </div>

            <Button 
              variant="outline" 
              onClick={onReview}
              disabled={!isGabaritoReleased}
            >
              {isGabaritoReleased ? "Ver Gabarito" : "Aguardando liberação"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface SimuladoUpcomingCardProps {
  simulado: SimuladoListItem;
  animationDelay?: number;
}

function SimuladoUpcomingCard({ simulado, animationDelay = 0 }: SimuladoUpcomingCardProps) {
  const startsAt = simulado.starts_at ? new Date(simulado.starts_at) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animationDelay }}
      className="will-change-transform transform-gpu"
    >
      <Card className="opacity-75">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">
                    <Lock className="w-3 h-3 mr-1" />
                    Em breve
                  </Badge>
                  {simulado.is_hard_mode && (
                    <Badge className="bg-red-600/50 text-white">
                      <Shield className="w-3 h-3 mr-1" />
                      Hard Mode
                    </Badge>
                  )}
                </div>
                <h3 className="text-lg font-semibold">{simulado.title}</h3>
                {simulado.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {simulado.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Target className="w-4 h-4" />
                {simulado.total_questions} questões
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {simulado.duration_minutes} min
              </span>
            </div>

            {startsAt && (
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>
                    Liberação: {format(startsAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </span>
                </div>
                <Button variant="outline" disabled>
                  Aguardar
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <Card className="text-center py-12">
      <CardContent>
        <Icon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
