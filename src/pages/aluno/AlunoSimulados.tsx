/**
 * 🎯 CENTRAL DO ALUNO — SIMULADOS
 * Constituição SYNAPSE Ω v10.0
 * 
 * Design: Year 2300 Cinematic Experience
 * ⚡ Performance-Optimized via useConstitutionPerformance
 * 📂 Organização por Grupos (v2.0)
 * 🎮 Mode Selector: Treino vs Hard (v2.1)
 */

import { useState, useCallback, memo, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Brain, Clock, Target, Trophy, Play, 
  Calendar, CheckCircle2, Lock, FileText, Zap,
  Shield, Camera, Timer, Rocket,
  Flame, TrendingUp, Star, BookOpen
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LoadingState } from "@/components/LoadingState";
import { cn } from "@/lib/utils";
import { useSimuladosList, SimuladoListItem } from "@/hooks/simulados/useSimuladosList";
import { SimuladoPlayer } from "@/components/simulados";
import { SimuladoModeSelector } from "@/components/simulados/screens";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { calculatePercentage } from "@/components/simulados/types";
import { CyberBackground } from "@/components/ui/cyber-background";
import { FuturisticPageHeader } from "@/components/ui/futuristic-page-header";
import { useConstitutionPerformance } from "@/hooks/useConstitutionPerformance";
import { 
  classifySimuladosByGroup, 
  SimuladoGroupSection, 
  SimuladosBySubjectSection 
} from "@/components/simulados/SimuladoGroupedSection";
import "@/styles/dashboard-2300.css";

