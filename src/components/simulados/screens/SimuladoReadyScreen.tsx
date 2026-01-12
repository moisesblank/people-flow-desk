/**
 * 🎯 SIMULADOS — Modal READY (Year 2300 CINEMATIC ULTRA)
 * Design: Marvel/Iron Man HUD + Holographic Enterprise
 * Layout: Full cinematic experience with orbital effects
 * 
 * Estado: Liberado para iniciar
 * Ação: Experiência épica cinematográfica
 * 
 * ⚡ PERFORMANCE OPTIMIZATION v2.0:
 * - CSS-only animations for infinite loops (GPU-accelerated)
 * - Framer Motion only for finite transitions
 * - Hybrid tiering: Epic on high-end, clean on low-end
 */

import React from "react";
import { 
  Play, Clock, FileQuestion, Shield, AlertTriangle, Camera, 
  Lightbulb, ListChecks, Zap, Rocket, Trophy, Target,
  Atom, Hexagon, CircuitBoard, Flame, Gauge,
  Timer, Award, Crown, Crosshair
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Simulado } from "@/components/simulados/types";
import { cn } from "@/lib/utils";
import { useConstitutionPerformance } from "@/hooks/useConstitutionPerformance";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import "@/styles/simulado-ready-animations.css";

interface SimuladoReadyScreenProps {
  simulado: Simulado;
  isRetake: boolean;
  attemptNumber: number;
  onStart: () => void;
  isLoading?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SimuladoReadyScreen({
  simulado,
  isRetake,
  attemptNumber,
  onStart,
  isLoading = false,
  open = true,
  onOpenChange,
}: SimuladoReadyScreenProps) {
  const { shouldBlur, isLowEnd } = useConstitutionPerformance();
  const isHardMode = simulado.is_hard_mode;
  
  const hours = Math.floor(simulado.duration_minutes / 60);
  const mins = simulado.duration_minutes % 60;
  const tempoFormatado = hours > 0 
    ? `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}h`
    : `${simulado.duration_minutes}min`;

  const content = (
    <motion.div 
      className="relative flex flex-col h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* 🌌 CINEMATIC BACKGROUND — CSS-only for performance */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
        {/* Deep space gradient */}
        <div className={cn(
          "absolute inset-0",
          isHardMode 
            ? "bg-[radial-gradient(ellipse_120%_120%_at_50%_-20%,rgba(220,38,38,0.15),transparent_50%),radial-gradient(ellipse_80%_80%_at_80%_100%,rgba(249,115,22,0.1),transparent_50%)]" 
            : "bg-[radial-gradient(ellipse_120%_120%_at_50%_-20%,rgba(16,185,129,0.15),transparent_50%),radial-gradient(ellipse_80%_80%_at_80%_100%,rgba(6,182,212,0.1),transparent_50%)]"
        )} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
        
        {/* Animated grid pattern — CSS animation */}
        {!isLowEnd && (
          <div className={cn(
            "absolute inset-0 opacity-[0.03]",
            "bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)]",
            "bg-[size:50px_50px]"
          )} />
        )}
        
        {/* Orbital rings system — CSS-only infinite rotation */}
        {!isLowEnd && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]">
            {/* Primary ring */}
            <div className={cn(
              "absolute inset-0 rounded-full border opacity-20 simulado-ring-slow",
              isHardMode ? "border-red-500" : "border-emerald-500"
            )} style={{ borderStyle: 'dashed', borderWidth: '1px' }} />
            {/* Secondary ring */}
            <div className={cn(
              "absolute inset-8 rounded-full border opacity-15 simulado-ring-reverse",
              isHardMode ? "border-orange-500" : "border-cyan-500"
            )} style={{ borderWidth: '1px' }} />
            {/* Tertiary ring */}
            <div className={cn(
              "absolute inset-20 rounded-full border opacity-10 simulado-ring-fast",
              isHardMode ? "border-red-400" : "border-emerald-400"
            )} />
            
            {/* Orbital particles — CSS keyframes */}
            <div className={cn(
              "absolute top-1/2 left-1/2 w-3 h-3 -ml-1.5 -mt-1.5 rounded-full simulado-particle-orbit",
              isHardMode ? "bg-red-400 shadow-[0_0_12px_rgba(239,68,68,0.6)]" : "bg-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.6)]"
            )} style={{ animationDelay: '0s' }} />
            <div className={cn(
              "absolute top-1/2 left-1/2 w-2 h-2 -ml-1 -mt-1 rounded-full simulado-particle-orbit",
              isHardMode ? "bg-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.6)]" : "bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]"
            )} style={{ animationDelay: '-5s' }} />
            <div className={cn(
              "absolute top-1/2 left-1/2 w-2 h-2 -ml-1 -mt-1 rounded-full simulado-particle-orbit",
              isHardMode ? "bg-red-300 shadow-[0_0_8px_rgba(252,165,165,0.6)]" : "bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.6)]"
            )} style={{ animationDelay: '-10s' }} />
          </div>
        )}
        
