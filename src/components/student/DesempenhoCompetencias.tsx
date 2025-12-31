// ============================================
// DESEMPENHO COMPETÊNCIAS - SANTUÁRIO BETA v10
// Análise de desempenho por competências do ENEM
// Com visualização de radar e recomendações IA
// ============================================

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Target,
  Brain,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface Competencia {
  id: string;
  nome: string;
  sigla: string;
  acertos: number;
  total: number;
  tendencia: 'up' | 'down' | 'stable';
  color: string;
}

interface DesempenhoCompetenciasProps {
  className?: string;
}

export function DesempenhoCompetencias({ className }: DesempenhoCompetenciasProps) {
  const navigate = useNavigate();

  // Dados simulados - em produção, vir de hook real
  const competencias: Competencia[] = [
    { id: '1', nome: 'Linguagens', sigla: 'LC', acertos: 35, total: 45, tendencia: 'up', color: 'from-blue-500 to-cyan-500' },
    { id: '2', nome: 'Humanas', sigla: 'CH', acertos: 28, total: 45, tendencia: 'stable', color: 'from-purple-500 to-pink-500' },
    { id: '3', nome: 'Natureza', sigla: 'CN', acertos: 32, total: 45, tendencia: 'up', color: 'from-green-500 to-emerald-500' },
    { id: '4', nome: 'Matemática', sigla: 'MT', acertos: 25, total: 45, tendencia: 'down', color: 'from-amber-500 to-orange-500' },
    { id: '5', nome: 'Redação', sigla: 'RD', acertos: 720, total: 1000, tendencia: 'up', color: 'from-red-500 to-rose-500' },
  ];

  const sortedByPerformance = useMemo(() => {
    return [...competencias].sort((a, b) => {
      const percA = (a.acertos / a.total) * 100;
      const percB = (b.acertos / b.total) * 100;
      return percA - percB;
    });
  }, [competencias]);

  const weakestArea = sortedByPerformance[0];
  const strongestArea = sortedByPerformance[sortedByPerformance.length - 1];

  const getTendenciaIcon = (tendencia: Competencia['tendencia']) => {
    switch (tendencia) {
      case 'up': return TrendingUp;
      case 'down': return TrendingDown;
      case 'stable': return Minus;
    }
  };

  const getTendenciaColor = (tendencia: Competencia['tendencia']) => {
    switch (tendencia) {
      case 'up': return 'text-green-500';
      case 'down': return 'text-red-500';
      case 'stable': return 'text-muted-foreground';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Desempenho por Área
              </CardTitle>
              <CardDescription>
                Análise das 5 competências do ENEM
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/alunos/simulados')}>
              Simulados <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Competências */}
          {competencias.map((comp, index) => {
            const percentage = Math.round((comp.acertos / comp.total) * 100);
            const TendenciaIcon = getTendenciaIcon(comp.tendencia);
            
            return (
              <motion.div
                key={comp.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "h-8 w-8 rounded-lg bg-gradient-to-br flex items-center justify-center text-white text-xs font-bold",
                      comp.color
                    )}>
                      {comp.sigla}
                    </div>
                    <span className="font-medium text-sm">{comp.nome}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TendenciaIcon className={cn("h-4 w-4", getTendenciaColor(comp.tendencia))} />
                    <span className="font-bold text-sm">{percentage}%</span>
                  </div>
                </div>
                <Progress 
                  value={percentage} 
                  className={cn(
                    "h-2",
                    percentage < 60 && "[&>div]:bg-red-500",
                    percentage >= 60 && percentage < 75 && "[&>div]:bg-amber-500",
                    percentage >= 75 && "[&>div]:bg-green-500"
                  )}
                />
              </motion.div>
            );
          })}

          {/* Insights IA */}
          <div className="pt-4 border-t space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <Sparkles className="h-3 w-3" />
                Insights IA
              </Badge>
            </div>

            {/* Área Fraca */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Foco em {weakestArea.nome}</p>
                <p className="text-xs text-muted-foreground">
                  Seu ponto mais fraco ({Math.round((weakestArea.acertos / weakestArea.total) * 100)}%). 
                  Recomendo dedicar 30min extras por dia.
                </p>
              </div>
            </div>

            {/* Área Forte */}
            <div className="flex items-start gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">Excelente em {strongestArea.nome}!</p>
                <p className="text-xs text-muted-foreground">
                  Sua melhor área ({Math.round((strongestArea.acertos / strongestArea.total) * 100)}%). 
                  Continue assim e revise periodicamente.
                </p>
              </div>
            </div>

            {/* CTA */}
            <Button 
              className="w-full gap-2" 
              variant="outline"
              onClick={() => navigate('/alunos/questoes')}
            >
              <Brain className="h-4 w-4" />
              Praticar Áreas Fracas
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
