// ============================================
// 📅 CRONOGRAMA MODAL CONTENT
// Conteúdo do modal de cronograma adaptativo
// Lazy-loaded para performance
// ============================================

import { memo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Clock, 
  Brain, 
  Target, 
  Zap, 
  Play, 
  RotateCcw,
  Timer,
  ChevronRight,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Flame
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  generateSchedule, 
  calculateScheduleStats,
  type StudyBlock,
  type AreaPerformance 
} from "@/lib/algorithms/studyPriority";

// Mock de performance do aluno (será conectado ao banco)
const MOCK_PERFORMANCES: AreaPerformance[] = [
  { areaId: '1', areaName: 'Estequiometria', accuracy: 45, lastStudied: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), pendingReviews: 5, weight: 0.15 },
  { areaId: '2', areaName: 'Química Orgânica', accuracy: 72, lastStudied: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), pendingReviews: 2, weight: 0.20 },
  { areaId: '3', areaName: 'Eletroquímica', accuracy: 58, lastStudied: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), pendingReviews: 3, weight: 0.12 },
  { areaId: '4', areaName: 'Termoquímica', accuracy: 85, lastStudied: new Date(), pendingReviews: 0, weight: 0.10 },
  { areaId: '5', areaName: 'Cinética', accuracy: 65, lastStudied: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), pendingReviews: 1, weight: 0.08 },
  { areaId: '6', areaName: 'Soluções', accuracy: 55, lastStudied: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), pendingReviews: 4, weight: 0.12 },
  { areaId: '7', areaName: 'Ligações Químicas', accuracy: 78, lastStudied: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), pendingReviews: 1, weight: 0.10 },
  { areaId: '8', areaName: 'Atomística', accuracy: 82, lastStudied: new Date(), pendingReviews: 0, weight: 0.08 },
];

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

const getBlockGradient = (prioridade: StudyBlock['prioridade']) => {
  switch (prioridade) {
    case 'critica': return 'from-red-500 to-orange-500';
    case 'alta': return 'from-amber-500 to-yellow-500';
    case 'media': return 'from-blue-500 to-cyan-500';
    case 'baixa': return 'from-green-500 to-emerald-500';
  }
};

const getPriorityBg = (prioridade: StudyBlock['prioridade']) => {
  switch (prioridade) {
    case 'critica': return 'bg-red-500/10 border-red-500/30';
    case 'alta': return 'bg-amber-500/10 border-amber-500/30';
    case 'media': return 'bg-blue-500/10 border-blue-500/30';
    case 'baixa': return 'bg-green-500/10 border-green-500/30';
  }
};