        {/* Holographic scan lines — CSS animation */}
        {!isLowEnd && (
          <div className="absolute inset-0 opacity-[0.03] simulado-scanlines bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(255,255,255,0.03)_2px,rgba(255,255,255,0.03)_4px)]" />
        )}
        
        {/* Corner HUD elements */}
        <div className={cn(
          "absolute top-0 left-0 w-32 h-32",
          "border-l-2 border-t-2 rounded-tl-2xl",
          isHardMode ? "border-red-500/40" : "border-emerald-500/40"
        )}>
          <div className={cn(
            "absolute top-4 left-4 w-2 h-2 rounded-full simulado-pulse",
            isHardMode ? "bg-red-500" : "bg-emerald-500"
          )} />
        </div>
        <div className={cn(
          "absolute top-0 right-0 w-32 h-32",
          "border-r-2 border-t-2 rounded-tr-2xl",
          isHardMode ? "border-red-500/40" : "border-emerald-500/40"
        )}>
          <div className={cn(
            "absolute top-4 right-4 text-[10px] font-mono uppercase tracking-widest opacity-40",
            isHardMode ? "text-red-400" : "text-emerald-400"
          )}>
            SYS.READY
          </div>
        </div>
        <div className={cn(
          "absolute bottom-0 left-0 w-32 h-32",
          "border-l-2 border-b-2 rounded-bl-2xl",
          isHardMode ? "border-red-500/40" : "border-emerald-500/40"
        )} />
        <div className={cn(
          "absolute bottom-0 right-0 w-32 h-32",
          "border-r-2 border-b-2 rounded-br-2xl",
          isHardMode ? "border-red-500/40" : "border-emerald-500/40"
        )}>
          <div className={cn(
            "absolute bottom-4 right-4 text-[10px] font-mono uppercase tracking-widest opacity-40",
            isHardMode ? "text-red-400" : "text-emerald-400"
          )}>
            v2.3.0.0
          </div>
        </div>
      </div>

      {/* 📜 SCROLLABLE CONTENT */}
      <ScrollArea className="flex-1 relative z-10">
        <div className="p-6 md:p-8 lg:p-10 space-y-8">
          