export default function AlunoSimulados() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState("disponiveis");
  
  // ⚡ Performance flags - LEI I (simplified)
  const { shouldShowParticles, isLowEnd } = useConstitutionPerformance();
  
  // Simulado ativo (do URL ou selecionado)
  const activeSimuladoId = searchParams.get("s");
  const [selectedSimuladoId, setSelectedSimuladoId] = useState<string | null>(activeSimuladoId);
  
  // 🎮 Mode Selector State
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [pendingSimuladoId, setPendingSimuladoId] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<'treino' | 'hard' | null>(null);
  
  // Buscar simulados reais
  const { data: simuladosData, isLoading, refetch } = useSimuladosList();

  // Encontrar simulado pendente para mode selector
  const pendingSimulado = useMemo(() => {
    if (!pendingSimuladoId || !simuladosData) return null;
    return [...simuladosData.available, ...simuladosData.completed, ...simuladosData.upcoming]
      .find(s => s.id === pendingSimuladoId) || null;
  }, [pendingSimuladoId, simuladosData]);

  // Estatísticas calculadas
  const stats = useMemo(() => ({
    disponíveis: simuladosData?.available.length || 0,
    realizados: simuladosData?.completed.length || 0,
    emBreve: simuladosData?.upcoming.length || 0,
    total: (simuladosData?.available.length || 0) + 
           (simuladosData?.completed.length || 0) + 
           (simuladosData?.upcoming.length || 0),
  }), [simuladosData]);

  // Handler: Clicou em um card de simulado
  const handleSelectSimulado = useCallback((id: string) => {
    console.log('[handleSelectSimulado] Selected ID:', id);
    
    // Encontrar o simulado
    const simulado = [...(simuladosData?.available || []), ...(simuladosData?.completed || []), ...(simuladosData?.upcoming || [])]
      .find(s => s.id === id);
    
    if (!simulado) {
      console.log('[handleSelectSimulado] Simulado not found, using fallback');
      // Fallback: abrir direto
      setSelectedSimuladoId(id);
      setSearchParams({ s: id });
      return;
    }

    console.log('[handleSelectSimulado] Found simulado:', simulado.title, 'is_hard_mode:', simulado.is_hard_mode);

    // Se JÁ é hard mode nativo → abrir direto (sem seletor)
    if (simulado.is_hard_mode) {
      console.log('[handleSelectSimulado] Hard mode native, opening directly');
      setSelectedMode('hard');
      setSelectedSimuladoId(id);
      setSearchParams({ s: id });
      return;
    }

    // Se é NORMAL → mostrar seletor de modo
    console.log('[handleSelectSimulado] Normal mode, showing selector');
    setPendingSimuladoId(id);
    setShowModeSelector(true);
  }, [simuladosData, setSearchParams]);

  // Handler: Modo selecionado
  const handleModeSelected = useCallback((mode: 'treino' | 'hard') => {
    console.log('[SimuladoModeSelected] Mode:', mode, 'pendingSimuladoId:', pendingSimuladoId);
    
    if (!pendingSimuladoId) {
      console.error('[SimuladoModeSelected] ABORT: pendingSimuladoId is null');
      return;
    }
    
    const simuladoIdToStart = pendingSimuladoId;
    
    // P0 FIX: Limpar selector ANTES de setar o simulado para evitar race condition
    setShowModeSelector(false);
    setPendingSimuladoId(null);
    
    // Setar modo e ID para iniciar o player
    setSelectedMode(mode);
    setSelectedSimuladoId(simuladoIdToStart);
    setSearchParams({ s: simuladoIdToStart });
    
    console.log('[SimuladoModeSelected] SUCCESS: Starting simulado', simuladoIdToStart, 'in mode', mode);
  }, [pendingSimuladoId, setSearchParams]);

  // Handler: Fechou mode selector
  const handleCloseModeSelector = useCallback(() => {
    setShowModeSelector(false);
    setPendingSimuladoId(null);
  }, []);

  const handleCloseSimulado = useCallback(() => {
    setSelectedSimuladoId(null);
    setSelectedMode(null);
    setSearchParams({});
    refetch();
  }, [setSearchParams, refetch]);

  const handleSimuladoComplete = useCallback(() => {
    refetch();
  }, [refetch]);

  // DEBUG: Log do estado atual para debugging
  console.log('[AlunoSimulados Render]', {
    showModeSelector,
    pendingSimuladoId,
    pendingSimulado: pendingSimulado?.title || null,
    selectedSimuladoId,
    selectedMode
  });

  // 🎮 Mode Selector Modal
  if (showModeSelector && pendingSimulado) {
    console.log('[AlunoSimulados] Rendering ModeSelector');
    return (
      <SimuladoModeSelector
        isOpen={true}
        onClose={handleCloseModeSelector}
        onSelectMode={handleModeSelected}
        simuladoTitle={pendingSimulado.title}
        durationMinutes={pendingSimulado.duration_minutes}
        questionCount={pendingSimulado.total_questions}
        requiresCamera={pendingSimulado.requires_camera}
      />
    );
  }

  // Se há simulado ativo, mostrar player em fullscreen
  if (selectedSimuladoId) {
    return (
      <Dialog open={true} onOpenChange={(open) => !open && handleCloseSimulado()}>
        <DialogContent className="w-[98vw] h-[98vh] max-w-[98vw] p-0 overflow-hidden">
          <SimuladoPlayer
            simuladoId={selectedSimuladoId}
            onComplete={handleSimuladoComplete}
            onExit={handleCloseSimulado}
            forcedMode={selectedMode}
          />
        </DialogContent>
      </Dialog>
    );
  }

  if (isLoading) {
    return <LoadingState message="Carregando simulados..." />;
  }

  return (
    <div className="relative min-h-screen">
      {/* 🌌 Cinematic Background - 🏛️ PREMIUM GARANTIDO: Sempre medium */}
      <CyberBackground variant="grid" intensity="medium" />
      
      <div className="relative z-10 container mx-auto p-4 md:p-6 lg:p-8 space-y-8">
        
        {/* 🎬 Hero Header */}
        <FuturisticPageHeader
          title="Arena de Simulados"
          subtitle="Domine suas provas com prática intensa e ranking competitivo"
          icon={Brain}
          badge="COMPETITIVO"
          accentColor="purple"
          stats={[
            { label: "Disponíveis", value: stats.disponíveis, icon: Play },
            { label: "Realizados", value: stats.realizados, icon: CheckCircle2 },
            { label: "Em Breve", value: stats.emBreve, icon: Calendar },
          ]}
        />

        {/* ⚡ XP Banner - Performance-Optimized (CSS-only) */}
        <div className="relative overflow-hidden rounded-xl">
          <div className="dashboard-hero-2300 p-5 md:p-6">
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-4 md:gap-6">
              {/* Icon Container */}
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 flex items-center justify-center shadow-lg">
                <Zap className="w-8 h-8 md:w-10 md:h-10 text-white" />
              </div>

              {/* Text Content */}
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-1">
                  Ganhe XP e Domine o Ranking!
                </h3>
                <p className="text-cyan-100/70 text-sm md:text-base max-w-xl">
                  Cada questão correta vale pontos de experiência. Suba de nível e conquiste o topo!
                </p>
              </div>

              {/* XP Badge */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 shadow-lg">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 md:w-5 md:h-5 text-white" />
                    <span className="text-xl md:text-2xl font-bold text-white">+10 XP</span>
                  </div>
                </div>
                <span className="text-[10px] text-cyan-200/50 uppercase tracking-wider">por questão</span>
              </div>
            </div>
          </div>
        </div>

        {/* 🗂️ Tabs Navigation - CSS-only */}
        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList className="w-full p-1 border border-border/50 rounded-xl grid grid-cols-3 h-auto bg-card/80">
            <TabsTrigger 
              value="disponiveis" 
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500/20 data-[state=active]:to-cyan-500/20 data-[state=active]:border-emerald-500/50 data-[state=active]:text-emerald-400 rounded-lg py-3 px-4 border border-transparent transition-colors"
            >
              <div className="flex items-center gap-2">
                <Rocket className="h-4 w-4" />
                <span className="hidden sm:inline">Disponíveis</span>
                <Badge variant="secondary" className="ml-1 text-xs">{stats.disponíveis}</Badge>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="realizados"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/20 data-[state=active]:to-pink-500/20 data-[state=active]:border-purple-500/50 data-[state=active]:text-purple-400 rounded-lg py-3 px-4 border border-transparent transition-colors"
            >
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                <span className="hidden sm:inline">Realizados</span>
                <Badge variant="secondary" className="ml-1 text-xs">{stats.realizados}</Badge>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="embreve"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-500/20 data-[state=active]:to-orange-500/20 data-[state=active]:border-amber-500/50 data-[state=active]:text-amber-400 rounded-lg py-3 px-4 border border-transparent transition-colors"
            >
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">Em Breve</span>
                <Badge variant="secondary" className="ml-1 text-xs">{stats.emBreve}</Badge>
              </div>
            </TabsTrigger>
          </TabsList>

          {/* Content Areas */}
          <TabsContent value="disponiveis" className="mt-0">
            {simuladosData?.available.length === 0 ? (
              <EmptyState 
                icon={Rocket}
                title="Nenhum simulado disponível"
                description="Novos simulados serão liberados em breve! Fique atento."
                accentColor="emerald"
              />
            ) : (
              <AvailableSimuladosGrouped
                simulados={simuladosData?.available || []}
                onSelectSimulado={handleSelectSimulado}
              />
            )}
          </TabsContent>

          <TabsContent value="realizados" className="mt-0">
            {simuladosData?.completed.length === 0 ? (
              <EmptyState 
                icon={Trophy}
                title="Nenhum simulado realizado"
                description="Complete seu primeiro simulado e veja suas estatísticas aqui!"
                accentColor="purple"
              />
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {simuladosData?.completed.map((simulado, index) => (
                  <SimuladoCompletedCard
                    key={simulado.id}
                    simulado={simulado}
                    onReview={() => handleSelectSimulado(simulado.id)}
                    index={index}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="embreve" className="mt-0">
            {simuladosData?.upcoming.length === 0 ? (
              <EmptyState 
                icon={Calendar}
                title="Nenhum simulado programado"
                description="Fique atento! Novos desafios serão anunciados em breve."
                accentColor="amber"
              />
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {simuladosData?.upcoming.map((simulado, index) => (
                  <SimuladoUpcomingCard
                    key={simulado.id}
                    simulado={simulado}
                    index={index}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ============================================
// 🃏 SIMULADO CARD - DISPONÍVEL (Performance-Optimized)
// ============================================

interface SimuladoCardProps {
  simulado: SimuladoListItem;
  onStart: () => void;
  shouldAnimate?: boolean;
  index?: number;
}

// Capas dos simulados por modo
import capaHardMode from "@/assets/simulados/capa-hard.png";
import capaNormalMode from "@/assets/simulados/capa-normal.png";

/**
 * 🎬 SIMULADO CARD - NETFLIX ULTRA PREMIUM + YEAR 2300 CINEMATIC
 * ⚡ PERFORMANCE-OPTIMIZED: CSS-only transitions, zero JS animations
 */
const SimuladoCard = memo(function SimuladoCard({ simulado, onStart, index = 0 }: SimuladoCardProps) {
  const hasRunningAttempt = simulado.user_attempt?.status === "RUNNING";
  const isRetake = simulado.user_attempt && !simulado.user_attempt.is_scored_for_ranking;
  const isHardMode = simulado.is_hard_mode;
  const coverImage = isHardMode ? capaHardMode : capaNormalMode;

  return (
    <div className="group">
      {/* 🎬 NETFLIX ULTRA PREMIUM CARD - CSS-only */}
      <div 
        className={cn(
          "relative flex rounded-2xl overflow-hidden cursor-pointer",
          "bg-gradient-to-br from-black/90 via-card/95 to-black/80",
          "border-2 transition-all duration-300 ease-out",
          "hover:scale-[1.02] hover:-translate-y-0.5",
          isHardMode 
            ? "border-red-500/20 hover:border-red-500/50 hover:shadow-[0_15px_40px_-10px_rgba(239,68,68,0.25)]" 
            : "border-emerald-500/20 hover:border-emerald-500/50 hover:shadow-[0_15px_40px_-10px_rgba(16,185,129,0.25)]"
        )}
        onClick={onStart}
      >
        {/* 🖼️ POSTER - LADO ESQUERDO */}
        <div className="relative w-28 md:w-40 lg:w-44 flex-shrink-0 overflow-hidden">
          <img 
            src={coverImage} 
            alt=""
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            decoding="async"
          />
          {/* Gradient blend */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/90" />
          {/* Hover glow */}
          <div className={cn(
            "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
            isHardMode 
              ? "bg-gradient-to-br from-red-500/20 via-transparent to-transparent"
              : "bg-gradient-to-br from-emerald-500/20 via-transparent to-transparent"
          )} />
        </div>

        {/* 📋 CONTEÚDO - LADO DIREITO */}
        <div className="flex-1 p-3 md:p-4 lg:p-5 flex flex-col justify-between min-w-0">
          
          {/* TOP: Badges */}
          <div className="flex items-center gap-1.5 flex-wrap mb-2">
            {hasRunningAttempt && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <Timer className="w-2.5 h-2.5 mr-1" />
                Em Andamento
              </span>
            )}
            {simulado.is_hard_mode && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-red-500/20 text-red-400 border border-red-500/30">
                <Flame className="w-2.5 h-2.5 mr-1" />
                Hard
              </span>
            )}
            {simulado.requires_camera && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Camera className="w-2.5 h-2.5 mr-1" />
                Câmera
              </span>
            )}
            {isRetake && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium text-muted-foreground border border-muted-foreground/20">
                Refazer
              </span>
            )}
          </div>

          {/* MIDDLE: Title & Description */}
          <div className="flex-1 min-w-0 mb-2">
            <h3 className={cn(
              "text-base md:text-lg lg:text-xl font-bold tracking-tight mb-1 transition-colors duration-200",
              isHardMode 
                ? "text-white group-hover:text-red-300"
                : "text-white group-hover:text-emerald-300"
            )}>
              {simulado.title}
            </h3>
            {simulado.description && (
              <p className="text-xs text-muted-foreground/70 line-clamp-2">
                {simulado.description}
              </p>
            )}
          </div>

          {/* STATS: Compact HUD */}
          <div className="flex items-center gap-3 md:gap-4 py-2 px-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] mb-2">
            <div className="flex items-center gap-1">
              <Target className="w-3 h-3 text-purple-400" />
              <span className="text-xs font-semibold">{simulado.total_questions}</span>
              <span className="text-[9px] text-muted-foreground hidden md:inline">questões</span>
            </div>
            
            <div className="w-px h-4 bg-white/10" />
            
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-blue-400" />
              <span className="text-xs font-semibold">{simulado.duration_minutes}</span>
              <span className="text-[9px] text-muted-foreground hidden md:inline">min</span>
            </div>
            
            <div className="w-px h-4 bg-white/10" />
            
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" />
              <span className="text-xs font-bold text-amber-400">+{simulado.total_questions * simulado.points_per_question}</span>
              <span className="text-[9px] text-amber-400/60">XP</span>
            </div>
          </div>

          {/* BOTTOM: Date + CTA */}
          <div className="flex items-center justify-between gap-2">
            {simulado.ends_at ? (
              <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-amber-500" />
                Até {format(new Date(simulado.ends_at), "dd/MM HH:mm", { locale: ptBR })}
              </span>
            ) : (
              <span className="text-[10px] text-muted-foreground/40">Sempre disponível</span>
            )}
            
            {/* CTA BUTTON */}
            <button 
              onClick={(e) => { e.stopPropagation(); onStart(); }}
              className={cn(
                "px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider",
                "transition-all duration-200 flex items-center gap-1.5",
                "text-white hover:scale-105",
                hasRunningAttempt 
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-lg hover:shadow-amber-500/30"
                  : isHardMode
                    ? "bg-gradient-to-r from-red-600 to-orange-500 hover:shadow-lg hover:shadow-red-500/30"
                    : "bg-gradient-to-r from-emerald-500 to-cyan-500 hover:shadow-lg hover:shadow-emerald-500/30"
              )}
            >
              <Play className="w-3.5 h-3.5" />
              <span>{hasRunningAttempt ? "Continuar" : "Iniciar"}</span>
            </button>
          </div>
        </div>

        {/* ✨ CORNER ACCENTS - CSS only */}
        <div className={cn(
          "absolute top-0 left-0 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none",
          isHardMode ? "border-l-2 border-t-2 border-red-500/40 rounded-tl-2xl" : "border-l-2 border-t-2 border-emerald-500/40 rounded-tl-2xl"
        )} />
        <div className={cn(
          "absolute bottom-0 right-0 w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none",
          isHardMode ? "border-r-2 border-b-2 border-red-500/40 rounded-br-2xl" : "border-r-2 border-b-2 border-emerald-500/40 rounded-br-2xl"
        )} />
      </div>
    </div>
  );
});

// ============================================
// 📂 AVAILABLE SIMULADOS GROUPED (Year 2300)
// Organiza simulados em grupos colapsáveis
// ============================================

interface AvailableSimuladosGroupedProps {
  simulados: SimuladoListItem[];
  onSelectSimulado: (id: string) => void;
}

const AvailableSimuladosGrouped = memo(function AvailableSimuladosGrouped({
  simulados,
  onSelectSimulado,
}: AvailableSimuladosGroupedProps) {
  const groups = useMemo(() => classifySimuladosByGroup(simulados), [simulados]);
  const normalSimulados = useMemo(() => simulados.filter(s => !s.is_hard_mode), [simulados]);
  const hardModeSimulados = useMemo(() => simulados.filter(s => s.is_hard_mode), [simulados]);

  const renderCard = useCallback((simulado: SimuladoListItem, index: number) => (
    <SimuladoCard
      key={simulado.id}
      simulado={simulado}
      onStart={() => onSelectSimulado(simulado.id)}
      index={index}
    />
  ), [onSelectSimulado]);

  if (simulados.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Nenhum simulado disponível"
        description="Fique atento, novos simulados serão liberados em breve!"
        accentColor="emerald"
      />
    );
  }

  return (
    <div className="space-y-6">
      {normalSimulados.length > 0 && (
        <div className="space-y-4">
          {groups.NIVELAMENTO?.length > 0 && (
            <SimuladoGroupSection groupId="NIVELAMENTO" simulados={groups.NIVELAMENTO} renderCard={renderCard} />
          )}
          {groups.MESES_EXTENSIVO?.length > 0 && (
            <SimuladoGroupSection groupId="MESES_EXTENSIVO" simulados={groups.MESES_EXTENSIVO} renderCard={renderCard} />
          )}
          {groups.MESES_INTENSIVO?.length > 0 && (
            <SimuladoGroupSection groupId="MESES_INTENSIVO" simulados={groups.MESES_INTENSIVO} renderCard={renderCard} />
          )}
          {(groups.QUIMICA_GERAL?.length > 0 || groups.FISICO_QUIMICA?.length > 0 || groups.QUIMICA_ORGANICA?.length > 0) && (
            <SimuladosBySubjectSection groups={groups} renderCard={renderCard} />
          )}
          {groups.OUTROS?.length > 0 && (
            <SimuladoGroupSection groupId="OUTROS" simulados={groups.OUTROS} renderCard={renderCard} />
          )}
        </div>
      )}

      {hardModeSimulados.length > 0 && (
        <div className="mt-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/20 ring-1 ring-red-500/30">
              <Flame className="w-5 h-5 text-red-400" />
            </div>
            <h2 className="text-xl font-bold text-red-400">Modo Hard</h2>
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
              {hardModeSimulados.length} disponíveis
            </Badge>
          </div>
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            {hardModeSimulados.map((simulado, index) => renderCard(simulado, index))}
          </div>
        </div>
      )}
    </div>
  );
});
// ============================================

interface SimuladoCompletedCardProps {
  simulado: SimuladoListItem;
  onReview: () => void;
  index?: number;
}

const SimuladoCompletedCard = memo(function SimuladoCompletedCard({ simulado, onReview, index = 0 }: SimuladoCompletedCardProps) {
  const attempt = simulado.user_attempt;
  const percentage = attempt 
    ? calculatePercentage(attempt.correct_answers, simulado.total_questions) 
    : 0;
  const passed = percentage >= simulado.passing_score;
  const isGabaritoReleased = simulado.results_released_at 
    ? new Date() >= new Date(simulado.results_released_at)
    : true;

  return (
    <div className="group hover:scale-[1.01] transition-transform duration-200">
      <div className="stat-orb-2300 relative overflow-hidden">
        {/* Status Glow Line */}
        <div className={cn(
          "absolute left-0 top-0 bottom-0 w-1 rounded-l-xl",
          passed 
            ? "bg-gradient-to-b from-emerald-500 to-cyan-500 shadow-[0_0_15px_hsl(160,100%,50%,0.5)]"
            : "bg-gradient-to-b from-amber-500 to-orange-500 shadow-[0_0_15px_hsl(45,100%,50%,0.5)]"
        )} />
        
        <div className="flex flex-col md:flex-row md:items-center gap-6 pl-4">
          {/* Info Section */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {passed ? (
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Aprovado
                </Badge>
              ) : (
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Continue Praticando
                </Badge>
              )}
              {!attempt?.is_scored_for_ranking && (
                <Badge variant="outline" className="border-muted-foreground/30">Retake</Badge>
              )}
            </div>
            
            <h3 className="text-lg font-bold text-foreground mb-2 truncate">{simulado.title}</h3>
            
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Target className="w-4 h-4 text-purple-400" />
                {attempt?.correct_answers}/{simulado.total_questions} acertos
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-amber-400 font-semibold">{attempt?.score || 0} XP</span>
              </span>
            </div>
            
            {/* Data/Hora de Realização */}
            {attempt?.finished_at && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span>Realizado em: <span className="text-cyan-400 font-medium">{format(new Date(attempt.finished_at), "HH:mm dd/MM/yy", { locale: ptBR })}</span></span>
              </div>
            )}
          </div>
          
          {/* Score Circle */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 100 100">
                {/* Background circle */}
                <circle
                  cx="50" cy="50" r="40"
                  fill="none"
                  stroke="hsl(var(--border))"
                  strokeWidth="8"
                />
                {/* Progress circle */}
                <circle
                  cx="50" cy="50" r="40"
                  fill="none"
                  stroke={passed ? "url(#successGradient)" : "url(#warningGradient)"}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${percentage * 2.51} 251`}
                  className="transition-all duration-500"
                />
                <defs>
                  <linearGradient id="successGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgb(16, 185, 129)" />
                    <stop offset="100%" stopColor="rgb(6, 182, 212)" />
                  </linearGradient>
                  <linearGradient id="warningGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgb(245, 158, 11)" />
                    <stop offset="100%" stopColor="rgb(249, 115, 22)" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={cn(
                  "text-xl font-bold",
                  passed ? "text-emerald-400" : "text-amber-400"
                )}>
                  {percentage}%
                </span>
              </div>
            </div>

            <Button 
              variant="outline" 
              onClick={onReview}
              disabled={!isGabaritoReleased}
              className={cn(
                "border-purple-500/50 hover:bg-purple-500/10 hover:border-purple-500 transition-colors",
                !isGabaritoReleased && "opacity-50"
              )}
            >
              <FileText className="w-4 h-4 mr-2" />
              {isGabaritoReleased ? "Ver Gabarito" : "Aguardando"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

// ============================================
// 🔮 SIMULADO UPCOMING CARD (Performance-Optimized)
// ============================================

interface SimuladoUpcomingCardProps {
  simulado: SimuladoListItem;
  index?: number;
}

const SimuladoUpcomingCard = memo(function SimuladoUpcomingCard({ simulado, index = 0 }: SimuladoUpcomingCardProps) {
  const startsAt = simulado.starts_at ? new Date(simulado.starts_at) : null;

  return (
    <div className="group opacity-80 hover:opacity-100 transition-opacity duration-200">
      <div className="stat-orb-2300 h-full flex flex-col relative">
        {/* Lock Overlay */}
        <div className="absolute inset-0 bg-background/20 rounded-xl z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="p-4 rounded-2xl bg-card/80 border border-amber-500/30">
            <Lock className="w-8 h-8 text-amber-500" />
          </div>
        </div>
        
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">
            <Clock className="w-3 h-3 mr-1" />
            Em Breve
          </Badge>
          {simulado.is_hard_mode && (
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 opacity-60">
              <Shield className="w-3 h-3 mr-1" />
              Hard Mode
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="text-lg font-bold text-muted-foreground mb-2">{simulado.title}</h3>
          {simulado.description && (
            <p className="text-sm text-muted-foreground/70 line-clamp-2">
              {simulado.description}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 py-4 border-t border-border/30 mt-4 text-muted-foreground">
          <span className="flex items-center gap-1.5 text-sm">
            <Target className="w-3.5 h-3.5" />
            {simulado.total_questions} questões
          </span>
          <span className="flex items-center gap-1.5 text-sm">
            <Clock className="w-3.5 h-3.5" />
            {simulado.duration_minutes} min
          </span>
        </div>

        {/* Release Date */}
        {startsAt && (
          <div className="flex items-center justify-between pt-3 border-t border-border/30">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/20">
                <Calendar className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-sm text-amber-400">
                {format(startsAt, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
            </div>
            <Button variant="outline" size="sm" disabled className="opacity-50">
              <Lock className="w-3 h-3 mr-1" />
              Aguardar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
});

// ============================================
// 📭 EMPTY STATE (Performance-Optimized)
// ============================================

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  accentColor: "emerald" | "purple" | "amber";
  shouldAnimate?: boolean;
}

const EmptyState = memo(function EmptyState({ icon: Icon, title, description, accentColor, shouldAnimate = true }: EmptyStateProps) {
  const colorMap = {
    emerald: {
      iconBg: "bg-emerald-500/20",
      iconColor: "text-emerald-400",
      glow: "shadow-[0_0_40px_hsl(160,100%,50%,0.2)]"
    },
    purple: {
      iconBg: "bg-purple-500/20",
      iconColor: "text-purple-400",
      glow: "shadow-[0_0_40px_hsl(280,100%,50%,0.2)]"
    },
    amber: {
      iconBg: "bg-amber-500/20",
      iconColor: "text-amber-400",
      glow: "shadow-[0_0_40px_hsl(45,100%,50%,0.2)]"
    }
  };

  const config = colorMap[accentColor];

  return (
    <div className={cn(
      "text-center py-16",
      shouldAnimate && "animate-fade-in"
    )}>
      <div className="stat-orb-2300 max-w-md mx-auto">
        <div className={cn(
          "w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center",
          config.iconBg, 
          config.glow,
          shouldAnimate && "animate-float"
        )}>
          <Icon className={cn("w-10 h-10", config.iconColor)} />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  );
});
