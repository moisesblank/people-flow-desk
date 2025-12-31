// ============================================
// 🚀 CENTRAL DO ALUNO — YEAR 2300 ULTIMATE
// Cinematic Marvel/Iron Man HUD Experience
// GPU-ONLY CSS Animations • Performance 3500
// A MELHOR EXPERIÊNCIA DA VIDA DO ALUNO
// ============================================

import { useMemo, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  BookOpen, PlayCircle, Trophy, Target, Calendar, 
  Clock, TrendingUp, Star, Zap, Brain, Award, 
  Flame, Rocket, Sparkles, ChevronRight, Atom, Wifi, WifiOff,
  GraduationCap, BarChart3, Lightbulb, Shield, Crown,
  Dna, FlaskConical, Microscope, TestTube, Activity,
  Hexagon, Eye, Layers, Radio, Gauge, ArrowUpRight,
  CircleDot, Orbit, Scan, Timer, Medal, AlertCircle
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
  iconGradient: string;
  count?: number;
  priority?: 'urgent' | 'high' | 'normal';
}

// ============================================
// ESTILOS CSS-ONLY YEAR 2300 ULTIMATE
// ============================================

const heroStyles2300 = `
  /* ═══════════════════════════════════════════
     HERO SECTION — IRON MAN HUD ULTIMATE
     ═══════════════════════════════════════════ */
  .hero-2300-ultimate {
    position: relative;
    overflow: hidden;
    background: 
      radial-gradient(ellipse 120% 80% at 50% -20%, hsl(var(--primary) / 0.25) 0%, transparent 50%),
      radial-gradient(ellipse 80% 60% at 100% 100%, hsl(280 80% 50% / 0.15) 0%, transparent 40%),
      radial-gradient(ellipse 60% 40% at 0% 50%, hsl(var(--holo-cyan) / 0.1) 0%, transparent 30%),
      linear-gradient(180deg, hsl(var(--background)) 0%, hsl(225 50% 6%) 100%);
  }
  
  .hero-2300-ultimate::before {
    content: '';
    position: absolute;
    inset: 0;
    background: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    opacity: 0.025;
    pointer-events: none;
    mix-blend-mode: overlay;
  }
  
  /* Holographic Grid */
  .holo-grid {
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(hsl(var(--primary) / 0.04) 1px, transparent 1px),
      linear-gradient(90deg, hsl(var(--primary) / 0.04) 1px, transparent 1px);
    background-size: 50px 50px;
    mask-image: radial-gradient(ellipse 80% 60% at center, black 20%, transparent 70%);
    animation: grid-drift 20s linear infinite;
  }
  
  @keyframes grid-drift {
    0% { background-position: 0 0; }
    100% { background-position: 50px 50px; }
  }
  
  /* DNA Helix Animation */
  .dna-helix {
    position: absolute;
    width: 60px;
    height: 100%;
    right: 10%;
    top: 0;
    opacity: 0.15;
    overflow: hidden;
  }
  
  .dna-strand {
    position: absolute;
    width: 100%;
    height: 20px;
    animation: dna-wave 3s ease-in-out infinite;
  }
  
  @keyframes dna-wave {
    0%, 100% { transform: translateX(-10px) scaleX(0.8); }
    50% { transform: translateX(10px) scaleX(1.2); }
  }
  
  /* Quantum Rings */
  .quantum-ring-2300 {
    position: absolute;
    border-radius: 50%;
    border: 1px solid hsl(var(--primary) / 0.15);
    box-shadow: 
      0 0 30px hsl(var(--primary) / 0.05),
      inset 0 0 30px hsl(var(--primary) / 0.02);
    animation: quantum-breathe 6s ease-in-out infinite;
  }
  
  @keyframes quantum-breathe {
    0%, 100% { transform: scale(1) rotate(0deg); opacity: 0.3; }
    50% { transform: scale(1.08) rotate(5deg); opacity: 0.6; }
  }
  
  /* Orbital Particles */
  .orbital-particle {
    position: absolute;
    width: 6px;
    height: 6px;
    background: hsl(var(--primary));
    border-radius: 50%;
    box-shadow: 0 0 20px hsl(var(--primary) / 0.8), 0 0 40px hsl(var(--primary) / 0.4);
    animation: orbit-path 8s linear infinite;
  }
  
  @keyframes orbit-path {
    0% { transform: rotate(0deg) translateX(80px) rotate(0deg); }
    100% { transform: rotate(360deg) translateX(80px) rotate(-360deg); }
  }
  
  /* Energy Lines Horizontal */
  .energy-beam {
    position: absolute;
    height: 1px;
    background: linear-gradient(90deg, transparent 0%, hsl(var(--primary) / 0.6) 20%, hsl(var(--primary)) 50%, hsl(var(--primary) / 0.6) 80%, transparent 100%);
    animation: beam-travel 4s ease-in-out infinite;
    filter: drop-shadow(0 0 4px hsl(var(--primary)));
  }
  
  @keyframes beam-travel {
    0% { transform: translateX(-100%) scaleX(0.5); opacity: 0; }
    50% { opacity: 1; scaleX(1); }
    100% { transform: translateX(200%) scaleX(0.5); opacity: 0; }
  }
  
  /* Floating Particles */
  .float-particle {
    position: absolute;
    width: 3px;
    height: 3px;
    background: hsl(var(--primary));
    border-radius: 50%;
    box-shadow: 0 0 10px hsl(var(--primary)), 0 0 20px hsl(var(--primary) / 0.5);
    animation: particle-rise 8s ease-out infinite;
  }
  
  @keyframes particle-rise {
    0% { transform: translateY(0) scale(0); opacity: 0; }
    10% { opacity: 1; transform: scale(1); }
    90% { opacity: 0.8; }
    100% { transform: translateY(-250px) scale(0.3); opacity: 0; }
  }
  
  /* Scan Line Effect */
  .scan-line {
    position: absolute;
    left: 0;
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg, transparent, hsl(var(--holo-cyan) / 0.5), transparent);
    animation: scan-vertical 4s ease-in-out infinite;
    box-shadow: 0 0 20px hsl(var(--holo-cyan) / 0.3);
  }
  
  @keyframes scan-vertical {
    0%, 100% { top: 0; opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { top: 100%; opacity: 0; }
  }
  
  /* ═══════════════════════════════════════════
     STAT ORBS — HOLOGRAPHIC PREMIUM
     ═══════════════════════════════════════════ */
  .stat-orb-2300 {
    position: relative;
    background: linear-gradient(145deg, 
      hsl(var(--card) / 0.9) 0%,
      hsl(var(--card) / 0.6) 50%,
      hsl(var(--card) / 0.4) 100%
    );
    backdrop-filter: blur(20px);
    border: 1px solid hsl(var(--primary) / 0.15);
    overflow: hidden;
    transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1);
  }
  
  .stat-orb-2300::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, hsl(var(--primary) / 0.1) 0%, transparent 50%);
    opacity: 0;
    transition: opacity 0.5s;
  }
  
  .stat-orb-2300::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 200%;
    height: 100%;
    background: linear-gradient(90deg, transparent, hsl(var(--primary) / 0.08), transparent);
    animation: orb-scan 6s ease-in-out infinite;
  }
  
  @keyframes orb-scan {
    0%, 100% { left: -100%; }
    50% { left: 100%; }
  }
  
  .stat-orb-2300:hover {
    transform: translateY(-6px) scale(1.02);
    border-color: hsl(var(--primary) / 0.4);
    box-shadow: 
      0 25px 50px -15px hsl(var(--primary) / 0.25),
      0 0 30px hsl(var(--primary) / 0.1),
      inset 0 1px 0 hsl(var(--primary) / 0.1);
  }
  
  .stat-orb-2300:hover::before {
    opacity: 1;
  }
  
  /* ═══════════════════════════════════════════
     XP BAR — PLASMA FLOW
     ═══════════════════════════════════════════ */
  .xp-bar-plasma {
    position: relative;
    height: 14px;
    background: hsl(var(--muted) / 0.4);
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid hsl(var(--border) / 0.3);
  }
  
  .xp-bar-fill-plasma {
    height: 100%;
    border-radius: 10px;
    background: linear-gradient(90deg, 
      hsl(var(--primary)) 0%,
      hsl(320 90% 55%) 30%,
      hsl(280 90% 60%) 60%,
      hsl(var(--primary)) 100%
    );
    background-size: 300% 100%;
    animation: plasma-flow 3s linear infinite;
    transition: width 1.5s cubic-bezier(0.23, 1, 0.32, 1);
    box-shadow: 0 0 20px hsl(var(--primary) / 0.5);
  }
  
  @keyframes plasma-flow {
    0% { background-position: 300% 0; }
    100% { background-position: -300% 0; }
  }
  
  .xp-bar-plasma::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 50%;
    background: linear-gradient(180deg, hsl(0 0% 100% / 0.15), transparent);
    border-radius: 10px 10px 0 0;
    pointer-events: none;
  }
  
  /* ═══════════════════════════════════════════
     LEVEL BADGE — GOLDEN AURA
     ═══════════════════════════════════════════ */
  .level-badge-2300 {
    position: relative;
    background: linear-gradient(145deg, hsl(43 100% 55%), hsl(38 100% 45%));
    box-shadow: 
      0 0 25px hsl(43 100% 50% / 0.4),
      inset 0 1px 0 hsl(43 100% 70% / 0.5);
    animation: crown-pulse 2.5s ease-in-out infinite;
  }
  
  @keyframes crown-pulse {
    0%, 100% { box-shadow: 0 0 25px hsl(43 100% 50% / 0.4); }
    50% { box-shadow: 0 0 40px hsl(43 100% 50% / 0.6), 0 0 60px hsl(43 100% 50% / 0.2); }
  }
  
  /* ═══════════════════════════════════════════
     STREAK FLAME — FIRE DANCE
     ═══════════════════════════════════════════ */
  .streak-fire {
    animation: fire-flicker 0.4s ease-in-out infinite alternate;
    filter: drop-shadow(0 0 8px hsl(25 100% 50% / 0.6));
  }
  
  @keyframes fire-flicker {
    0% { transform: scale(1) rotate(-4deg); }
    100% { transform: scale(1.15) rotate(4deg); }
  }
  
  /* ═══════════════════════════════════════════
     ACTION TILES — NEURAL INTERACTION
     ═══════════════════════════════════════════ */
  .action-tile-2300 {
    position: relative;
    overflow: hidden;
    background: hsl(var(--card) / 0.5);
    backdrop-filter: blur(12px);
    border: 1px solid hsl(var(--border) / 0.4);
    transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
  }
  
  .action-tile-2300::before {
    content: '';
    position: absolute;
    inset: 0;
    opacity: 0;
    transition: opacity 0.4s;
  }
  
  .action-tile-2300::after {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    border-radius: inherit;
    background: linear-gradient(135deg, hsl(var(--primary) / 0.3), transparent 40%);
    opacity: 0;
    transition: opacity 0.4s;
    z-index: -1;
  }
  
  .action-tile-2300:hover {
    transform: translateY(-6px) scale(1.01);
    border-color: hsl(var(--primary) / 0.3);
    box-shadow: 
      0 20px 40px -15px hsl(var(--primary) / 0.2),
      0 0 0 1px hsl(var(--primary) / 0.1);
  }
  
  .action-tile-2300:hover::before {
    opacity: 0.6;
  }
  
  .action-tile-2300:hover::after {
    opacity: 1;
  }
  
  .action-tile-2300 .icon-container {
    transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
  }
  
  .action-tile-2300:hover .icon-container {
    transform: scale(1.1) rotate(-3deg);
    box-shadow: 0 10px 30px -10px currentColor;
  }
  
  /* ═══════════════════════════════════════════
     NEURAL CARDS — SCAN EFFECT
     ═══════════════════════════════════════════ */
  .neural-card-2300 {
    position: relative;
    overflow: hidden;
    background: hsl(var(--card) / 0.7);
    backdrop-filter: blur(16px);
    border: 1px solid hsl(var(--border) / 0.5);
    transition: all 0.4s ease;
  }
  
  .neural-card-2300::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, hsl(var(--primary) / 0.06), transparent);
    animation: neural-scan 5s ease-in-out infinite;
  }
  
  @keyframes neural-scan {
    0%, 100% { left: -100%; }
    50% { left: 100%; }
  }
  
  .neural-card-2300:hover {
    border-color: hsl(var(--primary) / 0.3);
    box-shadow: 
      0 15px 40px hsl(var(--primary) / 0.1),
      inset 0 1px 0 hsl(var(--primary) / 0.1);
    transform: translateY(-2px);
  }
  
  /* ═══════════════════════════════════════════
     PROGRESS ITEMS — GLOW EFFECT
     ═══════════════════════════════════════════ */
  .progress-item-2300 {
    position: relative;
    transition: all 0.3s ease;
  }
  
  .progress-item-2300:hover {
    background: hsl(var(--muted) / 0.6);
    transform: translateX(4px);
  }
  
  .progress-item-2300::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 0;
    background: hsl(var(--primary));
    border-radius: 2px;
    transition: height 0.3s;
  }
  
  .progress-item-2300:hover::before {
    height: 60%;
  }
`;

