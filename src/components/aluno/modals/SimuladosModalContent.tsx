/**
 * 🎯 SIMULADOS MODAL CONTENT
 * Constituição SYNAPSE Ω v10.0
 * 
 * Modal de simulados para /alunos/planejamento
 * Integrado com dados reais.
 */

import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Play, 
  Clock, 
  Target, 
  Trophy, 
  Zap, 
  Medal,
  Lock,
  Shield,
  Camera,
  Loader2,
  CheckCircle2,
  Calendar
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useSimuladosList } from "@/hooks/simulados/useSimuladosList";
import { calculatePercentage } from "@/components/simulados/types";

export const SimuladosModalContent = memo(function SimuladosModalContent() {
  const navigate = useNavigate();
  const { data: simuladosData, isLoading } = useSimuladosList();

  // Estatísticas agregadas
  const stats = {
    disponíveis: simuladosData?.available.length || 0,
    realizados: simuladosData?.completed.length || 0,
    totalXp: simuladosData?.completed.reduce((acc, s) => acc + (s.user_attempt?.score || 0), 0) || 0,
    melhorPercentual: Math.max(
      ...((simuladosData?.completed || []).map(s => 
        s.user_attempt ? calculatePercentage(s.user_attempt.correct_answers, s.total_questions) : 0
      )),
      0
    ),
  };

  const handleStartSimulado = (simuladoId: string) => {
    navigate(`/alunos/simulados?s=${simuladoId}`);
  };

  const handleGoToSimulados = () => {
    navigate("/alunos/simulados");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com ranking */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-indigo-500/20 bg-indigo-500/5">
          <CardContent className="pt-4 text-center">
            <Trophy className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.disponíveis}</div>
            <div className="text-xs text-muted-foreground">Disponíveis</div>
          </CardContent>
        </Card>
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="pt-4 text-center">
            <Zap className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.totalXp}</div>
            <div className="text-xs text-muted-foreground">XP Total</div>
          </CardContent>
        </Card>
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="pt-4 text-center">
            <Medal className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.melhorPercentual}%</div>
            <div className="text-xs text-muted-foreground">Melhor Nota</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Info XP */}
      <Card className="border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 to-violet-500/10">
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold">Ganhe XP e suba no ranking!</h3>
              <p className="text-sm text-muted-foreground">
                Cada simulado vale pontos que contam para sua posição
              </p>
            </div>
            <Badge className="ml-auto bg-gradient-to-r from-indigo-500 to-violet-500 text-white border-0 px-4">
              +10 XP/questão
            </Badge>
          </div>
        </CardContent>
      </Card>
      
      {/* Lista de simulados */}
      <div>
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Simulados Disponíveis
        </h3>
        
        {simuladosData?.available.length === 0 ? (
          <Card className="text-center py-8">
            <CardContent>
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Nenhum simulado disponível no momento.</p>
              <p className="text-sm text-muted-foreground mt-1">Novos simulados serão liberados em breve!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {simuladosData?.available.slice(0, 5).map((simulado) => {
              const hasRunning = simulado.user_attempt?.status === "RUNNING";
              
              return (
                <Card 
                  key={simulado.id}
                  className={cn(
                    "transition-all hover:border-indigo-500/30 cursor-pointer",
                    hasRunning && "border-amber-500/50"
                  )}
                  onClick={() => handleStartSimulado(simulado.id)}
                >
                  <CardContent className="py-4">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "p-3 rounded-xl shrink-0",
                        simulado.is_hard_mode 
                          ? "bg-gradient-to-br from-red-500 to-orange-500"
                          : "bg-gradient-to-br from-indigo-500 to-violet-500"
                      )}>
                        {simulado.is_hard_mode ? (
                          <Shield className="w-5 h-5 text-white" />
                        ) : (
                          <FileText className="w-5 h-5 text-white" />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{simulado.title}</h4>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            {simulado.total_questions} questões
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {simulado.duration_minutes} min
                          </span>
                          {simulado.is_hard_mode && (
                            <Badge variant="outline" className="text-[10px] border-red-500/50 text-red-500">
                              Hard Mode
                            </Badge>
                          )}
                          {simulado.requires_camera && (
                            <Badge variant="outline" className="text-[10px]">
                              <Camera className="w-2 h-2 mr-1" />
                              Câmera
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black border-0 mb-2">
                          <Zap className="w-3 h-3 mr-1" />
                          +{simulado.total_questions * simulado.points_per_question} XP
                        </Badge>
                        <Button 
                          size="sm" 
                          className={cn(
                            "w-full",
                            hasRunning 
                              ? "bg-amber-500 hover:bg-amber-600" 
                              : "bg-gradient-to-r from-indigo-500 to-violet-500"
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartSimulado(simulado.id);
                          }}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          {hasRunning ? "Continuar" : "Iniciar"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Simulados Realizados (preview) */}
      {simuladosData?.completed && simuladosData.completed.length > 0 && (
        <div>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            Últimos Realizados
          </h3>
          
          <div className="space-y-2">
            {simuladosData.completed.slice(0, 3).map((simulado) => {
              const percentage = simulado.user_attempt 
                ? calculatePercentage(simulado.user_attempt.correct_answers, simulado.total_questions)
                : 0;
              const passed = percentage >= simulado.passing_score;
              
              return (
                <Card 
                  key={simulado.id}
                  className={cn(
                    "cursor-pointer hover:bg-muted/50",
                    passed ? "border-l-4 border-l-green-500" : "border-l-4 border-l-amber-500"
                  )}
                  onClick={() => handleStartSimulado(simulado.id)}
                >
                  <CardContent className="py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-sm">{simulado.title}</h4>
                        <p className="text-xs text-muted-foreground">
                          {simulado.user_attempt?.correct_answers}/{simulado.total_questions} acertos
                        </p>
                      </div>
                      <Badge className={cn(
                        passed ? "bg-green-500" : "bg-amber-500",
                        "text-white"
                      )}>
                        {percentage}%
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Próximos (preview) */}
      {simuladosData?.upcoming && simuladosData.upcoming.length > 0 && (
        <div>
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-500" />
            Em Breve
          </h3>
          
          <div className="space-y-2">
            {simuladosData.upcoming.slice(0, 2).map((simulado) => (
              <Card key={simulado.id} className="opacity-75">
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Lock className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium text-sm">{simulado.title}</h4>
                        {simulado.starts_at && (
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(simulado.starts_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary">Aguardar</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Ver todos */}
      <Button 
        variant="outline" 
        className="w-full"
        onClick={handleGoToSimulados}
      >
        Ver todos os simulados
      </Button>
    </div>
  );
});

export default SimuladosModalContent;
