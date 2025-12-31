// ============================================
// 🚀 CENTRAL DO ALUNO — DASHBOARD YEAR 2300
// Cinematic Marvel/Iron Man HUD Experience
// GPU-ONLY CSS Animations • Performance 3500
// ============================================

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, PlayCircle, Trophy, Target, Calendar, 
  Clock, TrendingUp, Star, Zap, Brain, Award, 
  Flame, Rocket, Sparkles, ChevronRight, Atom, Wifi, WifiOff,
  GraduationCap, BarChart3, Lightbulb, Shield, Crown,
  Dna, FlaskConical, Microscope, TestTube, Activity
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuantumReactivity } from "@/hooks/useQuantumReactivity";
import { useRealtimeAlunos } from "@/hooks/useRealtimeCore";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useGamification, getLevelInfo } from "@/hooks/useGamification";
import { cn } from "@/lib/utils";

// ============================================
// TIPOS
// ============================================

interface QuickAction {
  icon: React.ElementType;
  label: string;
  desc: string;
  route: string;
  gradient: string;
  glow: string;
}

// ============================================
// ESTILOS CSS-ONLY YEAR 2300
// ============================================

const heroStyles = `
  .hero-2300 {
    position: relative;
    overflow: hidden;
    background: linear-gradient(135deg, 
      hsl(var(--primary) / 0.15) 0%, 
      hsl(220 60% 8%) 50%, 
      hsl(280 60% 10%) 100%
    );
  }
  
  .hero-2300::before {
    content: '';
    position: absolute;
    inset: 0;
    background: 
      radial-gradient(ellipse 80% 50% at 50% 0%, hsl(var(--primary) / 0.3), transparent 50%),
      radial-gradient(ellipse 60% 40% at 80% 100%, hsl(280 80% 50% / 0.2), transparent 40%);
    pointer-events: none;
  }
  
  .hero-2300::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
    opacity: 0.03;
    pointer-events: none;
  }
  
  .quantum-ring {
    position: absolute;
    border-radius: 50%;
    border: 1px solid hsl(var(--primary) / 0.2);
    animation: quantum-pulse 4s ease-in-out infinite;
  }
  
  @keyframes quantum-pulse {
    0%, 100% { transform: scale(1); opacity: 0.3; }
    50% { transform: scale(1.1); opacity: 0.6; }
  }
  
  .energy-line {
    position: absolute;
    height: 1px;
    background: linear-gradient(90deg, transparent, hsl(var(--primary) / 0.5), transparent);
    animation: energy-flow 3s linear infinite;
  }
  
  @keyframes energy-flow {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  
  .hologram-grid {
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(hsl(var(--primary) / 0.03) 1px, transparent 1px),
      linear-gradient(90deg, hsl(var(--primary) / 0.03) 1px, transparent 1px);
    background-size: 40px 40px;
    mask-image: radial-gradient(ellipse at center, black 30%, transparent 70%);
    animation: hologram-scan 8s linear infinite;
  }
  
  @keyframes hologram-scan {
    0% { background-position: 0 0; }
    100% { background-position: 40px 40px; }
  }
  
  .stat-orb {
    position: relative;
    background: linear-gradient(145deg, hsl(var(--card) / 0.8), hsl(var(--card) / 0.4));
    backdrop-filter: blur(20px);
    border: 1px solid hsl(var(--primary) / 0.2);
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .stat-orb:hover {
    transform: translateY(-4px) scale(1.02);
    border-color: hsl(var(--primary) / 0.5);
    box-shadow: 
      0 20px 40px -15px hsl(var(--primary) / 0.3),
      0 0 20px hsl(var(--primary) / 0.1);
  }
  
  .stat-orb::before {
    content: '';
    position: absolute;
    inset: -1px;
    border-radius: inherit;
    padding: 1px;
    background: linear-gradient(135deg, hsl(var(--primary) / 0.3), transparent 50%);
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: xor;
    -webkit-mask-composite: xor;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.4s;
  }
  
  .stat-orb:hover::before {
    opacity: 1;
  }
  
  .xp-bar-container {
    position: relative;
    height: 12px;
    background: hsl(var(--muted) / 0.5);
    border-radius: 9999px;
    overflow: hidden;
  }
  
  .xp-bar-fill {
    height: 100%;
    border-radius: 9999px;
    background: linear-gradient(90deg, 
      hsl(var(--primary)), 
      hsl(280 80% 60%), 
      hsl(var(--primary))
    );
    background-size: 200% 100%;
    animation: xp-shimmer 2s linear infinite;
    transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  @keyframes xp-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  
  .level-badge {
    position: relative;
    background: linear-gradient(135deg, hsl(45 100% 50%), hsl(35 100% 45%));
    animation: level-glow 2s ease-in-out infinite;
  }
  
  @keyframes level-glow {
    0%, 100% { box-shadow: 0 0 20px hsl(45 100% 50% / 0.3); }
    50% { box-shadow: 0 0 30px hsl(45 100% 50% / 0.5); }
  }
  
  .streak-flame {
    animation: flame-dance 0.5s ease-in-out infinite alternate;
  }
  
  @keyframes flame-dance {
    0% { transform: scale(1) rotate(-3deg); }
    100% { transform: scale(1.1) rotate(3deg); }
  }
  
  .floating-particle {
    position: absolute;
    width: 4px;
    height: 4px;
    background: hsl(var(--primary));
    border-radius: 50%;
    animation: float-up 6s ease-in-out infinite;
  }
  
  @keyframes float-up {
    0%, 100% { transform: translateY(0) scale(0); opacity: 0; }
    10% { opacity: 1; transform: scale(1); }
    90% { opacity: 1; }
    100% { transform: translateY(-200px) scale(0); opacity: 0; }
  }
  
  .neural-card {
    position: relative;
    overflow: hidden;
    background: hsl(var(--card) / 0.6);
    backdrop-filter: blur(16px);
    border: 1px solid hsl(var(--border) / 0.5);
    transition: all 0.3s ease;
  }
  
  .neural-card:hover {
    border-color: hsl(var(--primary) / 0.3);
    box-shadow: 0 8px 32px hsl(var(--primary) / 0.1);
  }
  
  .neural-card::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, hsl(var(--primary) / 0.05), transparent);
    animation: card-scan 4s ease-in-out infinite;
  }
  
  @keyframes card-scan {
    0%, 100% { left: -100%; }
    50% { left: 100%; }
  }
  
  .action-tile {
    position: relative;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .action-tile:hover {
    transform: translateY(-4px);
  }
  
  .action-tile::before {
    content: '';
    position: absolute;
    inset: 0;
    opacity: 0;
    transition: opacity 0.3s;
  }
  
  .action-tile:hover::before {
    opacity: 1;
  }
`;