export default function AlunoDashboard() {
  const navigate = useNavigate();
  const { shouldAnimate } = useQuantumReactivity();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // State para efeitos dinâmicos
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
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
      
      const [attemptsRes, lessonRes, flashcardsRes] = await Promise.all([
        supabase
          .from('question_attempts')
          .select('is_correct')
          .eq('user_id', user.id),
        supabase
          .from('lesson_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('completed', true),
        supabase
          .from('study_flashcards')
          .select('id')
          .eq('user_id', user.id),
      ]);
      
      const attempts = attemptsRes.data || [];
      const totalAttempts = attempts.length;
      const correctAttempts = attempts.filter(a => a.is_correct).length;
      const accuracy = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;
      
      return {
        questoesResolvidas: totalAttempts,
        acertos: accuracy,
        aulasCompletas: lessonRes.data?.length || 0,
        flashcardsRevisados: flashcardsRes.data?.length || 0,
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
  
  // Flashcards pendentes
  const { data: pendingFlashcards } = useQuery({
    queryKey: ['pending-flashcards-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const now = new Date().toISOString();
      const { count } = await supabase
        .from('study_flashcards')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .lte('next_review_at', now);
      return count || 0;
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });
  
  // Dias até o ENEM
  const diasAteEnem = useMemo(() => {
    const enem2025 = new Date('2025-11-09');
    const hoje = new Date();
    const diff = Math.ceil((enem2025.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }, []);
  
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
  
  const quickActions: QuickAction[] = useMemo(() => [
    { 
      icon: Brain, 
      label: "Banco de Questões", 
      desc: `${userStats?.questoesResolvidas || 0} resolvidas • ${userStats?.acertos || 0}% acerto`,
      route: "/alunos/questoes", 
      gradient: "from-purple-600/30 via-fuchsia-600/20 to-pink-600/30",
      glow: "group-hover:shadow-[0_0_40px_hsl(280_80%_50%/0.35)]",
      iconGradient: "from-purple-500 to-pink-500",
      count: userStats?.questoesResolvidas || 0,
    },
    { 
      icon: PlayCircle, 
      label: "Videoaulas", 
      desc: `${gamification?.lessons_completed || 0} aulas completadas`,
      route: "/alunos/videoaulas", 
      gradient: "from-blue-600/30 via-cyan-600/20 to-teal-600/30",
      glow: "group-hover:shadow-[0_0_40px_hsl(200_80%_50%/0.35)]",
      iconGradient: "from-blue-500 to-cyan-500",
      count: gamification?.lessons_completed || 0,
    },
    { 
      icon: BookOpen, 
      label: "Livro Digital", 
      desc: "Biblioteca completa",
      route: "/alunos/livro-web", 
      gradient: "from-emerald-600/30 via-green-600/20 to-lime-600/30",
      glow: "group-hover:shadow-[0_0_40px_hsl(140_80%_50%/0.35)]",
      iconGradient: "from-emerald-500 to-green-500",
    },
    { 
      icon: Target, 
      label: "Simulados", 
      desc: "Teste sua evolução",
      route: "/alunos/simulados", 
      gradient: "from-amber-600/30 via-orange-600/20 to-red-600/30",
      glow: "group-hover:shadow-[0_0_40px_hsl(30_80%_50%/0.35)]",
      iconGradient: "from-amber-500 to-orange-500",
    },
    { 
      icon: Lightbulb, 
      label: "Flashcards", 
      desc: pendingFlashcards && pendingFlashcards > 0 
        ? `${pendingFlashcards} para revisar AGORA` 
        : `${userStats?.flashcardsRevisados || 0} cards`,
      route: "/alunos/flashcards", 
      gradient: pendingFlashcards && pendingFlashcards > 0 
        ? "from-red-600/40 via-orange-600/30 to-yellow-600/40"
        : "from-yellow-600/30 via-amber-600/20 to-orange-600/30",
      glow: pendingFlashcards && pendingFlashcards > 0 
        ? "group-hover:shadow-[0_0_40px_hsl(0_80%_50%/0.4)]"
        : "group-hover:shadow-[0_0_40px_hsl(45_80%_50%/0.35)]",
      iconGradient: pendingFlashcards && pendingFlashcards > 0 
        ? "from-red-500 to-orange-500"
        : "from-yellow-500 to-amber-500",
      count: pendingFlashcards || 0,
      priority: pendingFlashcards && pendingFlashcards > 0 ? 'urgent' : 'normal',
    },
    { 
      icon: Microscope, 
      label: "TRAMON IA", 
      desc: "Tutor Inteligente 24/7",
      route: "/alunos/tutoria", 
      gradient: "from-indigo-600/30 via-violet-600/20 to-purple-600/30",
      glow: "group-hover:shadow-[0_0_40px_hsl(260_80%_50%/0.35)]",
      iconGradient: "from-indigo-500 to-violet-500",
    },
  ], [userStats, gamification, pendingFlashcards]);

  const userName = userProfile?.nome?.split(' ')[0] || 'Estudante';
  const isLowPerformance = typeof navigator !== 'undefined' && navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4;
  const showEffects = shouldAnimate && !isLowPerformance;

  return (
    <>
      <style>{heroStyles2300}</style>
      
      <div className="min-h-screen pb-8">
        {/* ============================================ */}
        {/* HERO SECTION — IRON MAN HUD ULTIMATE */}
        {/* ============================================ */}
        <section className="hero-2300-ultimate relative rounded-3xl mx-3 md:mx-6 mt-4 p-5 md:p-8 lg:p-10 overflow-hidden">
          {/* Holographic Grid */}
          <div className="holo-grid" />
          
          {/* Quantum Rings */}
          <div className="quantum-ring-2300 w-[350px] h-[350px] -top-32 -right-32" style={{ animationDelay: '0s' }} />
          <div className="quantum-ring-2300 w-[250px] h-[250px] -bottom-20 -left-20" style={{ animationDelay: '2s' }} />
          <div className="quantum-ring-2300 w-[180px] h-[180px] top-1/3 left-1/4" style={{ animationDelay: '4s' }} />
          
          {/* DNA Helix Effect */}
          {showEffects && (
            <div className="dna-helix">
              {Array.from({ length: 12 }).map((_, i) => (
                <div 
                  key={i} 
                  className="dna-strand rounded-full"
                  style={{ 
                    top: `${i * 8}%`,
                    animationDelay: `${i * 0.15}s`,
                    background: `linear-gradient(90deg, transparent, hsl(var(--primary) / ${0.3 - i * 0.02}), transparent)`
                  }} 
                />
              ))}
            </div>
          )}
          
          {/* Orbital Particles */}
          {showEffects && (
            <>
              <div className="absolute top-1/2 right-1/4 w-[160px] h-[160px]">
                <div className="orbital-particle" style={{ animationDelay: '0s' }} />
                <div className="orbital-particle" style={{ animationDelay: '2.6s', animationDirection: 'reverse' }} />
              </div>
            </>
          )}
          
          {/* Energy Beams */}
          <div className="energy-beam w-[70%] top-[15%] left-0" style={{ animationDelay: '0s' }} />
          <div className="energy-beam w-[50%] top-[75%] left-[25%]" style={{ animationDelay: '2s' }} />
          
          {/* Scan Line */}
          {showEffects && <div className="scan-line" />}
          
          {/* Floating Particles */}
          {showEffects && (
            <>
              {Array.from({ length: 8 }).map((_, i) => (
                <div 
                  key={i}
                  className="float-particle" 
                  style={{ 
                    left: `${10 + i * 11}%`, 
                    bottom: 0,
                    animationDelay: `${i * 0.8}s` 
                  }} 
                />
              ))}
            </>
          )}
          
          {/* Content */}
          <div className="relative z-10">
            {/* Top Bar — Status */}
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                {/* Avatar + Level */}
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary via-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-primary/30">
                    <Atom className="w-7 h-7 text-white animate-[spin_12s_linear_infinite]" />
                  </div>
                  <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full level-badge-2300 flex items-center justify-center">
                    <span className="text-[11px] font-black text-black">{levelInfo.level}</span>
                  </div>
                </div>
                
                {/* Title Badge */}
                <div className="space-y-1">
                  <Badge className="bg-white/15 text-white border-white/20 gap-1.5 backdrop-blur-sm">
                    <Crown className="w-3.5 h-3.5 text-yellow-300" />
                    {levelInfo.title}
                  </Badge>
                  <div className="flex items-center gap-2 text-white/60 text-xs">
                    <Flame className="w-3 h-3 text-orange-400 streak-fire" />
                    <span>{gamification?.current_streak || 0} dias de streak</span>
                  </div>
                </div>
              </div>
              
              {/* Sync + ENEM Countdown */}
              <div className="flex items-center gap-3">
                {diasAteEnem > 0 && (
                  <div className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-amber-500/20 to-yellow-500/20 backdrop-blur-sm rounded-2xl px-4 py-2 border border-amber-500/20">
                    <Timer className="w-4 h-4 text-amber-400" />
                    <span className="text-amber-200 font-bold">{diasAteEnem}</span>
                    <span className="text-amber-200/70 text-sm">dias p/ ENEM</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2 text-xs bg-black/30 backdrop-blur-sm rounded-full px-3 py-1.5 border border-white/10">
                  {isConnected ? (
                    <Radio className="h-3 w-3 text-emerald-400 animate-pulse" />
                  ) : (
                    <WifiOff className="h-3 w-3 text-destructive" />
                  )}
                  <span className="text-white/70 hidden sm:inline">
                    {isConnected ? 'LIVE' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Main Hero Content */}
            <div className="grid lg:grid-cols-[1.2fr,1fr] gap-8 items-center">
              {/* Left — Greeting + XP */}
              <div className="space-y-5">
                <div className="space-y-2">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight">
                    Olá, <span className="bg-gradient-to-r from-primary via-pink-400 to-purple-400 bg-clip-text text-transparent">{userName}</span>!
                  </h1>
                  <p className="text-white/60 text-base md:text-lg max-w-lg">
                    A Química é a ciência das transformações. Continue sua jornada e conquiste a aprovação!
                  </p>
                </div>
                
                {/* XP Progress Bar */}
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/70 flex items-center gap-2">
                      <Rocket className="w-4 h-4 text-primary" />
                      Próximo Nível: <span className="text-white font-medium">{levelInfo.level + 1}</span>
                    </span>
                    <span className="text-white font-bold flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-yellow-400" />
                      {(gamification?.total_xp || 0).toLocaleString()} / {levelInfo.nextLevelXP?.toLocaleString()} XP
                    </span>
                  </div>
                  <div className="xp-bar-plasma">
                    <div 
                      className="xp-bar-fill-plasma" 
                      style={{ width: `${Math.max(3, levelInfo.progressPercentage)}%` }} 
                    />
                  </div>
                </div>
              </div>
              
              {/* Right — Stats Orbs Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* XP Total */}
                <div 
                  className="stat-orb-2300 rounded-2xl p-4 cursor-pointer" 
                  onClick={() => navigate('/alunos/conquistas')}
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-500/25 to-amber-600/25 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-yellow-400" />
                    </div>
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">XP Total</span>
                  </div>
                  <p className="text-2xl md:text-3xl font-black text-white">
                    {(gamification?.total_xp || 0).toLocaleString()}
                  </p>
                </div>
                
                {/* Streak */}
                <div 
                  className="stat-orb-2300 rounded-2xl p-4 cursor-pointer" 
                  onClick={() => navigate('/alunos/conquistas')}
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500/25 to-red-600/25 flex items-center justify-center">
                      <Flame className="w-5 h-5 text-orange-400 streak-fire" />
                    </div>
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Streak</span>
                  </div>
                  <p className="text-2xl md:text-3xl font-black text-white">
                    {gamification?.current_streak || 0} <span className="text-base text-muted-foreground font-normal">dias</span>
                  </p>
                </div>
                
                {/* Ranking */}
                <div 
                  className="stat-orb-2300 rounded-2xl p-4 cursor-pointer" 
                  onClick={() => navigate('/alunos/ranking')}
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/25 to-pink-600/25 flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-purple-400" />
                    </div>
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Ranking</span>
                  </div>
                  <p className="text-2xl md:text-3xl font-black text-white">
                    #{rankingData?.position || '—'}
                  </p>
                </div>
                
                {/* Badges */}
                <div 
                  className="stat-orb-2300 rounded-2xl p-4 cursor-pointer" 
                  onClick={() => navigate('/alunos/conquistas')}
                >
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/25 to-teal-600/25 flex items-center justify-center">
                      <Award className="w-5 h-5 text-emerald-400" />
                    </div>
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Conquistas</span>
                  </div>
                  <p className="text-2xl md:text-3xl font-black text-white">
                    {userBadges?.length || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* ============================================ */}
        {/* URGENT ALERT — FLASHCARDS PENDENTES */}
        {/* ============================================ */}
        {pendingFlashcards && pendingFlashcards > 0 && (
          <section className="px-3 md:px-6 pt-5">
            <div 
              className="relative overflow-hidden rounded-2xl p-4 cursor-pointer group border-2 border-orange-500/30 bg-gradient-to-r from-orange-500/10 via-red-500/10 to-orange-500/10"
              onClick={() => navigate('/alunos/flashcards')}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/30 animate-pulse">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <span className="text-orange-400">{pendingFlashcards}</span> Flashcards para revisar
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30">URGENTE</Badge>
                    </h3>
                    <p className="text-sm text-muted-foreground">Revise agora para não perder o progresso!</p>
                  </div>
                </div>
                <Button className="gap-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg shadow-orange-500/30">
                  Revisar Agora
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </section>
        )}
        
        {/* ============================================ */}
        {/* QUICK ACTIONS GRID — NEURAL TILES */}
        {/* ============================================ */}
        <section className="px-3 md:px-6 py-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/10">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              Acesso Rápido
            </h2>
            <Badge variant="outline" className="text-muted-foreground gap-1.5">
              <Gauge className="w-3 h-3" />
              {quickActions.length} módulos
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            {quickActions.map((action, index) => (
              <div
                key={action.label}
                className={cn(
                  "action-tile-2300 group cursor-pointer rounded-2xl p-4 md:p-5",
                  "transition-all duration-400",
                  action.glow,
                  action.priority === 'urgent' && "ring-2 ring-red-500/50"
                )}
                onClick={() => navigate(action.route)}
                style={{ 
                  animationDelay: `${index * 60}ms`,
                  ['--tile-gradient' as any]: `linear-gradient(135deg, ${action.gradient.replace('from-', '').replace('via-', ', ').replace('to-', ', ')})`
                }}
              >
                <div 
                  className="absolute inset-0 rounded-2xl bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-400"
                  style={{ background: `linear-gradient(135deg, var(--tw-gradient-stops))` }}
                />
                <div className={cn("absolute inset-0 rounded-2xl bg-gradient-to-br", action.gradient)} />
                
                <div className="relative flex flex-col items-center text-center gap-3">
                  <div className={cn(
                    "icon-container w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center",
                    "bg-gradient-to-br shadow-lg",
                    action.iconGradient
                  )}>
                    <action.icon className="w-6 h-6 md:w-7 md:h-7 text-white" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-bold text-sm md:text-base">{action.label}</p>
                    <p className="text-[10px] md:text-xs text-muted-foreground line-clamp-1">{action.desc}</p>
                  </div>
                  {action.priority === 'urgent' && (
                    <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] px-1.5 py-0.5 animate-pulse">
                      {action.count}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
        
        {/* ============================================ */}
        {/* STATS CARDS — NEURAL DESIGN */}
        {/* ============================================ */}
        <section className="px-3 md:px-6 pb-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {/* Questões Resolvidas */}
            <Card 
              className="neural-card-2300 cursor-pointer group border-0"
              onClick={() => navigate('/alunos/questoes')}
            >
              <CardContent className="p-4 md:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/15 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-purple-400" />
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
                <p className="text-2xl md:text-3xl font-black">{userStats?.questoesResolvidas || 0}</p>
                <p className="text-xs md:text-sm text-muted-foreground mt-0.5">Questões resolvidas</p>
                {(userStats?.acertos || 0) > 0 && (
                  <div className="flex items-center gap-1.5 mt-2 text-emerald-400">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">{userStats?.acertos}% acertos</span>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Aulas Completadas */}
            <Card 
              className="neural-card-2300 cursor-pointer group border-0"
              onClick={() => navigate('/alunos/videoaulas')}
            >
              <CardContent className="p-4 md:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/15 flex items-center justify-center">
                    <PlayCircle className="w-5 h-5 text-blue-400" />
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
                <p className="text-2xl md:text-3xl font-black">{gamification?.lessons_completed || 0}</p>
                <p className="text-xs md:text-sm text-muted-foreground mt-0.5">Aulas completadas</p>
              </CardContent>
            </Card>
            
            {/* Flashcards */}
            <Card 
              className="neural-card-2300 cursor-pointer group border-0"
              onClick={() => navigate('/alunos/flashcards')}
            >
              <CardContent className="p-4 md:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/15 flex items-center justify-center">
                    <Lightbulb className="w-5 h-5 text-amber-400" />
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
                <p className="text-2xl md:text-3xl font-black">{userStats?.flashcardsRevisados || 0}</p>
                <p className="text-xs md:text-sm text-muted-foreground mt-0.5">Flashcards revisados</p>
              </CardContent>
            </Card>
            
            {/* Cursos */}
            <Card 
              className="neural-card-2300 cursor-pointer group border-0"
              onClick={() => navigate('/alunos/cursos')}
            >
              <CardContent className="p-4 md:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/15 flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-emerald-400" />
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
                <p className="text-2xl md:text-3xl font-black">{gamification?.courses_completed || 0}</p>
                <p className="text-xs md:text-sm text-muted-foreground mt-0.5">Cursos em andamento</p>
              </CardContent>
            </Card>
          </div>
        </section>
        
        {/* ============================================ */}
        {/* CONTINUE STUDYING + ACHIEVEMENTS */}
        {/* ============================================ */}
        <section className="px-3 md:px-6 pb-8">
          <div className="grid lg:grid-cols-3 gap-5">
            {/* Continue de onde parou */}
            <div className="lg:col-span-2">
              <Card className="neural-card-2300 h-full border-0">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="p-2.5 rounded-xl bg-primary/15">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    Continue de onde parou
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { titulo: "Estequiometria - Cálculos", modulo: "Química Geral", progresso: 75, duracao: "45 min", icon: FlaskConical, color: "text-blue-400", bg: "from-blue-500/20 to-cyan-500/10" },
                    { titulo: "Reações Redox", modulo: "Eletroquímica", progresso: 0, duracao: "52 min", icon: Zap, color: "text-yellow-400", bg: "from-yellow-500/20 to-amber-500/10" },
                    { titulo: "Funções Orgânicas", modulo: "Química Orgânica", progresso: 0, duracao: "38 min", icon: Dna, color: "text-purple-400", bg: "from-purple-500/20 to-pink-500/10" },
                  ].map((aula, index) => (
                    <div 
                      key={index} 
                      className="progress-item-2300 flex items-center gap-4 p-4 rounded-2xl bg-muted/20 hover:bg-muted/40 transition-all duration-300 cursor-pointer group"
                      onClick={() => navigate('/alunos/videoaulas')}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0",
                        "bg-gradient-to-br", aula.bg
                      )}>
                        <aula.icon className={cn("w-5 h-5", aula.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm md:text-base truncate">{aula.titulo}</h4>
                        <p className="text-xs text-muted-foreground">{aula.modulo}</p>
                        {aula.progresso > 0 && (
                          <Progress value={aula.progresso} className="h-1.5 mt-2" />
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <Badge variant={aula.progresso > 0 ? "default" : "secondary"} className="font-medium text-xs">
                          {aula.progresso > 0 ? `${aula.progresso}%` : "Novo"}
                        </Badge>
                        <p className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1 justify-end">
                          <Clock className="w-3 h-3" />
                          {aula.duracao}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                    </div>
                  ))}
                  <Button 
                    className="w-full mt-3 gap-2 h-11" 
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
              <Card className="neural-card-2300 h-full border-0">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="p-2.5 rounded-xl bg-amber-500/15">
                      <Award className="w-5 h-5 text-amber-400" />
                    </div>
                    Conquistas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {(userBadges && userBadges.length > 0) ? (
                    userBadges.slice(0, 3).map((ub: any, index: number) => (
                      <div 
                        key={ub.id || index} 
                        className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 to-yellow-500/5 border border-amber-500/15 hover:border-amber-500/30 transition-colors cursor-pointer"
                        onClick={() => navigate('/alunos/conquistas')}
                      >
                        <div className="text-2xl md:text-3xl">{ub.badge?.icon || '🏆'}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{ub.badge?.name || 'Conquista'}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{ub.badge?.description || ''}</p>
                        </div>
                        <Badge variant="outline" className="text-amber-400 border-amber-400/40 text-[10px] flex-shrink-0">
                          +{ub.badge?.xp_reward || 0} XP
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-muted-foreground">
                      <div className="w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-4">
                        <Trophy className="w-8 h-8 opacity-30" />
                      </div>
                      <p className="text-sm font-medium">Nenhuma conquista ainda</p>
                      <p className="text-xs mt-1">Continue estudando para desbloquear!</p>
                    </div>
                  )}
                  <Button 
                    variant="outline" 
                    className="w-full mt-3 gap-2 h-11"
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