          {/* 🎯 HERO SECTION */}
          <motion.div 
            className="text-center space-y-5 pt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* Status Holographic Badge */}
            <div className="flex justify-center">
              <div className={cn(
                "inline-flex items-center gap-3 px-6 py-2.5 rounded-full",
                "border shadow-lg relative overflow-hidden",
                isHardMode 
                  ? "bg-gradient-to-r from-red-950/80 via-red-900/60 to-orange-950/80 border-red-500/50 shadow-red-500/25" 
                  : "bg-gradient-to-r from-emerald-950/80 via-emerald-900/60 to-cyan-950/80 border-emerald-500/50 shadow-emerald-500/25"
              )}>
                {/* Shimmer effect — CSS animation */}
                {!isLowEnd && (
                  <div className="absolute inset-0 simulado-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                )}
                <div className={cn(
                  "simulado-spin-slow",
                  isHardMode ? "text-red-400" : "text-emerald-400"
                )}>
                  <Atom className="h-5 w-5" />
                </div>
                <span className={cn(
                  "text-sm font-bold tracking-wide",
                  isHardMode ? "text-red-200" : "text-emerald-200"
                )}>
                  {isRetake ? `TENTATIVA #${attemptNumber}` : "✦ SIMULADO LIBERADO ✦"}
                </span>
                <Crosshair className={cn(
                  "h-4 w-4",
                  isHardMode ? "text-orange-400" : "text-cyan-400"
                )} />
              </div>
            </div>
            
            {/* Title with Holographic Effect */}
            <motion.h1 
              className="relative"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
            >
              <span className={cn(
                "block text-3xl md:text-4xl lg:text-5xl font-black tracking-tight",
                "bg-clip-text text-transparent",
                isHardMode 
                  ? "bg-gradient-to-r from-red-200 via-white to-orange-200" 
                  : "bg-gradient-to-r from-emerald-200 via-white to-cyan-200"
              )}>
                {simulado.title}
              </span>
              {/* Glow layer */}
              {!isLowEnd && (
                <span className={cn(
                  "absolute inset-0 text-3xl md:text-4xl lg:text-5xl font-black tracking-tight blur-xl opacity-50 pointer-events-none",
                  isHardMode ? "text-red-500" : "text-emerald-500"
                )}>
                  {simulado.title}
                </span>
              )}
            </motion.h1>
            
            {simulado.description && (
              <motion.p 
                className="text-sm md:text-base text-muted-foreground/70 max-w-2xl mx-auto leading-relaxed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {simulado.description}
              </motion.p>
            )}
          </motion.div>

          {/* 📊 HOLOGRAPHIC STATS GRID */}
          <motion.div 
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <HolographicStatCard
              icon={<Timer className="h-6 w-6" />}
              value={tempoFormatado}
              label="Duração"
              color={isHardMode ? "red" : "cyan"}
              isLowEnd={isLowEnd}
            />
            <HolographicStatCard
              icon={<Hexagon className="h-6 w-6" />}
              value={`${simulado.total_questions || 0}`}
              label="Questões"
              color={isHardMode ? "orange" : "emerald"}
              isLowEnd={isLowEnd}
            />
            <HolographicStatCard
              icon={<Crown className="h-6 w-6" />}
              value={`${(simulado.total_questions || 0) * 10}`}
              label="XP Máximo"
              color={isHardMode ? "red" : "amber"}
              isLowEnd={isLowEnd}
            />
            <HolographicStatCard
              icon={<Gauge className="h-6 w-6" />}
              value={`${simulado.passing_score || 60}%`}
              label="Aprovação"
              color={isHardMode ? "orange" : "green"}
              isLowEnd={isLowEnd}
            />
          </motion.div>

          {/* ⚠️ RETAKE WARNING OR HARD MODE BADGES */}
          <AnimatePresence mode="wait">
            {isRetake ? (
              <motion.div 
                key="retake"
                className={cn(
                  "relative overflow-hidden rounded-2xl p-5",
                  "bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-yellow-500/15",
                  "border-2 border-amber-500/40",
                  "shadow-[0_0_30px_rgba(245,158,11,0.15)]"
                )}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-center gap-5">
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 simulado-wobble",
                    "bg-gradient-to-br from-amber-500/40 to-orange-600/30",
                    "border-2 border-amber-500/50",
                    "shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                  )}>
                    <AlertTriangle className="h-7 w-7 text-amber-300" />
                  </div>
                  <div>
                    <p className="font-black text-lg text-amber-100">MODO PRÁTICA ATIVO</p>
                    <p className="text-sm text-amber-300/80 mt-1">
                      Esta tentativa <span className="font-bold text-amber-200">NÃO</span> contará para o ranking e <span className="font-bold text-amber-200">NÃO</span> gerará XP.
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (simulado.is_hard_mode || simulado.requires_camera) && (
              <motion.div 
                key="hardmode"
                className="flex flex-wrap justify-center gap-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                {simulado.is_hard_mode && (
                  <div className={cn(
                    "inline-flex items-center gap-3 px-6 py-3 rounded-xl transition-transform hover:scale-[1.03]",
                    "bg-gradient-to-r from-red-950/80 to-red-900/60",
                    "border-2 border-red-500/50",
                    "shadow-[0_0_25px_rgba(239,68,68,0.3)] hover:shadow-[0_0_35px_rgba(239,68,68,0.4)]"
                  )}>
                    <div className="simulado-scale-pulse">
                      <Flame className="h-5 w-5 text-red-400" />
                    </div>
                    <span className="text-sm font-black text-red-200 tracking-wide">MODO HARD</span>
                  </div>
                )}
                {simulado.requires_camera && (
                  <div className={cn(
                    "inline-flex items-center gap-3 px-6 py-3 rounded-xl transition-transform hover:scale-[1.03]",
                    "bg-gradient-to-r from-red-950/80 to-orange-900/60",
                    "border-2 border-red-500/50",
                    "shadow-[0_0_25px_rgba(239,68,68,0.2)]"
                  )}>
                    <div className="simulado-pulse">
                      <Camera className="h-5 w-5 text-red-400" />
                    </div>
                    <span className="text-sm font-black text-red-200 tracking-wide">CÂMERA ATIVA</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* 💡 PROFESSOR TIPS - PREMIUM GLASS */}
          <motion.div 
            className={cn(
              "relative overflow-hidden rounded-2xl",
              "border-2",
              shouldBlur && "backdrop-blur-xl",
              isHardMode 
                ? "bg-gradient-to-br from-red-500/10 via-black/40 to-orange-500/5 border-red-500/30"
                : "bg-gradient-to-br from-indigo-500/10 via-black/40 to-violet-500/5 border-indigo-500/30"
            )}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            {/* Animated glow — 🏛️ PREMIUM GARANTIDO */}
            <div className={cn(
              "absolute -top-10 -right-10 w-60 h-60 rounded-full blur-3xl simulado-glow-pulse transform-gpu",
              isHardMode ? "bg-red-500/20" : "bg-indigo-500/20"
            )} />
            
            <div className="relative p-6">
              {/* Header */}
              <div className="flex items-center gap-4 mb-5">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center transition-transform hover:rotate-12",
                  "bg-gradient-to-br shadow-xl",
                  isHardMode 
                    ? "from-red-500 to-orange-600 shadow-red-500/40" 
                    : "from-indigo-500 to-violet-600 shadow-indigo-500/40"
                )}>
                  <Lightbulb className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className={cn(
                    "font-black text-lg",
                    isHardMode ? "text-red-100" : "text-indigo-100"
                  )}>Dicas do Professor</p>
                  <p className={cn(
                    "text-xs font-medium",
                    isHardMode ? "text-red-400/60" : "text-indigo-400/60"
                  )}>Prof. Moisés Medeiros</p>
                </div>
              </div>
              
              {/* Tips List */}
              <div className="grid gap-3">
                {[
                  { icon: Target, text: "Concentre-se e faça primeiro as questões que você domina." },
                  { icon: Timer, text: "Controle seu tempo considerando a quantidade de questões." },
                  { icon: Shield, text: "Escolha um local tranquilo evitando interrupções." },
                  { icon: Award, text: "Lembre-se: na prova real não há consulta." }
                ].map((tip, i) => (
                  <motion.div 
                    key={i} 
                    className={cn(
                      "flex gap-4 p-3 rounded-xl",
                      "bg-white/[0.03] border border-white/[0.05]",
                      "hover:translate-x-1 hover:bg-white/[0.05] transition-all"
                    )}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + i * 0.1 }}
                  >
                    <tip.icon className={cn(
                      "h-5 w-5 shrink-0 mt-0.5",
                      isHardMode ? "text-red-400" : "text-indigo-400"
                    )} />
                    <span className="text-sm text-muted-foreground/90">{tip.text}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* 🛡️ HARD MODE RULES */}
          {simulado.is_hard_mode && (
            <motion.div 
              className={cn(
                "relative overflow-hidden rounded-2xl",
                "bg-gradient-to-br from-red-950/50 via-red-900/30 to-black/50",
                "border-2 border-red-500/40",
                "shadow-[0_0_40px_rgba(239,68,68,0.15)]"
              )}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
            >
              {/* Pulsing border glow — CSS animation */}
              {!isLowEnd && (
                <div className="absolute inset-0 rounded-2xl simulado-glow-pulse" style={{
                  boxShadow: 'inset 0 0 30px rgba(239,68,68,0.2)'
                }} />
              )}
              
              <div className="relative p-6">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-xl shadow-red-500/40 simulado-scale-pulse">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-black text-lg text-red-100">Regras do Modo Hard</p>
                    <p className="text-xs text-red-400/60">Violações = Desclassificação</p>
                  </div>
                </div>
                
                <div className="grid gap-3">
                  {[
                    { icon: CircuitBoard, text: `Máximo de ${simulado.max_tab_switches} trocas de aba permitidas` },
                    ...(simulado.requires_camera ? [{ icon: Camera, text: "Câmera ativa durante todo o simulado" }] : []),
                    { icon: AlertTriangle, text: "Violações resultam em desclassificação imediata" }
                  ].map((rule, i) => (
                    <motion.div 
                      key={i}
                      className={cn(
                        "flex gap-4 items-center p-3 rounded-xl",
                        "bg-red-500/10 border border-red-500/20"
                      )}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.9 + i * 0.1 }}
                    >
                      <rule.icon className="h-5 w-5 text-red-400 shrink-0" />
                      <span className="text-sm text-red-200/90">{rule.text}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* 📋 GENERAL RULES */}
          <motion.div 
            className={cn(
              "rounded-2xl p-6",
              "bg-white/[0.02] border border-white/[0.08]",
              shouldBlur && !isLowEnd && "backdrop-blur-sm"
            )}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <div className="flex items-center gap-3 mb-5">
              <ListChecks className={cn(
                "h-6 w-6",
                isHardMode ? "text-red-400" : "text-emerald-400"
              )} />
              <p className="font-bold text-foreground/90">Regras do Simulado</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-3">
              {[
                { icon: Clock, text: `Tempo total: ${simulado.duration_minutes} minutos` },
                { icon: Zap, text: "Cada questão vale 10 pontos de XP" },
                { icon: Trophy, text: "Apenas a 1ª tentativa pontua no ranking" },
                { icon: CircuitBoard, text: "Respostas salvas automaticamente" },
                { icon: Target, text: "Navegue livremente entre questões" },
                { icon: FileQuestion, text: "Gabarito disponível após finalização" }
              ].map((rule, i) => (
                <div 
                  key={i} 
                  className="flex gap-3 items-center p-2 rounded-lg hover:bg-white/[0.03] transition-colors"
                >
                  <rule.icon className={cn(
                    "h-4 w-4 shrink-0",
                    isHardMode ? "text-red-500/60" : "text-emerald-500/60"
                  )} />
                  <span className="text-sm text-muted-foreground/80">{rule.text}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </ScrollArea>

      {/* 🚀 EPIC FOOTER WITH START BUTTON */}
      <motion.div 
        className={cn(
          "relative z-10 p-6 md:p-8",
          "bg-gradient-to-t from-black via-black/95 to-transparent",
          "border-t-2",
          isHardMode ? "border-red-500/30" : "border-emerald-500/30"
        )}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
      >
        <Button
          size="lg"
          onClick={onStart}
          disabled={isLoading}
          className={cn(
            "relative w-full h-16 md:h-18 text-lg md:text-xl font-black overflow-hidden",
            "rounded-2xl border-2",
            "transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]",
            isHardMode 
              ? "bg-gradient-to-r from-red-600 via-red-500 to-orange-500 hover:from-red-500 hover:via-red-400 hover:to-orange-400 border-red-400/50"
              : "bg-gradient-to-r from-emerald-600 via-emerald-500 to-cyan-500 hover:from-emerald-500 hover:via-emerald-400 hover:to-cyan-400 border-emerald-400/50",
            !isLowEnd && (isHardMode 
              ? "shadow-[0_0_50px_rgba(239,68,68,0.4),0_0_100px_rgba(239,68,68,0.2)]" 
              : "shadow-[0_0_50px_rgba(16,185,129,0.4),0_0_100px_rgba(16,185,129,0.2)]"
            )
          )}
        >
          {isLoading ? (
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Preparando Simulado...</span>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Play className="h-7 w-7 fill-current" />
              <span>{isRetake ? "INICIAR MODO PRÁTICA" : "INICIAR SIMULADO"}</span>
              <div className="simulado-bounce-x">
                <Rocket className="h-6 w-6" />
              </div>
            </div>
          )}
          
          {/* Animated shine — CSS animation */}
          {!isLowEnd && !isLoading && (
            <div className="absolute inset-0 simulado-shimmer-fast bg-gradient-to-r from-transparent via-white/25 to-transparent" />
          )}
        </Button>
        
        <p className="text-center text-xs text-muted-foreground/40 mt-4 font-medium">
          ⚡ Ao iniciar, o cronômetro será ativado automaticamente
        </p>
      </motion.div>
    </motion.div>
  );

  // Se open/onOpenChange forem fornecidos, renderiza como Dialog
  if (onOpenChange !== undefined) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent 
          className={cn(
            "p-0 gap-0 overflow-hidden",
            "border-2",
            isHardMode ? "border-red-500/40" : "border-emerald-500/40",
            "bg-gradient-to-br from-black via-card to-black",
            "shadow-2xl",
            isHardMode 
              ? "shadow-red-500/20" 
              : "shadow-emerald-500/20"
          )}
          showMaximize
        >
          <DialogHeader className="sr-only">
            <DialogTitle>{simulado.title}</DialogTitle>
          </DialogHeader>
          {content}
        </DialogContent>
      </Dialog>
    );
  }

  // Fallback: renderiza inline (para compatibilidade)
  return (
    <div className={cn(
      "relative rounded-2xl overflow-hidden",
      "border-2",
      isHardMode ? "border-red-500/40" : "border-emerald-500/40",
      "bg-gradient-to-br from-black via-card to-black",
      "shadow-2xl min-h-[80vh]",
      isHardMode ? "shadow-red-500/20" : "shadow-emerald-500/20"
    )}>
      {content}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   📊 HOLOGRAPHIC STAT CARD — Optimized for Performance
   ═══════════════════════════════════════════════════════════════ */
function HolographicStatCard({ 
  icon, 
  value, 
  label, 
  color,
  isLowEnd = false,
}: { 
  icon: React.ReactNode; 
  value: string; 
  label: string;
  color: "red" | "orange" | "cyan" | "emerald" | "amber" | "green";
  isLowEnd?: boolean;
}) {
  const colorConfig = {
    red: {
      bg: "from-red-500/20 via-red-600/10 to-red-500/5",
      border: "border-red-500/40",
      icon: "from-red-500 to-red-700",
      text: "text-red-200",
      glow: "shadow-red-500/30",
      hover: "hover:border-red-400/60 hover:shadow-red-500/40"
    },
    orange: {
      bg: "from-orange-500/20 via-orange-600/10 to-orange-500/5",
      border: "border-orange-500/40",
      icon: "from-orange-500 to-orange-700",
      text: "text-orange-200",
      glow: "shadow-orange-500/30",
      hover: "hover:border-orange-400/60 hover:shadow-orange-500/40"
    },
    cyan: {
      bg: "from-cyan-500/20 via-cyan-600/10 to-cyan-500/5",
      border: "border-cyan-500/40",
      icon: "from-cyan-500 to-cyan-700",
      text: "text-cyan-200",
      glow: "shadow-cyan-500/30",
      hover: "hover:border-cyan-400/60 hover:shadow-cyan-500/40"
    },
    emerald: {
      bg: "from-emerald-500/20 via-emerald-600/10 to-emerald-500/5",
      border: "border-emerald-500/40",
      icon: "from-emerald-500 to-emerald-700",
      text: "text-emerald-200",
      glow: "shadow-emerald-500/30",
      hover: "hover:border-emerald-400/60 hover:shadow-emerald-500/40"
    },
    amber: {
      bg: "from-amber-500/20 via-amber-600/10 to-amber-500/5",
      border: "border-amber-500/40",
      icon: "from-amber-500 to-amber-700",
      text: "text-amber-200",
      glow: "shadow-amber-500/30",
      hover: "hover:border-amber-400/60 hover:shadow-amber-500/40"
    },
    green: {
      bg: "from-green-500/20 via-green-600/10 to-green-500/5",
      border: "border-green-500/40",
      icon: "from-green-500 to-green-700",
      text: "text-green-200",
      glow: "shadow-green-500/30",
      hover: "hover:border-green-400/60 hover:shadow-green-500/40"
    }
  };

  const config = colorConfig[color];

  return (
    <div className="group relative">
      {/* Outer glow on hover — CSS transition */}
      {!isLowEnd && (
        <div className={cn(
          "absolute -inset-1 rounded-2xl bg-gradient-to-r opacity-0 group-hover:opacity-40 blur-xl transition-opacity duration-500",
          config.bg
        )} />
      )}
      
      <div className={cn(
        "relative flex flex-col items-center gap-3 p-5 md:p-6 rounded-xl",
        "bg-gradient-to-br border",
        config.bg,
        config.border,
        "shadow-lg",
        !isLowEnd && "transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-xl",
        !isLowEnd && config.hover,
        !isLowEnd && config.glow
      )}>
        {/* Icon container */}
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center",
          "bg-gradient-to-br text-white shadow-lg",
          config.icon,
          !isLowEnd && "transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
        )}>
          {icon}
        </div>
        
        {/* Value & Label */}
        <div className="text-center">
          <p className={cn(
            "text-xl md:text-2xl font-black",
            config.text
          )}>
            {value}
          </p>
          <p className="text-xs text-muted-foreground/60 font-medium uppercase tracking-wider mt-1">
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}