export default function AlunoDashboard() {
  const navigate = useNavigate();
  const { shouldAnimate } = useQuantumReactivity();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // ============================================
  // DADOS REAIS VIA HOOKS
  // ============================================
  
  const { gamification, userBadges, isLoading: gamificationLoading } = useGamification();
  
  // Buscar perfil do usuário
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('nome, avatar_url')
        .eq('id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
    staleTime: 300000,
  });
  
  // Calcular nível real
  const levelInfo = useMemo(() => {
    const totalXP = gamification?.total_xp || 0;
    return getLevelInfo(totalXP);
  }, [gamification]);
  
  // Estatísticas do usuário
  const { data: userStats } = useQuery({
    queryKey: ['student-dashboard-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      // Buscar estatísticas de questões
      const { data: attempts } = await supabase
        .from('question_attempts')
        .select('is_correct')
        .eq('user_id', user.id);
      
      // Buscar progresso de aulas
      const { data: lessonProgress } = await supabase
        .from('lesson_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('completed', true);
      
      // Buscar flashcards revisados
      const { data: flashcards } = await supabase
        .from('study_flashcards')
        .select('id')
        .eq('user_id', user.id);
      
      const totalAttempts = attempts?.length || 0;
      const correctAttempts = attempts?.filter(a => a.is_correct)?.length || 0;
      const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;
      
      return {
        questoesResolvidas: totalAttempts,
        acertos: accuracy,
        aulasCompletas: lessonProgress?.length || 0,
        flashcardsRevisados: flashcards?.length || 0,
      };
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });
  
  // Ranking do usuário
  const { data: rankingData } = useQuery({
    queryKey: ['user-ranking-position', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data } = await supabase
        .from('user_gamification')
        .select('user_id, total_xp')
        .order('total_xp', { ascending: false });
      
      if (!data) return { position: 0, total: 0 };
      
      const position = data.findIndex(u => u.user_id === user.id) + 1;
      return { position: position || 0, total: data.length };
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });
  
  // ============================================
  // REALTIME SUBSCRIPTIONS
  // ============================================
  
  const { isConnected, state: realtimeState } = useRealtimeAlunos([
    {
      table: 'user_gamification',
      event: '*',
      onEvent: () => {
        queryClient.invalidateQueries({ queryKey: ['user-gamification'] });
        queryClient.invalidateQueries({ queryKey: ['student-dashboard-stats'] });
      },
    },
    {
      table: 'lesson_progress',
      event: '*',
      onEvent: () => {
        queryClient.invalidateQueries({ queryKey: ['student-dashboard-stats'] });
      },
    },
    {
      table: 'question_attempts',
      event: '*',
      onEvent: () => {
        queryClient.invalidateQueries({ queryKey: ['student-dashboard-stats'] });
      },
    },
  ]);

  const lastSyncTime = realtimeState.lastEventAt 
    ? realtimeState.lastEventAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : null;
  
  // ============================================
  // QUICK ACTIONS
  // ============================================
  
  const quickActions: QuickAction[] = [
    { 
      icon: Brain, 
      label: "Banco de Questões", 
      desc: `${userStats?.questoesResolvidas || 0} resolvidas`,
      route: "/alunos/questoes", 
      gradient: "from-purple-500/20 via-fuchsia-500/10 to-pink-500/20",
      glow: "group-hover:shadow-[0_0_30px_hsl(280_80%_50%/0.3)]"
    },
    { 
      icon: PlayCircle, 
      label: "Videoaulas", 
      desc: `${userStats?.aulasCompletas || 0} completadas`,
      route: "/alunos/videoaulas", 
      gradient: "from-blue-500/20 via-cyan-500/10 to-teal-500/20",
      glow: "group-hover:shadow-[0_0_30px_hsl(200_80%_50%/0.3)]"
    },
    { 
      icon: BookOpen, 
      label: "Livro Digital", 
      desc: "Acesso completo",
      route: "/alunos/livro-web", 
      gradient: "from-emerald-500/20 via-green-500/10 to-lime-500/20",
      glow: "group-hover:shadow-[0_0_30px_hsl(140_80%_50%/0.3)]"
    },
    { 
      icon: Target, 
      label: "Simulados", 
      desc: "Prepare-se",
      route: "/alunos/simulados", 
      gradient: "from-amber-500/20 via-orange-500/10 to-red-500/20",
      glow: "group-hover:shadow-[0_0_30px_hsl(30_80%_50%/0.3)]"
    },
    { 
      icon: Lightbulb, 
      label: "Flashcards", 
      desc: `${userStats?.flashcardsRevisados || 0} cards`,
      route: "/alunos/flashcards", 
      gradient: "from-yellow-500/20 via-amber-500/10 to-orange-500/20",
      glow: "group-hover:shadow-[0_0_30px_hsl(45_80%_50%/0.3)]"
    },
    { 
      icon: Microscope, 
      label: "Tutoria IA", 
      desc: "TRAMON",
      route: "/alunos/tutoria", 
      gradient: "from-indigo-500/20 via-violet-500/10 to-purple-500/20",
      glow: "group-hover:shadow-[0_0_30px_hsl(260_80%_50%/0.3)]"
    },
  ];

  const userName = userProfile?.nome?.split(' ')[0] || 'Estudante';
  
  // Performance level check
  const isLowPerformance = typeof navigator !== 'undefined' && navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;

  return (
    <>
      <style>{heroStyles}</style>
      
      <div className="min-h-screen">
        {/* ============================================ */}
        {/* HERO SECTION — IRON MAN HUD STYLE */}
        {/* ============================================ */}
        <section className="hero-2300 relative rounded-3xl mx-4 md:mx-6 mt-4 p-6 md:p-10 overflow-hidden">
          {/* Quantum Rings */}
          <div className="quantum-ring w-[300px] h-[300px] -top-20 -right-20" style={{ animationDelay: '0s' }} />
          <div className="quantum-ring w-[200px] h-[200px] -bottom-10 -left-10" style={{ animationDelay: '1s' }} />
          <div className="quantum-ring w-[150px] h-[150px] top-1/2 left-1/3" style={{ animationDelay: '2s' }} />
          
          {/* Hologram Grid */}
          <div className="hologram-grid" />
          
          {/* Energy Lines */}
          <div className="energy-line w-[60%] top-[20%] left-0" style={{ animationDelay: '0s' }} />
          <div className="energy-line w-[40%] top-[60%] right-0" style={{ animationDelay: '1.5s' }} />
          
          {/* Floating Particles - Only on capable devices */}
          {shouldAnimate && !isLowPerformance && (
            <>
              <div className="floating-particle left-[10%] bottom-0" style={{ animationDelay: '0s' }} />
              <div className="floating-particle left-[30%] bottom-0" style={{ animationDelay: '1s' }} />
              <div className="floating-particle left-[50%] bottom-0" style={{ animationDelay: '2s' }} />
              <div className="floating-particle left-[70%] bottom-0" style={{ animationDelay: '3s' }} />
              <div className="floating-particle left-[90%] bottom-0" style={{ animationDelay: '4s' }} />
            </>
          )}
          
          {/* Content */}
          <div className="relative z-10">
            {/* Top Bar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                    <Atom className="w-6 h-6 text-white animate-[spin_8s_linear_infinite]" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full level-badge flex items-center justify-center">
                    <span className="text-[10px] font-black text-black">{levelInfo.level}</span>
                  </div>
                </div>
                <div>
                  <Badge className="bg-primary/20 text-primary border-primary/30 gap-1.5">
                    <Crown className="w-3 h-3" />
                    {levelInfo.title}
                  </Badge>
                </div>
              </div>
              
              {/* Sync Indicator */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-black/20 backdrop-blur-sm rounded-full px-3 py-1.5">
                {isConnected ? (
                  <Wifi className="h-3 w-3 text-emerald-400 animate-pulse" />
                ) : (
                  <WifiOff className="h-3 w-3 text-destructive" />
                )}
                <span className="hidden sm:inline">
                  {isConnected ? (lastSyncTime ? `Sync ${lastSyncTime}` : 'Live') : 'Offline'}
                </span>
              </div>
            </div>
            
            {/* Main Hero Content */}
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              {/* Left - Greeting */}
              <div className="space-y-4">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight">
                  Olá, <span className="bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent">{userName}</span>! 
                  <span className="inline-block ml-2 animate-[wave_1.5s_ease-in-out_infinite]">👋</span>
                </h1>
                <p className="text-white/70 text-lg max-w-md">
                  A Química é a ciência das transformações. Continue evoluindo e conquiste seus objetivos!
                </p>
                
                {/* XP Progress */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/70 flex items-center gap-2">
                      <Rocket className="w-4 h-4 text-primary" />
                      Progresso para Nível {levelInfo.level + 1}
                    </span>
                    <span className="text-white font-bold">
                      {gamification?.total_xp?.toLocaleString() || 0} / {levelInfo.nextLevelXP?.toLocaleString()} XP
                    </span>
                  </div>
                  <div className="xp-bar-container">
                    <div 
                      className="xp-bar-fill" 
                      style={{ width: `${levelInfo.progressPercentage}%` }} 
                    />
                  </div>
                </div>
              </div>
              
              {/* Right - Stats Orbs */}
              <div className="grid grid-cols-2 gap-4">
                {/* XP Total */}
                <div className="stat-orb rounded-2xl p-5 cursor-pointer" onClick={() => navigate('/alunos/conquistas')}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400/20 to-amber-500/20 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-yellow-400" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">XP Total</span>
                  </div>
                  <p className="text-3xl font-black text-white">
                    {gamification?.total_xp?.toLocaleString() || 0}
                  </p>
                </div>
                
                {/* Streak */}
                <div className="stat-orb rounded-2xl p-5 cursor-pointer" onClick={() => navigate('/alunos/conquistas')}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400/20 to-red-500/20 flex items-center justify-center">
                      <Flame className="w-5 h-5 text-orange-400 streak-flame" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Streak</span>
                  </div>
                  <p className="text-3xl font-black text-white">
                    {gamification?.current_streak || 0} <span className="text-lg text-muted-foreground">dias</span>
                  </p>
                </div>
                
                {/* Ranking */}
                <div className="stat-orb rounded-2xl p-5 cursor-pointer" onClick={() => navigate('/alunos/ranking')}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400/20 to-pink-500/20 flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-purple-400" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ranking</span>
                  </div>
                  <p className="text-3xl font-black text-white">
                    #{rankingData?.position || '—'}
                  </p>
                </div>
                
                {/* Badges */}
                <div className="stat-orb rounded-2xl p-5 cursor-pointer" onClick={() => navigate('/alunos/conquistas')}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400/20 to-teal-500/20 flex items-center justify-center">
                      <Award className="w-5 h-5 text-emerald-400" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Conquistas</span>
                  </div>
                  <p className="text-3xl font-black text-white">
                    {userBadges?.length || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* ============================================ */}
        {/* QUICK ACTIONS GRID */}
        {/* ============================================ */}
        <section className="px-4 md:px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Acesso Rápido
            </h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {quickActions.map((action, index) => (
              <div
                key={action.label}
                className={cn(
                  "action-tile group cursor-pointer rounded-2xl p-4",
                  "bg-gradient-to-br border border-border/50",
                  action.gradient,
                  action.glow,
                  "transition-all duration-300"
                )}
                onClick={() => navigate(action.route)}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-background/50 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                    <action.icon className="w-6 h-6 text-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{action.label}</p>
                    <p className="text-xs text-muted-foreground">{action.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        
        {/* ============================================ */}
        {/* STATS CARDS */}
        {/* ============================================ */}
        <section className="px-4 md:px-6 pb-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Questões Resolvidas */}
            <Card 
              className="neural-card cursor-pointer group"
              onClick={() => navigate('/alunos/questoes')}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/10 flex items-center justify-center">
                    <Brain className="w-6 h-6 text-purple-400" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-3xl font-black">{userStats?.questoesResolvidas || 0}</p>
                <p className="text-sm text-muted-foreground">Questões resolvidas</p>
                {(userStats?.acertos || 0) > 0 && (
                  <div className="flex items-center gap-1 mt-2">
                    <Activity className="w-3 h-3 text-emerald-400" />
                    <span className="text-xs text-emerald-400">{userStats?.acertos}% de acertos</span>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Aulas Completadas */}
            <Card 
              className="neural-card cursor-pointer group"
              onClick={() => navigate('/alunos/videoaulas')}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/10 flex items-center justify-center">
                    <PlayCircle className="w-6 h-6 text-blue-400" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-3xl font-black">{gamification?.lessons_completed || 0}</p>
                <p className="text-sm text-muted-foreground">Aulas completadas</p>
              </CardContent>
            </Card>
            
            {/* Flashcards */}
            <Card 
              className="neural-card cursor-pointer group"
              onClick={() => navigate('/alunos/flashcards')}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/10 flex items-center justify-center">
                    <Lightbulb className="w-6 h-6 text-amber-400" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-3xl font-black">{userStats?.flashcardsRevisados || 0}</p>
                <p className="text-sm text-muted-foreground">Flashcards revisados</p>
              </CardContent>
            </Card>
            
            {/* Cursos */}
            <Card 
              className="neural-card cursor-pointer group"
              onClick={() => navigate('/alunos/cursos')}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/10 flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-emerald-400" />
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-3xl font-black">{gamification?.courses_completed || 0}</p>
                <p className="text-sm text-muted-foreground">Cursos em andamento</p>
              </CardContent>
            </Card>
          </div>
        </section>
        
        {/* ============================================ */}
        {/* CONTINUE STUDYING + ACHIEVEMENTS */}
        {/* ============================================ */}
        <section className="px-4 md:px-6 pb-8">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Continue de onde parou */}
            <div className="lg:col-span-2">
              <Card className="neural-card h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <div className="p-2 rounded-xl bg-primary/20">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    Continue de onde parou
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { titulo: "Estequiometria - Cálculos", modulo: "Química Geral", progresso: 75, duracao: "45 min", icon: FlaskConical, color: "text-blue-400" },
                    { titulo: "Reações Redox", modulo: "Eletroquímica", progresso: 0, duracao: "52 min", icon: Zap, color: "text-yellow-400" },
                    { titulo: "Funções Orgânicas", modulo: "Química Orgânica", progresso: 0, duracao: "38 min", icon: Dna, color: "text-purple-400" },
                  ].map((aula, index) => (
                    <div 
                      key={index} 
                      className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-all duration-300 cursor-pointer group"
                      onClick={() => navigate('/alunos/videoaulas')}
                    >
                      <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center",
                        "bg-gradient-to-br from-muted to-muted/50"
                      )}>
                        <aula.icon className={cn("w-6 h-6", aula.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">{aula.titulo}</h4>
                        <p className="text-sm text-muted-foreground">{aula.modulo}</p>
                        {aula.progresso > 0 && (
                          <Progress value={aula.progresso} className="h-1.5 mt-2" />
                        )}
                      </div>
                      <div className="text-right">
                        <Badge variant={aula.progresso > 0 ? "default" : "secondary"} className="font-medium">
                          {aula.progresso > 0 ? `${aula.progresso}%` : "Novo"}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 justify-end">
                          <Clock className="w-3 h-3" />
                          {aula.duracao}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  ))}
                  <Button 
                    className="w-full mt-2 gap-2" 
                    variant="outline"
                    onClick={() => navigate('/alunos/videoaulas')}
                  >
                    <PlayCircle className="w-4 h-4" />
                    Ver todas as aulas
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            {/* Conquistas Recentes */}
            <div>
              <Card className="neural-card h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <div className="p-2 rounded-xl bg-amber-500/20">
                      <Award className="w-5 h-5 text-amber-400" />
                    </div>
                    Conquistas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(userBadges && userBadges.length > 0) ? (
                    userBadges.slice(0, 3).map((ub: any, index: number) => (
                      <div 
                        key={ub.id || index} 
                        className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 to-yellow-500/5 border border-amber-500/20"
                      >
                        <div className="text-3xl">{ub.badge?.icon || '🏆'}</div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{ub.badge?.name || 'Conquista'}</p>
                          <p className="text-xs text-muted-foreground">{ub.badge?.description || ''}</p>
                        </div>
                        <Badge variant="outline" className="text-amber-400 border-amber-400/50 text-xs">
                          +{ub.badge?.xp_reward || 0} XP
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">Continue estudando para desbloquear conquistas!</p>
                    </div>
                  )}
                  <Button 
                    variant="outline" 
                    className="w-full mt-2 gap-2"
                    onClick={() => navigate('/alunos/conquistas')}
                  >
                    <Trophy className="w-4 h-4" />
                    Ver todas as conquistas
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
