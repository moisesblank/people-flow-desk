// =====================================================
// StudentPerformanceAnalytics v2.0 - YEAR 2300 HUD
// Performance: Lazy Recharts + Performance Tiering
// Funcionalidade: Dashboard diário com insights acionáveis
// Limite: 20 itens por categoria
// =====================================================

import { useMemo, memo, lazy, Suspense, useState, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { 
  useStudentTaxonomyPerformance, 
  treeToArray,
  type TaxonomyNode 
} from "@/hooks/student-performance/useStudentTaxonomyPerformance";
import { useConstitutionPerformance } from "@/hooks/useConstitutionPerformance";
import { 
  BarChart3, Target, TrendingUp, Award, Zap, BookOpen, 
  FlaskConical, Activity, Sparkles, ChevronDown, ChevronRight, Atom,
  Brain, Beaker, Leaf, Dna, AlertTriangle, CheckCircle2, Clock,
  Trophy, Flame, Eye, ChevronUp, Lightbulb, ArrowRight
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TaxonomyHierarchyTable } from "@/components/aluno/performance";

// Lazy load de gráficos - só carrega quando visível
const LazyCharts = lazy(() => import('./StudentPerformanceCharts'));

// =====================================================
// CONSTANTES
// =====================================================
const MAX_ITEMS_PER_CATEGORY = 20;

const MACRO_CONFIG: Record<string, { icon: typeof FlaskConical; color: string; gradient: string }> = {
  "Química Geral": { icon: Atom, color: "text-amber-400", gradient: "from-amber-500/20 to-amber-600/5" },
  "Físico-Química": { icon: Zap, color: "text-cyan-400", gradient: "from-cyan-500/20 to-cyan-600/5" },
  "Química Orgânica": { icon: Beaker, color: "text-purple-400", gradient: "from-purple-500/20 to-purple-600/5" },
  "Química Ambiental": { icon: Leaf, color: "text-emerald-400", gradient: "from-emerald-500/20 to-emerald-600/5" },
  "Bioquímica": { icon: Dna, color: "text-pink-400", gradient: "from-pink-500/20 to-pink-600/5" },
};

// =====================================================
// TIPOS
// =====================================================
interface ProcessedItem {
  name: string;
  total: number;
  correct: number;
  errors: number;
  accuracy: number;
  parentMacro?: string;
}

// =====================================================
// HUD STAT CARD - Compacto e funcional
// =====================================================
const HUDStatCard = memo(function HUDStatCard({ 
  label, value, subValue, icon: Icon, variant = 'default', compact = false 
}: { 
  label: string; 
  value: string | number; 
  subValue?: string; 
  icon: typeof BookOpen; 
  variant?: 'default' | 'success' | 'warning' | 'error';
  compact?: boolean;
}) {
  const colors = {
    default: "border-primary/30 bg-primary/5",
    success: "border-emerald-500/30 bg-emerald-500/5",
    warning: "border-amber-500/30 bg-amber-500/5",
    error: "border-rose-500/30 bg-rose-500/5",
  };
  const iconColors = {
    default: "text-primary",
    success: "text-emerald-400",
    warning: "text-amber-400",
    error: "text-rose-400",
  };

  return (
    <div className={cn(
      "relative rounded-xl border backdrop-blur-sm transition-all duration-300 hover:scale-[1.02]",
      colors[variant],
      compact ? "p-3" : "p-4"
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className={cn("font-black tracking-tight", compact ? "text-2xl" : "text-3xl")}>
            {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
          </div>
          {subValue && <div className="text-xs text-muted-foreground mt-0.5">{subValue}</div>}
          <div className="text-xs font-medium text-muted-foreground mt-1 uppercase tracking-wider truncate">
            {label}
          </div>
        </div>
        <div className={cn("p-2 rounded-lg bg-background/50", iconColors[variant])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
});

// =====================================================
// INSIGHT CARD - Dicas acionáveis para o aluno
// =====================================================
const InsightCard = memo(function InsightCard({ 
  type, title, description, action, onClick 
}: { 
  type: 'warning' | 'tip' | 'success';
  title: string;
  description: string;
  action?: string;
  onClick?: () => void;
}) {
  const config = {
    warning: { icon: AlertTriangle, bg: "bg-amber-500/10 border-amber-500/30", iconColor: "text-amber-400" },
    tip: { icon: Lightbulb, bg: "bg-blue-500/10 border-blue-500/30", iconColor: "text-blue-400" },
    success: { icon: CheckCircle2, bg: "bg-emerald-500/10 border-emerald-500/30", iconColor: "text-emerald-400" },
  };
  const { icon: Icon, bg, iconColor } = config[type];

  return (
    <div className={cn("rounded-xl border p-3 flex items-start gap-3", bg)}>
      <div className={cn("p-1.5 rounded-lg bg-background/50", iconColor)}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{description}</div>
        {action && onClick && (
          <button 
            onClick={onClick}
            className="text-xs font-medium text-primary hover:underline mt-1.5 flex items-center gap-1"
          >
            {action} <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
});

// =====================================================
// PROGRESS BAR COM GLOW
// =====================================================
const GlowProgress = memo(function GlowProgress({ value, variant = 'default' }: { value: number; variant?: 'success' | 'warning' | 'error' | 'default' }) {
  const colors = {
    success: "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]",
    warning: "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]",
    error: "bg-rose-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]",
    default: "bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.5)]",
  };
  
  const getVariant = () => {
    if (value >= 70) return 'success';
    if (value >= 50) return 'warning';
    return 'error';
  };
  
  const finalVariant = variant === 'default' ? getVariant() : variant;
  
  return (
    <div className="relative h-2 bg-muted/30 rounded-full overflow-hidden">
      <div 
        className={cn("h-full rounded-full transition-all duration-500", colors[finalVariant])}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
});

// =====================================================
// MACRO CARD EXPANDÍVEL - UX PRINCIPAL
// =====================================================
interface MacroCardProps {
  macro: ProcessedItem;
  micros: ProcessedItem[];
  temas: Map<string, ProcessedItem[]>;
  isExpanded: boolean;
  onToggle: () => void;
}

const MacroCard = memo(function MacroCard({ macro, micros, temas, isExpanded, onToggle }: MacroCardProps) {
  const [expandedMicro, setExpandedMicro] = useState<string | null>(null);
  const config = MACRO_CONFIG[macro.name] || { icon: FlaskConical, color: "text-primary", gradient: "from-primary/20 to-primary/5" };
  const Icon = config.icon;

  const displayMicros = micros.slice(0, MAX_ITEMS_PER_CATEGORY);
  const hasMoreMicros = micros.length > MAX_ITEMS_PER_CATEGORY;

  return (
    <div className={cn(
      "rounded-2xl border overflow-hidden transition-all duration-300",
      "bg-gradient-to-br backdrop-blur-sm",
      config.gradient,
      isExpanded ? "border-primary/40" : "border-border/50 hover:border-border"
    )}>
      {/* Header - Sempre visível */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center gap-3 text-left hover:bg-white/5 transition-colors"
      >
        <div className={cn("p-2.5 rounded-xl bg-background/50 border border-border/30", config.color)}>
          <Icon className="w-5 h-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="font-bold text-base truncate">{macro.name}</div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-muted-foreground">{macro.total} questões</span>
            <span className="text-xs text-emerald-400">{macro.correct} acertos</span>
            <span className="text-xs text-rose-400">{macro.errors} erros</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className={cn(
              "text-xl font-black",
              macro.accuracy >= 70 ? "text-emerald-400" : macro.accuracy >= 50 ? "text-amber-400" : "text-rose-400"
            )}>
              {macro.accuracy.toFixed(0)}%
            </div>
            <div className="text-[10px] text-muted-foreground uppercase">acurácia</div>
          </div>
          
          <div className="w-16 hidden sm:block">
            <GlowProgress value={macro.accuracy} />
          </div>
          
          <ChevronDown className={cn(
            "w-5 h-5 text-muted-foreground transition-transform duration-300",
            isExpanded && "rotate-180"
          )} />
        </div>
      </button>

      {/* Mobile accuracy */}
      <div className="px-4 pb-2 sm:hidden">
        <div className="flex items-center gap-2">
          <GlowProgress value={macro.accuracy} />
          <span className={cn(
            "text-sm font-bold",
            macro.accuracy >= 70 ? "text-emerald-400" : macro.accuracy >= 50 ? "text-amber-400" : "text-rose-400"
          )}>
            {macro.accuracy.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Micros - Expandido */}
      {isExpanded && displayMicros.length > 0 && (
        <div className="border-t border-border/30 bg-background/30">
          {displayMicros.map((micro, idx) => {
            const microTemas = temas.get(micro.name) || [];
            const displayTemas = microTemas.slice(0, MAX_ITEMS_PER_CATEGORY);
            const hasMoreTemas = microTemas.length > MAX_ITEMS_PER_CATEGORY;
            const isMicroExpanded = expandedMicro === micro.name;

            return (
              <div key={idx} className="border-b border-border/20 last:border-0">
                {/* Micro Header */}
                <button
                  onClick={() => setExpandedMicro(isMicroExpanded ? null : micro.name)}
                  className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-white/5 transition-colors"
                >
                  <div className="w-6 flex justify-center">
                    {microTemas.length > 0 ? (
                      <ChevronRight className={cn(
                        "w-4 h-4 text-muted-foreground transition-transform",
                        isMicroExpanded && "rotate-90"
                      )} />
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                    )}
                  </div>
                  
                  <span className="flex-1 text-sm font-medium truncate">{micro.name}</span>
                  
                  <div className="flex items-center gap-2 text-xs">
                    <Badge variant="outline" className="bg-blue-500/10 border-blue-500/30 text-blue-400">
                      {micro.total}
                    </Badge>
                    <Badge variant="outline" className={cn(
                      micro.accuracy >= 70 ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
                      micro.accuracy >= 50 ? "bg-amber-500/10 border-amber-500/30 text-amber-400" :
                      "bg-rose-500/10 border-rose-500/30 text-rose-400"
                    )}>
                      {micro.accuracy.toFixed(0)}%
                    </Badge>
                  </div>
                </button>

                {/* Temas */}
                {isMicroExpanded && displayTemas.length > 0 && (
                  <div className="bg-background/20 px-4 py-2 space-y-1">
                    {displayTemas.map((tema, tIdx) => (
                      <div key={tIdx} className="flex items-center gap-3 py-1.5 px-3 rounded-lg hover:bg-white/5">
                        <div className="w-1 h-1 rounded-full bg-muted-foreground/50" />
                        <span className="flex-1 text-xs text-muted-foreground truncate">{tema.name}</span>
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <span className="text-muted-foreground">{tema.total}</span>
                          <span className="text-muted-foreground/50">•</span>
                          <span className={cn(
                            tema.accuracy >= 70 ? "text-emerald-400" : 
                            tema.accuracy >= 50 ? "text-amber-400" : "text-rose-400"
                          )}>
                            {tema.accuracy.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                    {hasMoreTemas && (
                      <div className="text-[10px] text-muted-foreground text-center py-1">
                        +{microTemas.length - MAX_ITEMS_PER_CATEGORY} temas adicionais
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          
          {hasMoreMicros && (
            <div className="text-xs text-muted-foreground text-center py-2 border-t border-border/20">
              +{micros.length - MAX_ITEMS_PER_CATEGORY} micros adicionais
            </div>
          )}
        </div>
      )}
    </div>
  );
});

// =====================================================
// TOP WEAK AREAS - Áreas para focar
// =====================================================
const WeakAreasPanel = memo(function WeakAreasPanel({ items }: { items: ProcessedItem[] }) {
  const weakAreas = items
    .filter(item => item.total >= 3 && item.accuracy < 60)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 5);

  if (weakAreas.length === 0) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-center">
        <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
        <div className="font-semibold text-emerald-400">Excelente!</div>
        <div className="text-xs text-muted-foreground mt-1">
          Nenhuma área crítica identificada
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-4 h-4 text-rose-400" />
        <span className="font-semibold text-sm">Áreas para Revisar</span>
      </div>
      <div className="space-y-2">
        {weakAreas.map((area, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">{area.name}</div>
              <div className="text-[10px] text-muted-foreground">
                {area.errors} erros de {area.total}
              </div>
            </div>
            <Badge variant="outline" className="bg-rose-500/10 border-rose-500/30 text-rose-400 text-[10px]">
              {area.accuracy.toFixed(0)}%
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
});

// =====================================================
// TOP STRONG AREAS - Pontos fortes
// =====================================================
const StrongAreasPanel = memo(function StrongAreasPanel({ items }: { items: ProcessedItem[] }) {
  const strongAreas = items
    .filter(item => item.total >= 3 && item.accuracy >= 70)
    .sort((a, b) => b.accuracy - a.accuracy)
    .slice(0, 5);

  if (strongAreas.length === 0) {
    return (
      <div className="rounded-xl border border-muted/30 bg-muted/5 p-4 text-center">
        <Activity className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
        <div className="font-medium text-muted-foreground">Em progresso</div>
        <div className="text-xs text-muted-foreground mt-1">
          Continue praticando para identificar seus pontos fortes
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-4 h-4 text-emerald-400" />
        <span className="font-semibold text-sm">Seus Pontos Fortes</span>
      </div>
      <div className="space-y-2">
        {strongAreas.map((area, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">{area.name}</div>
              <div className="text-[10px] text-muted-foreground">
                {area.correct} acertos de {area.total}
              </div>
            </div>
            <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400 text-[10px]">
              {area.accuracy.toFixed(0)}%
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
});

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================
export function StudentPerformanceAnalytics() {
  const { user } = useAuth();
  const perfConfig = useConstitutionPerformance();
  
  const { data: taxonomyData, isLoading } = useStudentTaxonomyPerformance(user?.id);

  // Inicializa com todos os macros expandidos
  const [expandedMacros, setExpandedMacros] = useState<Set<string>>(() => 
    new Set(["Química Geral", "Físico-Química", "Química Orgânica", "Química Ambiental", "Bioquímica"])
  );
  const [showCharts, setShowCharts] = useState(true); // Charts visíveis por padrão

  const toggleMacro = useCallback((name: string) => {
    setExpandedMacros(prev => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }, []);

  // Processar dados
  const processedData = useMemo(() => {
    if (!taxonomyData?.array) {
      return {
        macros: [] as ProcessedItem[],
        microsByMacro: new Map<string, ProcessedItem[]>(),
        temasByMicro: new Map<string, ProcessedItem[]>(),
        allMicros: [] as ProcessedItem[],
        allTemas: [] as ProcessedItem[],
        totalQuestions: 0,
        totalCorrect: 0,
        totalErrors: 0,
        overallAccuracy: 0,
      };
    }

    const macros: ProcessedItem[] = [];
    const microsByMacro = new Map<string, ProcessedItem[]>();
    const temasByMicro = new Map<string, ProcessedItem[]>();
    const allMicros: ProcessedItem[] = [];
    const allTemas: ProcessedItem[] = [];
    let totalQuestions = 0;
    let totalCorrect = 0;

    taxonomyData.array.forEach((macro) => {
      totalQuestions += macro.totalAttempts;
      totalCorrect += macro.correctAttempts;

      macros.push({
        name: macro.name,
        total: macro.totalAttempts,
        correct: macro.correctAttempts,
        errors: macro.totalAttempts - macro.correctAttempts,
        accuracy: macro.accuracyPercent,
      });

      const macroMicros: ProcessedItem[] = [];
      
      if (macro.children && macro.children.size > 0) {
        macro.children.forEach((micro) => {
          const microItem: ProcessedItem = {
            name: micro.name,
            total: micro.totalAttempts,
            correct: micro.correctAttempts,
            errors: micro.totalAttempts - micro.correctAttempts,
            accuracy: micro.accuracyPercent,
            parentMacro: macro.name,
          };
          macroMicros.push(microItem);
          allMicros.push(microItem);

          const microTemas: ProcessedItem[] = [];
          if (micro.children && micro.children.size > 0) {
            micro.children.forEach((tema) => {
              const temaItem: ProcessedItem = {
                name: tema.name,
                total: tema.totalAttempts,
                correct: tema.correctAttempts,
                errors: tema.totalAttempts - tema.correctAttempts,
                accuracy: tema.accuracyPercent,
                parentMacro: macro.name,
              };
              microTemas.push(temaItem);
              allTemas.push(temaItem);
            });
          }
          temasByMicro.set(micro.name, microTemas.sort((a, b) => b.total - a.total));
        });
      }
      
      microsByMacro.set(macro.name, macroMicros.sort((a, b) => b.total - a.total));
    });

    return {
      macros: macros.sort((a, b) => b.total - a.total),
      microsByMacro,
      temasByMicro,
      allMicros: allMicros.sort((a, b) => b.total - a.total),
      allTemas: allTemas.sort((a, b) => b.total - a.total),
      totalQuestions,
      totalCorrect,
      totalErrors: totalQuestions - totalCorrect,
      overallAccuracy: totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0,
    };
  }, [taxonomyData]);

  // Insights inteligentes
  const insights = useMemo(() => {
    const result: Array<{ type: 'warning' | 'tip' | 'success'; title: string; description: string }> = [];
    
    if (processedData.totalQuestions === 0) {
      result.push({
        type: 'tip',
        title: 'Comece a praticar!',
        description: 'Responda questões para ver suas métricas de desempenho aqui.',
      });
      return result;
    }

    if (processedData.overallAccuracy >= 80) {
      result.push({
        type: 'success',
        title: 'Desempenho Excelente!',
        description: `Sua taxa de acerto de ${processedData.overallAccuracy.toFixed(0)}% está acima da média. Continue assim!`,
      });
    } else if (processedData.overallAccuracy < 50) {
      result.push({
        type: 'warning',
        title: 'Atenção ao Desempenho',
        description: 'Sua taxa está abaixo de 50%. Revise as áreas com mais erros.',
      });
    }

    const worstArea = processedData.allMicros
      .filter(m => m.total >= 5)
      .sort((a, b) => a.accuracy - b.accuracy)[0];
    
    if (worstArea && worstArea.accuracy < 50) {
      result.push({
        type: 'tip',
        title: `Foco em: ${worstArea.name}`,
        description: `Esta área tem ${worstArea.accuracy.toFixed(0)}% de acerto. Considere revisar o conteúdo.`,
      });
    }

    return result.slice(0, 2);
  }, [processedData]);

  if (isLoading) {
    return (
      <div className="space-y-4 pb-8">
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Header HUD */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/30 rounded-xl blur-lg animate-pulse" />
            <div className="relative p-3 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl border border-primary/30">
              <Brain className="w-6 h-6 text-primary" />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold tracking-tight">Análise de Desempenho</h2>
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Atualização em tempo real • Limite de {MAX_ITEMS_PER_CATEGORY} itens por categoria
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowCharts(!showCharts)}
            className="hidden sm:flex"
          >
            <Eye className="w-4 h-4 mr-1.5" />
            {showCharts ? 'Ocultar' : 'Ver'} Gráficos
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <HUDStatCard
          label="Questões Feitas"
          value={processedData.totalQuestions}
          icon={BookOpen}
        />
        <HUDStatCard
          label="Acertos"
          value={processedData.totalCorrect}
          subValue={`de ${processedData.totalQuestions}`}
          icon={Target}
          variant="success"
        />
        <HUDStatCard
          label="Erros"
          value={processedData.totalErrors}
          icon={AlertTriangle}
          variant="error"
        />
        <HUDStatCard
          label="Acurácia Geral"
          value={`${processedData.overallAccuracy.toFixed(1)}%`}
          icon={Award}
          variant={processedData.overallAccuracy >= 70 ? 'success' : processedData.overallAccuracy >= 50 ? 'warning' : 'error'}
        />
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.map((insight, idx) => (
            <InsightCard key={idx} {...insight} />
          ))}
        </div>
      )}

      {/* Charts - Lazy loaded */}
      {showCharts && (
        <Suspense fallback={
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Skeleton className="h-[320px] rounded-2xl" />
              <Skeleton className="h-[320px] rounded-2xl" />
            </div>
            <Skeleton className="h-[300px] rounded-2xl" />
            <Skeleton className="h-[380px] rounded-2xl" />
          </div>
        }>
          <LazyCharts 
            macros={processedData.macros} 
            micros={processedData.allMicros.slice(0, MAX_ITEMS_PER_CATEGORY)}
            temas={processedData.allTemas.slice(0, MAX_ITEMS_PER_CATEGORY)}
            isLowEnd={perfConfig.isLowEnd}
          />
        </Suspense>
      )}

      {/* Mobile Charts Toggle */}
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => setShowCharts(!showCharts)}
        className="w-full sm:hidden"
      >
        <Eye className="w-4 h-4 mr-1.5" />
        {showCharts ? 'Ocultar Gráficos' : 'Ver Gráficos'}
      </Button>

      {/* Tabela Hierárquica: MACRO → MICRO → TEMA (tudo expandido) */}
      <TaxonomyHierarchyTable
        data={taxonomyData?.array ?? []}
        isLoading={isLoading}
        className="mt-4"
      />

      {/* Weak/Strong Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <WeakAreasPanel items={processedData.allMicros} />
        <StrongAreasPanel items={processedData.allMicros} />
      </div>

    </div>
  );
}

export default StudentPerformanceAnalytics;
