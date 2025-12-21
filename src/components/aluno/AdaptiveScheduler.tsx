// ============================================
// CRONOGRAMA ADAPTATIVO - SANTUÁRIO v9.1
// Se adapta ao desempenho e tempo disponível
// Baseado em neurociência do aprendizado
// ============================================

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { 
  Calendar, Clock, Brain, Target, Zap, 
  CheckCircle2, AlertTriangle, TrendingUp,
  Sparkles, Play, BookOpen, RotateCcw,
  ChevronRight, Timer, Flame
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StudyBlock {
  id: string;
  tipo: 'aula' | 'revisao' | 'questoes' | 'flashcard' | 'pausa';
  titulo: string;
  area?: string;
  duracao: number; // minutos
  prioridade: 'critica' | 'alta' | 'media' | 'baixa';
  xpEstimado: number;
  concluido: boolean;
  motivo?: string; // Por que essa atividade foi escolhida
}

interface AreaPerformance {
  areaId: string;
  areaName: string;
  accuracy: number; // 0-100
  lastStudied: Date;
  pendingReviews: number;
  weight: number; // Peso no ENEM
}

interface AdaptiveSchedulerProps {
  availableMinutes?: number;
  areaPerformances?: AreaPerformance[];
  onStartBlock?: (block: StudyBlock) => void;
}

// Algoritmo de priorização baseado em:
// 1. Curva de esquecimento (quando foi estudado por último)
// 2. Taxa de acerto (áreas fracas primeiro)
// 3. Peso no ENEM
// 4. Revisões pendentes
function calculatePriority(area: AreaPerformance): number {
  const daysSinceStudy = Math.floor((Date.now() - area.lastStudied.getTime()) / (1000 * 60 * 60 * 24));
  
  // Fator de esquecimento (exponencial)
  const forgettingFactor = Math.min(10, Math.pow(1.5, daysSinceStudy / 3));
  
  // Fator de dificuldade (inversamente proporcional à accuracy)
  const difficultyFactor = (100 - area.accuracy) / 20;
  
  // Fator de peso no ENEM
  const weightFactor = area.weight * 2;
  
  // Fator de revisões pendentes
  const reviewFactor = Math.min(5, area.pendingReviews);
  
  return forgettingFactor + difficultyFactor + weightFactor + reviewFactor;
}

// Gerar cronograma otimizado
function generateSchedule(
  minutes: number, 
  areas: AreaPerformance[],
  includeBreaks: boolean = true
): StudyBlock[] {
  const blocks: StudyBlock[] = [];
  let remainingTime = minutes;
  
  // Ordenar áreas por prioridade
  const sortedAreas = [...areas].sort((a, b) => calculatePriority(b) - calculatePriority(a));
  
  // Começar com revisão de erros (sempre prioridade máxima)
  const totalPendingReviews = areas.reduce((sum, a) => sum + a.pendingReviews, 0);
  if (totalPendingReviews > 0 && remainingTime >= 15) {
    blocks.push({
      id: 'revisao-erros',
      tipo: 'revisao',
      titulo: 'Revisão de Erros',
      duracao: Math.min(20, remainingTime * 0.2),
      prioridade: 'critica',
      xpEstimado: totalPendingReviews * 15,
      concluido: false,
      motivo: `${totalPendingReviews} questões erradas aguardando. Revisão de erros é 3x mais eficiente!`
    });
    remainingTime -= blocks[blocks.length - 1].duracao;
  }

  // Distribuir tempo restante entre áreas prioritárias
  let blockIndex = 0;
  for (const area of sortedAreas.slice(0, 3)) {
    if (remainingTime < 15) break;
    
    // Determinar tipo de atividade baseado na performance
    let tipo: StudyBlock['tipo'];
    let titulo: string;
    let motivo: string;
    
    if (area.accuracy < 60) {
      tipo = 'aula';
      titulo = `Revisão: ${area.areaName}`;
      motivo = `Taxa de acerto em ${area.accuracy}%. Precisa reforçar os conceitos base.`;
    } else if (area.pendingReviews > 0) {
      tipo = 'flashcard';
      titulo = `Flashcards: ${area.areaName}`;
      motivo = `${area.pendingReviews} cards para revisar. Memória de longo prazo!`;
    } else {
      tipo = 'questoes';
      titulo = `Questões: ${area.areaName}`;
      motivo = `Área dominada (${area.accuracy}%). Hora de praticar!`;
    }
    
    const blockDuration = Math.min(45, remainingTime * 0.35);
    
    blocks.push({
      id: `block-${blockIndex++}`,
      tipo,
      titulo,
      area: area.areaName,
      duracao: blockDuration,
      prioridade: area.accuracy < 50 ? 'critica' : area.accuracy < 70 ? 'alta' : 'media',
      xpEstimado: Math.round(blockDuration * 2.5),
      concluido: false,
      motivo
    });
    remainingTime -= blockDuration;
    
    // Pausa a cada 45min (técnica Pomodoro adaptada)
    if (includeBreaks && blocks.filter(b => b.tipo !== 'pausa').length % 2 === 0 && remainingTime >= 10) {
      blocks.push({
        id: `pausa-${blockIndex++}`,
        tipo: 'pausa',
        titulo: 'Pausa Estratégica',
        duracao: 5,
        prioridade: 'media',
        xpEstimado: 0,
        concluido: false,
        motivo: 'Descanso consolida a memória. Levante, alongue, beba água!'
      });
      remainingTime -= 5;
    }
  }
  
  return blocks;
}

export function AdaptiveScheduler({ 
  availableMinutes = 60, 
  areaPerformances,
  onStartBlock 
}: AdaptiveSchedulerProps) {
  const [selectedMinutes, setSelectedMinutes] = useState(availableMinutes);
  const [showSchedule, setShowSchedule] = useState(false);
  
  // Mock de dados de performance (será conectado ao backend)
  const mockPerformances: AreaPerformance[] = areaPerformances || [
    { areaId: '1', areaName: 'Estequiometria', accuracy: 45, lastStudied: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), pendingReviews: 5, weight: 0.15 },
    { areaId: '2', areaName: 'Química Orgânica', accuracy: 72, lastStudied: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), pendingReviews: 2, weight: 0.20 },
    { areaId: '3', areaName: 'Eletroquímica', accuracy: 58, lastStudied: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), pendingReviews: 3, weight: 0.12 },
    { areaId: '4', areaName: 'Termoquímica', accuracy: 85, lastStudied: new Date(), pendingReviews: 0, weight: 0.10 },
    { areaId: '5', areaName: 'Cinética', accuracy: 65, lastStudied: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), pendingReviews: 1, weight: 0.08 },
  ];

  const schedule = useMemo(() => 
    generateSchedule(selectedMinutes, mockPerformances),
    [selectedMinutes, mockPerformances]
  );

  const totalXP = schedule.reduce((sum, b) => sum + b.xpEstimado, 0);
  const studyTime = schedule.filter(b => b.tipo !== 'pausa').reduce((sum, b) => sum + b.duracao, 0);

  const getBlockIcon = (tipo: StudyBlock['tipo']) => {
    switch (tipo) {
      case 'aula': return Play;
      case 'revisao': return RotateCcw;
      case 'questoes': return Target;
      case 'flashcard': return Brain;
      case 'pausa': return Timer;
      default: return BookOpen;
    }
  };

  const getBlockColor = (prioridade: StudyBlock['prioridade']) => {
    switch (prioridade) {
      case 'critica': return 'from-red-500 to-orange-500';
      case 'alta': return 'from-amber-500 to-yellow-500';
      case 'media': return 'from-blue-500 to-cyan-500';
      case 'baixa': return 'from-green-500 to-emerald-500';
    }
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-purple-600">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          Cronograma Adaptativo
          <Badge variant="outline" className="ml-2">
            <Sparkles className="w-3 h-3 mr-1" />
            IA
          </Badge>
        </CardTitle>
        <CardDescription>
          Otimizado para seu desempenho e tempo disponível
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Seletor de tempo */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Quanto tempo você tem?</span>
            <Badge className="bg-primary">
              <Clock className="w-3 h-3 mr-1" />
              {selectedMinutes} minutos
            </Badge>
          </div>
          
          <Slider
            value={[selectedMinutes]}
            onValueChange={([value]) => setSelectedMinutes(value)}
            min={15}
            max={180}
            step={15}
            className="w-full"
          />
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>15min</span>
            <span>1h</span>
            <span>2h</span>
            <span>3h</span>
          </div>
        </div>

        {/* Preview do cronograma */}
        <div className="bg-muted/30 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Seu cronograma otimizado:</span>
            <div className="flex items-center gap-3 text-sm">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Clock className="w-4 h-4" />
                {studyTime}min estudo
              </span>
              <span className="flex items-center gap-1 text-amber-500">
                <Zap className="w-4 h-4" />
                +{totalXP} XP
              </span>
            </div>
          </div>

          {/* Timeline visual */}
          <div className="space-y-2">
            {schedule.slice(0, 4).map((block, idx) => {
              const Icon = getBlockIcon(block.tipo);
              return (
                <motion.div
                  key={block.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl",
                    block.prioridade === 'critica' && "bg-red-500/10 border border-red-500/20",
                    block.prioridade === 'alta' && "bg-amber-500/10",
                    block.prioridade === 'media' && "bg-muted/50",
                    block.tipo === 'pausa' && "bg-green-500/5"
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-lg bg-gradient-to-br shrink-0",
                    getBlockColor(block.prioridade)
                  )}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{block.titulo}</span>
                      {block.prioridade === 'critica' && (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                          Prioridade
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{block.motivo}</p>
                  </div>
                  
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold">{block.duracao}min</div>
                    {block.xpEstimado > 0 && (
                      <div className="text-xs text-amber-500">+{block.xpEstimado} XP</div>
                    )}
                  </div>
                </motion.div>
              );
            })}
            
            {schedule.length > 4 && (
              <div className="text-center text-sm text-muted-foreground py-2">
                +{schedule.length - 4} atividades...
              </div>
            )}
          </div>
        </div>

        {/* Botão de início */}
        <Button 
          className="w-full h-14 text-lg font-bold"
          onClick={() => onStartBlock?.(schedule[0])}
        >
          <Play className="w-5 h-5 mr-2" />
          Iniciar Sessão de Estudos
          <ChevronRight className="w-5 h-5 ml-2" />
        </Button>

        {/* Insight da IA */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-purple-500/5 border border-purple-500/20">
          <Brain className="w-5 h-5 text-purple-500 mt-0.5" />
          <div className="text-sm">
            <span className="font-medium text-purple-500">Insight: </span>
            <span className="text-muted-foreground">
              Sua <strong>Estequiometria</strong> está com apenas 45% de acerto. 
              Priorizamos revisão dessa área porque ela é base para Orgânica e Físico-Química!
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default AdaptiveScheduler;