export const CronogramaModalContent = memo(function CronogramaModalContent() {
  const [selectedMinutes, setSelectedMinutes] = useState(60);
  const [activeTab, setActiveTab] = useState<"gerar" | "metas" | "historico">("gerar");
  
  const schedule = generateSchedule(selectedMinutes, MOCK_PERFORMANCES);
  const stats = calculateScheduleStats(schedule);
  
  // Encontrar áreas críticas
  const criticalAreas = MOCK_PERFORMANCES
    .filter(a => a.accuracy < 60)
    .sort((a, b) => a.accuracy - b.accuracy);
  
  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="gerar" className="gap-2">
            <Calendar className="w-4 h-4" />
            Gerar
          </TabsTrigger>
          <TabsTrigger value="metas" className="gap-2">
            <Target className="w-4 h-4" />
            Metas
          </TabsTrigger>
          <TabsTrigger value="historico" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            Histórico
          </TabsTrigger>
        </TabsList>
        
        {/* TAB: GERAR CRONOGRAMA */}
        <TabsContent value="gerar" className="space-y-6 mt-6">
          {/* Seletor de tempo */}
          <Card className="border-primary/20">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Quanto tempo você tem hoje?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {[30, 60, 90, 120].map((mins) => (
                    <Button
                      key={mins}
                      variant={selectedMinutes === mins ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedMinutes(mins)}
                      className={cn(
                        "min-w-[60px]",
                        selectedMinutes === mins && "bg-gradient-to-r from-primary to-purple-600"
                      )}
                    >
                      {mins >= 60 ? `${mins / 60}h` : `${mins}min`}
                    </Button>
                  ))}
                </div>
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  <Zap className="w-3 h-3 mr-1" />
                  +{stats.totalXP} XP estimado
                </Badge>
              </div>
              
              <Slider
                value={[selectedMinutes]}
                onValueChange={([v]) => setSelectedMinutes(v)}
                min={15}
                max={180}
                step={15}
                className="mt-4"
              />
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>15min</span>
                <span>1h</span>
                <span>2h</span>
                <span>3h</span>
              </div>
            </CardContent>
          </Card>
          
          {/* Cronograma gerado */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lista de atividades */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    Seu Cronograma Otimizado
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {stats.blockCount} atividades
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
                {schedule.map((block, idx) => {
                  const Icon = getBlockIcon(block.tipo);
                  return (
                    <div
                      key={block.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl border transition-all hover:scale-[1.01]",
                        getPriorityBg(block.prioridade)
                      )}
                    >
                      <div className="text-xs text-muted-foreground w-8">
                        {idx + 1}.
                      </div>
                      <div className={cn(
                        "p-2 rounded-lg bg-gradient-to-br shrink-0",
                        getBlockGradient(block.prioridade)
                      )}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">{block.titulo}</span>
                          {block.prioridade === 'critica' && (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                              URGENTE
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{block.motivo}</p>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold">{block.duracao}min</div>
                        {block.xpEstimado > 0 && (
                          <div className="text-xs text-amber-500 flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            +{block.xpEstimado}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
            
            {/* Análise de áreas */}
            <div className="space-y-4">
              {/* Áreas críticas */}
              <Card className="border-red-500/20 bg-red-500/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2 text-red-500">
                    <AlertTriangle className="w-4 h-4" />
                    Áreas que Precisam de Atenção
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {criticalAreas.slice(0, 3).map((area) => (
                    <div key={area.areaId} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{area.areaName}</span>
                          <span className="text-xs text-red-500">{area.accuracy}%</span>
                        </div>
                        <Progress 
                          value={area.accuracy} 
                          className="h-2"
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              
              {/* Insight IA */}
              <Card className="border-purple-500/20 bg-purple-500/5">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                      <Brain className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-purple-500 mb-1">Insight da IA</h4>
                      <p className="text-sm text-muted-foreground">
                        Sua <strong>Estequiometria</strong> está com apenas 45% de acerto e não é revisada há 3 dias. 
                        Como ela é base para Química Orgânica e Físico-Química, priorizei sua revisão no cronograma!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Botão de início */}
              <Button className="w-full h-14 text-lg font-bold bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 shadow-lg">
                <Play className="w-5 h-5 mr-2" />
                Iniciar Sessão de Estudos
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </TabsContent>
        
        {/* TAB: METAS */}
        <TabsContent value="metas" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Meta diária */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  Meta Diária
                </CardTitle>
                <CardDescription>Seu objetivo para hoje</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <div className="text-4xl font-bold text-orange-500 mb-2">2h</div>
                  <Progress value={45} className="h-3 mb-2" />
                  <p className="text-sm text-muted-foreground">54 min de 2h estudados</p>
                </div>
              </CardContent>
            </Card>
            
            {/* Streak */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Streak Atual
                </CardTitle>
                <CardDescription>Dias consecutivos estudando</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <div className="text-4xl font-bold text-amber-500 mb-2">7 dias</div>
                  <div className="flex justify-center gap-1">
                    {[1,2,3,4,5,6,7].map(d => (
                      <div key={d} className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Sistema de metas personalizadas em breve...</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* TAB: HISTÓRICO */}
        <TabsContent value="historico" className="space-y-6 mt-6">
          <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Histórico de estudos em breve...</p>
              <p className="text-sm mt-2">Visualize sua evolução ao longo do tempo</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
});

export default CronogramaModalContent;
