/**
 * 🎯 CENTRAL DO ALUNO — SIMULADOS
 * Constituição SYNAPSE Ω v10.0
 * 
 * Design: Year 2300 Cinematic Experience
 * ⚡ Performance-Optimized via useConstitutionPerformance
 * 📂 Organização por Grupos (v2.0)
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
  
  // ⚡ Performance flags - LEI I
  const { 
    shouldAnimate, 
    shouldBlur, 
    shouldShowParticles, 
    isLowEnd,
    motionProps,
    getBlurClass
  } = useConstitutionPerformance();
  
  // Simulado ativo (do URL ou selecionado)
  const activeSimuladoId = searchParams.get("s");
  const [selectedSimuladoId, setSelectedSimuladoId] = useState<string | null>(activeSimuladoId);
  
  // Buscar simulados reais
  const { data: simuladosData, isLoading, refetch } = useSimuladosList();

  // Estatísticas calculadas
  const stats = useMemo(() => ({
    disponíveis: simuladosData?.available.length || 0,
    realizados: simuladosData?.completed.length || 0,
    emBreve: simuladosData?.upcoming.length || 0,
    total: (simuladosData?.available.length || 0) + 
           (simuladosData?.completed.length || 0) + 
           (simuladosData?.upcoming.length || 0),
  }), [simuladosData]);

  // Handlers
  const handleSelectSimulado = useCallback((id: string) => {
    setSelectedSimuladoId(id);
    setSearchParams({ s: id });
  }, [setSearchParams]);

  const handleCloseSimulado = useCallback(() => {
    setSelectedSimuladoId(null);
    setSearchParams({});
    refetch();
  }, [setSearchParams, refetch]);

  const handleSimuladoComplete = useCallback(() => {
    refetch();
  }, [refetch]);

  // Se há simulado ativo, mostrar player em fullscreen
  if (selectedSimuladoId) {
    return (
      <Dialog open={true} onOpenChange={(open) => !open && handleCloseSimulado()}>
        <DialogContent className="w-[98vw] h-[98vh] max-w-[98vw] p-0 overflow-hidden">
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
    <div className="relative min-h-screen">
      {/* 🌌 Cinematic Background - Conditionally rendered */}
      {shouldShowParticles && <CyberBackground variant="grid" intensity={isLowEnd ? "low" : "medium"} />}
      
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

        {/* ⚡ XP Banner - Performance-Optimized */}
        <div className={cn(
          "relative overflow-hidden rounded-xl",
          shouldAnimate && "animate-fade-in"
        )}>
          <div className="dashboard-hero-2300 p-6">
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
              {/* Icon Container - CSS animation instead of motion */}
              <div className={cn(
                "relative",
                shouldAnimate && "animate-pulse-slow"
              )}>
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 flex items-center justify-center shadow-[0_0_40px_hsl(45,100%,50%,0.4)]">
                  <Zap className="w-10 h-10 text-white" />
                </div>
                {shouldShowParticles && (
                  <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-amber-500/30 to-orange-500/30 blur-xl animate-pulse" />
                )}
              </div>

              {/* Text Content */}
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
                  Ganhe XP e Domine o Ranking!
                </h3>
                <p className="text-cyan-100/80 text-sm md:text-base max-w-xl">
                  Cada questão correta vale pontos de experiência. Complete simulados, 
                  suba de nível e conquiste sua vaga no topo do ranking global!
                </p>
              </div>

              {/* XP Badge - Simplified */}
              <div className="flex flex-col items-center gap-2 hover:scale-105 transition-transform">
                <div className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 shadow-[0_0_30px_hsl(160,100%,50%,0.3)]">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-white" />
                    <span className="text-2xl font-bold text-white">+10 XP</span>
                  </div>
                </div>
                <span className="text-xs text-cyan-200/60 uppercase tracking-wider">por questão</span>
              </div>
            </div>
          </div>
        </div>

        {/* 🗂️ Tabs Navigation - Performance-Optimized */}
        <Tabs value={tab} onValueChange={setTab} className="space-y-6">
          <TabsList className={cn(
            "w-full p-1 border border-border/50 rounded-xl grid grid-cols-3 h-auto",
            getBlurClass("bg-card/50 backdrop-blur-xl", "bg-card/90")
          )}>
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

          {/* Content Areas - Simplified animations */}
          {/* Simulados Disponíveis */}
          <TabsContent value="disponiveis" className="mt-0">
            {simuladosData?.available.length === 0 ? (
              <EmptyState 
                icon={Rocket}
                title="Nenhum simulado disponível"
                description="Novos simulados serão liberados em breve! Fique atento."
                accentColor="emerald"
                shouldAnimate={shouldAnimate}
              />
            ) : (
              <AvailableSimuladosGrouped
                simulados={simuladosData?.available || []}
                onSelectSimulado={handleSelectSimulado}
                shouldAnimate={shouldAnimate}
              />
            )}
          </TabsContent>

          {/* Simulados Realizados */}
          <TabsContent value="realizados" className="mt-0">
            {simuladosData?.completed.length === 0 ? (
              <EmptyState 
                icon={Trophy}
                title="Nenhum simulado realizado"
                description="Complete seu primeiro simulado e veja suas estatísticas aqui!"
                accentColor="purple"
                shouldAnimate={shouldAnimate}
              />
            ) : (
              <div className={cn(
                "grid gap-6 md:grid-cols-2",
                shouldAnimate && "animate-fade-in"
              )}>
                {simuladosData?.completed.map((simulado, index) => (
                  <SimuladoCompletedCard
                    key={simulado.id}
                    simulado={simulado}
                    onReview={() => handleSelectSimulado(simulado.id)}
                    shouldAnimate={shouldAnimate}
                    index={index}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Simulados Em Breve */}
          <TabsContent value="embreve" className="mt-0">
            {simuladosData?.upcoming.length === 0 ? (
              <EmptyState 
                icon={Calendar}
                title="Nenhum simulado programado"
                description="Fique atento! Novos desafios serão anunciados em breve."
                accentColor="amber"
                shouldAnimate={shouldAnimate}
              />
            ) : (
              <div className={cn(
                "grid gap-6 md:grid-cols-2 lg:grid-cols-3",
                shouldAnimate && "animate-fade-in"
              )}>
                {simuladosData?.upcoming.map((simulado, index) => (
                  <SimuladoUpcomingCard
                    key={simulado.id}
                    simulado={simulado}
                    shouldAnimate={shouldAnimate}
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
 * Design máximo: Poster dominante, efeitos cinematográficos, hover épico
 */
const SimuladoCard = memo(function SimuladoCard({ simulado, onStart, shouldAnimate = true, index = 0 }: SimuladoCardProps) {
  const hasRunningAttempt = simulado.user_attempt?.status === "RUNNING";
  const isRetake = simulado.user_attempt && !simulado.user_attempt.is_scored_for_ranking;
  const isHardMode = simulado.is_hard_mode;
  
  // Seleciona capa baseado no modo
  const coverImage = isHardMode ? capaHardMode : capaNormalMode;

  // Cores temáticas
  const themeColors = isHardMode 
    ? { primary: "red", secondary: "orange", glow: "rgba(239,68,68,0.4)" }
    : { primary: "emerald", secondary: "cyan", glow: "rgba(16,185,129,0.4)" };

  return (
    <div 
      className={cn(
        "group transition-all duration-700 ease-out",
        shouldAnimate && "animate-fade-in"
      )}
      style={shouldAnimate ? { animationDelay: `${index * 80}ms` } : undefined}
    >
      {/* 🎬 NETFLIX ULTRA PREMIUM CARD */}
      <div 
        className={cn(
          "relative flex rounded-2xl overflow-hidden cursor-pointer",
          "bg-gradient-to-br from-black/90 via-card/95 to-black/80",
          "border-2 transition-all duration-700 ease-out",
          "hover:scale-[1.03] hover:-translate-y-1",
          isHardMode 
            ? "border-red-500/20 hover:border-red-500/60" 
            : "border-emerald-500/20 hover:border-emerald-500/60",
          // Shadow épica no hover
          "shadow-lg hover:shadow-[0_20px_60px_-15px_var(--glow-color)]"
        )}
        style={{ "--glow-color": themeColors.glow } as React.CSSProperties}
        onClick={onStart}
      >
        {/* 🌟 SCANLINE OVERLAY - Efeito Futurista */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.1)_2px,rgba(255,255,255,0.1)_4px)] z-10" />
        
        {/* 🖼️ POSTER - LADO ESQUERDO (Netflix Movie Poster) */}
        <div className="relative w-32 md:w-44 lg:w-48 flex-shrink-0 overflow-hidden">
          {/* Imagem principal */}
          <img 
            src={coverImage} 
            alt={`Capa ${isHardMode ? 'Hard Mode' : 'Modo Normal'}`}
            className="w-full h-full object-cover object-center transition-all duration-1000 ease-out group-hover:scale-110"
            loading="lazy"
          />
          
          {/* Vignette cinematográfica */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.6)_100%)]" />
          
          {/* Gradient blend para o conteúdo */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/95" />
          
          {/* Glow pulse no hover */}
          <div className={cn(
            "absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-700",
            isHardMode 
              ? "bg-gradient-to-br from-red-500/30 via-transparent to-orange-500/20"
              : "bg-gradient-to-br from-emerald-500/30 via-transparent to-cyan-500/20"
          )} />
          
          {/* Linha de energia na borda */}
          <div className={cn(
            "absolute top-0 bottom-0 right-0 w-[2px] opacity-0 group-hover:opacity-100 transition-all duration-500",
            isHardMode 
              ? "bg-gradient-to-b from-transparent via-red-500 to-transparent shadow-[0_0_10px_rgba(239,68,68,0.8)]"
              : "bg-gradient-to-b from-transparent via-emerald-500 to-transparent shadow-[0_0_10px_rgba(16,185,129,0.8)]"
          )} />
        </div>

        {/* 📋 CONTEÚDO - LADO DIREITO */}
        <div className="flex-1 p-4 md:p-5 lg:p-6 flex flex-col justify-between min-w-0 relative z-20">
          
          {/* TOP: Badges Premium */}
          <div className="flex items-center gap-2 flex-wrap mb-3">
            {hasRunningAttempt && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                <Timer className="w-3 h-3 mr-1.5" />
                Em Andamento
              </span>
            )}
            {simulado.is_hard_mode && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                <Flame className="w-3 h-3 mr-1" />
                Hard
              </span>
            )}
            {simulado.requires_camera && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] md:text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                <Camera className="w-3 h-3 mr-1" />
                Câmera
              </span>
            )}
            {isRetake && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium text-muted-foreground border border-muted-foreground/30">
                Refazer
              </span>
            )}
          </div>

          {/* MIDDLE: Title & Description */}
          <div className="flex-1 min-w-0 mb-3">
            <h3 className={cn(
              "text-lg md:text-xl lg:text-2xl font-black tracking-tight transition-all duration-500 mb-2",
              "bg-clip-text text-transparent",
              isHardMode 
                ? "bg-gradient-to-r from-white via-white to-red-200 group-hover:from-red-400 group-hover:via-orange-300 group-hover:to-white"
                : "bg-gradient-to-r from-white via-white to-emerald-200 group-hover:from-emerald-400 group-hover:via-cyan-300 group-hover:to-white"
            )}>
              {simulado.title}
            </h3>
            {simulado.description && (
              <p className="text-xs md:text-sm text-muted-foreground/80 line-clamp-2 leading-relaxed">
                {simulado.description}
              </p>
            )}
          </div>

          {/* STATS: Holographic HUD Style */}
          <div className={cn(
            "flex items-center gap-4 md:gap-5 py-3 px-3 rounded-lg mb-3",
            "bg-white/[0.03] border border-white/[0.08]",
            "backdrop-blur-sm"
          )}>
            <div className="flex items-center gap-1.5">
              <div className="p-1.5 rounded-md bg-purple-500/20 ring-1 ring-purple-500/30">
                <Target className="w-3 h-3 md:w-3.5 md:h-3.5 text-purple-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs md:text-sm font-bold text-foreground">{simulado.total_questions}</span>
                <span className="text-[9px] text-muted-foreground uppercase tracking-wider">questões</span>
              </div>
            </div>
            
            <div className="w-px h-8 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
            
            <div className="flex items-center gap-1.5">
              <div className="p-1.5 rounded-md bg-blue-500/20 ring-1 ring-blue-500/30">
                <Clock className="w-3 h-3 md:w-3.5 md:h-3.5 text-blue-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs md:text-sm font-bold text-foreground">{simulado.duration_minutes}</span>
                <span className="text-[9px] text-muted-foreground uppercase tracking-wider">minutos</span>
              </div>
            </div>
            
            <div className="w-px h-8 bg-gradient-to-b from-transparent via-white/20 to-transparent" />
            
            <div className="flex items-center gap-1.5">
              <div className="p-1.5 rounded-md bg-amber-500/20 ring-1 ring-amber-500/30">
                <Zap className="w-3 h-3 md:w-3.5 md:h-3.5 text-amber-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs md:text-sm font-bold text-amber-400">+{simulado.total_questions * simulado.points_per_question}</span>
                <span className="text-[9px] text-amber-500/70 uppercase tracking-wider">XP</span>
              </div>
            </div>
          </div>

          {/* BOTTOM: Date + CTA Button */}
          <div className="flex items-center justify-between gap-3">
            {simulado.ends_at ? (
              <span className="text-[10px] md:text-xs text-muted-foreground/70 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Até {format(new Date(simulado.ends_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
              </span>
            ) : (
              <span className="text-[10px] text-muted-foreground/50">Sempre disponível</span>
            )}
            
            {/* CTA BUTTON - Cinematic Style */}
            <button 
              onClick={(e) => { e.stopPropagation(); onStart(); }}
              className={cn(
                "relative px-5 py-2.5 rounded-lg font-bold text-sm uppercase tracking-wider",
                "transition-all duration-500 ease-out",
                "flex items-center gap-2",
                // Gradient background
                hasRunningAttempt 
                  ? "bg-gradient-to-r from-amber-500 to-orange-500"
                  : isHardMode
                    ? "bg-gradient-to-r from-red-600 to-orange-500"
                    : "bg-gradient-to-r from-emerald-500 to-cyan-500",
                // Hover state
                "hover:scale-105 hover:shadow-lg",
                hasRunningAttempt 
                  ? "hover:shadow-amber-500/40"
                  : isHardMode 
                    ? "hover:shadow-red-500/40" 
                    : "hover:shadow-emerald-500/40",
                // Text
                "text-white"
              )}
            >
              {/* Shine effect */}
              <span className="absolute inset-0 overflow-hidden rounded-lg">
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </span>
              
              <Play className="w-4 h-4 relative z-10" />
              <span className="relative z-10">{hasRunningAttempt ? "Continuar" : "Iniciar"}</span>
            </button>
          </div>
        </div>

        {/* ✨ CORNER ACCENTS - Year 2300 */}
        <div className={cn(
          "absolute top-0 left-0 w-12 h-12 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
          isHardMode ? "border-l-2 border-t-2 border-red-500/50" : "border-l-2 border-t-2 border-emerald-500/50"
        )} style={{ borderRadius: "16px 0 0 0" }} />
        <div className={cn(
          "absolute bottom-0 right-0 w-12 h-12 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
          isHardMode ? "border-r-2 border-b-2 border-red-500/50" : "border-r-2 border-b-2 border-emerald-500/50"
        )} style={{ borderRadius: "0 0 16px 0" }} />
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
  shouldAnimate?: boolean;
}

const AvailableSimuladosGrouped = memo(function AvailableSimuladosGrouped({
  simulados,
  onSelectSimulado,
  shouldAnimate = true,
}: AvailableSimuladosGroupedProps) {
  // Classificar simulados em grupos
  const groups = useMemo(() => classifySimuladosByGroup(simulados), [simulados]);

  // Separar simulados normais e hard mode
  const normalSimulados = useMemo(() => 
    simulados.filter(s => !s.is_hard_mode), 
    [simulados]
  );
  
  const hardModeSimulados = useMemo(() => 
    simulados.filter(s => s.is_hard_mode), 
    [simulados]
  );

  // Função para renderizar card de simulado
  const renderCard = useCallback((simulado: SimuladoListItem, index: number) => (
    <SimuladoCard
      key={simulado.id}
      simulado={simulado}
      onStart={() => onSelectSimulado(simulado.id)}
      shouldAnimate={shouldAnimate}
      index={index}
    />
  ), [onSelectSimulado, shouldAnimate]);

  if (simulados.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Nenhum simulado disponível"
        description="Fique atento, novos simulados serão liberados em breve!"
        accentColor="emerald"
        shouldAnimate={shouldAnimate}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* 🎯 GRUPOS DE SIMULADOS NORMAIS */}
      {normalSimulados.length > 0 && (
        <div className="space-y-4">
          {/* Grupo: Nivelamento */}
          {groups.NIVELAMENTO?.length > 0 && (
            <SimuladoGroupSection
              groupId="NIVELAMENTO"
              simulados={groups.NIVELAMENTO}
              renderCard={renderCard}
              shouldAnimate={shouldAnimate}
            />
          )}
          
          {/* Grupo: Meses Extensivo ENEM */}
          {groups.MESES_EXTENSIVO?.length > 0 && (
            <SimuladoGroupSection
              groupId="MESES_EXTENSIVO"
              simulados={groups.MESES_EXTENSIVO}
              renderCard={renderCard}
              shouldAnimate={shouldAnimate}
            />
          )}
          
          {/* Grupo: Intensivo */}
          {groups.MESES_INTENSIVO?.length > 0 && (
            <SimuladoGroupSection
              groupId="MESES_INTENSIVO"
              simulados={groups.MESES_INTENSIVO}
              renderCard={renderCard}
              shouldAnimate={shouldAnimate}
            />
          )}
          
          {/* Grupo Pai: Por Assunto (com subgrupos) */}
          {(groups.QUIMICA_GERAL?.length > 0 || 
            groups.FISICO_QUIMICA?.length > 0 || 
            groups.QUIMICA_ORGANICA?.length > 0) && (
            <SimuladosBySubjectSection
              groups={groups}
              renderCard={renderCard}
              shouldAnimate={shouldAnimate}
            />
          )}
          
          {/* Grupo: Outros */}
          {groups.OUTROS?.length > 0 && (
            <SimuladoGroupSection
              groupId="OUTROS"
              simulados={groups.OUTROS}
              renderCard={renderCard}
              shouldAnimate={shouldAnimate}
            />
          )}
        </div>
      )}

      {/* 🔥 SIMULADOS HARD MODE - Seção Separada com Design Especial */}
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
          <div className="grid gap-4 md:gap-5 grid-cols-1 lg:grid-cols-2">
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
  shouldAnimate?: boolean;
  index?: number;
}

const SimuladoCompletedCard = memo(function SimuladoCompletedCard({ simulado, onReview, shouldAnimate = true, index = 0 }: SimuladoCompletedCardProps) {
  const attempt = simulado.user_attempt;
  const percentage = attempt 
    ? calculatePercentage(attempt.correct_answers, simulado.total_questions) 
    : 0;
  const passed = percentage >= simulado.passing_score;
  const isGabaritoReleased = simulado.results_released_at 
    ? new Date() >= new Date(simulado.results_released_at)
    : true;

  return (
    <div 
      className={cn(
        "group hover:scale-[1.02] transition-transform duration-300",
        shouldAnimate && "animate-fade-in"
      )}
      style={shouldAnimate ? { animationDelay: `${index * 50}ms` } : undefined}
    >
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
  shouldAnimate?: boolean;
  index?: number;
}

const SimuladoUpcomingCard = memo(function SimuladoUpcomingCard({ simulado, shouldAnimate = true, index = 0 }: SimuladoUpcomingCardProps) {
  const startsAt = simulado.starts_at ? new Date(simulado.starts_at) : null;

  return (
    <div 
      className={cn(
        "group opacity-80 hover:opacity-100 transition-opacity",
        shouldAnimate && "animate-fade-in"
      )}
      style={shouldAnimate ? { animationDelay: `${index * 50}ms` } : undefined}
    >
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
