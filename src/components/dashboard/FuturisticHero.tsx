// ============================================
// FUTURISTIC HERO 2050 v2.0 - CYBERPUNK EXTREME
// Visual ultra-moderno com neon, hologramas 3D
// Animações avançadas, partículas e glassmorphism
// ============================================

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { 
  Zap, 
  Brain, 
  Sparkles, 
  Activity,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Rocket,
  ChevronRight,
  Bot,
  Cpu,
  Wifi,
  Shield,
  Eye,
  BarChart3,
  DollarSign,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Globe
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { usePerformanceFlags } from "@/hooks/usePerformanceFlags";

interface FuturisticHeroProps {
  pendingTasks: number;
  completedToday: number;
  pendingPayments: number;
  profit: number;
  students?: number;
  affiliates?: number;
}

// Floating Particles with Glow
function CyberParticles() {
  const particles = useMemo(() => 
    [...Array(40)].map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      duration: Math.random() * 4 + 3,
      delay: Math.random() * 3,
    })), []
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: `radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)`,
            boxShadow: `0 0 ${p.size * 2}px hsl(var(--primary) / 0.5)`,
          }}
          animate={{
            y: [0, -40, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0.3, 0.8, 0.3],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// Holographic Grid with Pulse
function HolographicGrid() {
  return (
    <motion.div 
      className="absolute inset-0 overflow-hidden pointer-events-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--primary) / 0.1) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--primary) / 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />
      <motion.div
        className="absolute inset-0"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, repeat: Infinity }}
        style={{
          background: `radial-gradient(circle at 30% 30%, hsl(var(--primary) / 0.15) 0%, transparent 50%)`
        }}
      />
    </motion.div>
  );
}

// Horizontal Scan Line
function ScanLine() {
  return (
    <motion.div
      className="absolute left-0 right-0 h-[2px] z-20"
      style={{
        background: `linear-gradient(90deg, transparent 0%, hsl(var(--primary) / 0.8) 50%, transparent 100%)`,
        boxShadow: `0 0 20px hsl(var(--primary) / 0.5)`,
      }}
      animate={{
        top: ["-10%", "110%"],
      }}
      transition={{
        duration: 5,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  );
}

// Glowing Orbs Background - 🏛️ LEI I: Desligado em lite mode
function GlowingOrbs({ enabled }: { enabled: boolean }) {
  // Não renderiza em lite mode (blur-3xl é pesado)
  if (!enabled) return null;
  
  return (
    <>
      <motion.div
        className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.3) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 6, repeat: Infinity }}
      />
      <motion.div
        className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.2) 0%, transparent 70%)' }}
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 5, repeat: Infinity }}
      />
      <motion.div
        className="absolute top-1/2 right-1/4 w-40 h-40 rounded-full blur-2xl"
        style={{ background: 'radial-gradient(circle, hsl(142 76% 47% / 0.15) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.3, 0.2] }}
        transition={{ duration: 4, repeat: Infinity, delay: 1 }}
      />
    </>
  );
}

// AI Neural Network Animation
function NeuralNetwork() {
  return (
    <div className="absolute right-4 top-4 w-40 h-40 opacity-30">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Neural nodes */}
        {[...Array(8)].map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          const x = 50 + Math.cos(angle) * 35;
          const y = 50 + Math.sin(angle) * 35;
          return (
            <motion.circle
              key={i}
              cx={x}
              cy={y}
              r="3"
              fill="hsl(var(--primary))"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
            />
          );
        })}
        {/* Center node */}
        <motion.circle
          cx="50"
          cy="50"
          r="5"
          fill="hsl(var(--primary))"
          animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.3, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        {/* Connection lines */}
        {[...Array(8)].map((_, i) => {
          const angle = (i / 8) * Math.PI * 2;
          const x = 50 + Math.cos(angle) * 35;
          const y = 50 + Math.sin(angle) * 35;
          return (
            <motion.line
              key={`line-${i}`}
              x1="50"
              y1="50"
              x2={x}
              y2={y}
              stroke="hsl(var(--primary))"
              strokeWidth="0.5"
              animate={{ opacity: [0.2, 0.6, 0.2] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
            />
          );
        })}
      </svg>
    </div>
  );
}

// AI Status Badge with Pulse
function AIStatusBadge() {
  const [status, setStatus] = useState<"analyzing" | "processing" | "ready" | "syncing">("ready");
  
  useEffect(() => {
    const statuses: ("analyzing" | "processing" | "ready" | "syncing")[] = ["analyzing", "processing", "ready", "syncing"];
    const interval = setInterval(() => {
      setStatus(statuses[Math.floor(Math.random() * statuses.length)]);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // 2300 UPGRADE - Status configs com CSS classes
  const config = {
    analyzing: { color: "text-blue-400", bg: "bg-blue-500/20", border: "border-blue-500/40", label: "Analisando dados...", statusClass: "badge-status-syncing" },
    processing: { color: "text-yellow-400", bg: "bg-yellow-500/20", border: "border-yellow-500/40", label: "Processando IA...", statusClass: "badge-status-syncing" },
    ready: { color: "text-emerald-400", bg: "bg-emerald-500/20", border: "border-emerald-500/40", label: "Sistema operacional", statusClass: "badge-status-online" },
    syncing: { color: "text-holo-cyan", bg: "bg-holo-cyan/20", border: "border-holo-cyan/40", label: "IA Ativa", statusClass: "badge-status-ai" },
  };

  const c = config[status];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-xl border",
        c.bg, c.border
      )}
    >
      <motion.div
        className={cn("w-2 h-2 rounded-full", c.color.replace('text-', 'bg-'))}
        animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
      />
      <span className={cn("text-xs font-mono", c.color)}>{c.label}</span>
    </motion.div>
  );
}

// Cyber Stat Card with Neon Glow
function CyberMetricCard({ 
  icon: Icon, 
  label, 
  value, 
  trend,
  color = "primary",
  onClick, 
  delay = 0 
}: {
  icon: any;
  label: string;
  value: string | number;
  trend?: "up" | "down" | "neutral";
  color?: "primary" | "green" | "blue" | "gold" | "purple";
  onClick?: () => void;
  delay?: number;
}) {
  const colorClasses = {
    primary: {
      bg: "from-primary/20 to-primary/5",
      border: "border-primary/30 hover:border-primary/60",
      glow: "group-hover:shadow-[0_0_30px_hsl(var(--primary)/0.3)]",
      icon: "text-primary bg-primary/20",
    },
    green: {
      bg: "from-emerald-500/20 to-emerald-500/5",
      border: "border-emerald-500/30 hover:border-emerald-500/60",
      glow: "group-hover:shadow-[0_0_30px_rgba(16,185,129,0.3)]",
      icon: "text-emerald-400 bg-emerald-500/20",
    },
    blue: {
      bg: "from-blue-500/20 to-blue-500/5",
      border: "border-blue-500/30 hover:border-blue-500/60",
      glow: "group-hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]",
      icon: "text-blue-400 bg-blue-500/20",
    },
    gold: {
      bg: "from-amber-500/20 to-amber-500/5",
      border: "border-amber-500/30 hover:border-amber-500/60",
      glow: "group-hover:shadow-[0_0_30px_rgba(245,158,11,0.3)]",
      icon: "text-amber-400 bg-amber-500/20",
    },
    purple: {
      bg: "from-purple-500/20 to-purple-500/5",
      border: "border-purple-500/30 hover:border-purple-500/60",
      glow: "group-hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]",
      icon: "text-purple-400 bg-purple-500/20",
    },
  };

  const c = colorClasses[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 100 }}
      whileHover={{ scale: 1.03, y: -2 }}
      onClick={onClick}
      className={cn(
        "relative group cursor-pointer rounded-xl p-4 backdrop-blur-xl border transition-all duration-300",
        `bg-gradient-to-br ${c.bg}`,
        c.border,
        c.glow
      )}
    >
      {/* Corner Accents */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-current opacity-50 rounded-tl-lg" />
      <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-current opacity-50 rounded-tr-lg" />
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-current opacity-50 rounded-bl-lg" />
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-current opacity-50 rounded-br-lg" />
      
      <div className="flex items-center gap-3">
        <motion.div 
          className={cn("p-2.5 rounded-lg", c.icon)}
          whileHover={{ rotate: [0, -10, 10, 0] }}
          transition={{ duration: 0.5 }}
        >
          <Icon className="h-5 w-5" />
        </motion.div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">{label}</p>
          <div className="flex items-center gap-2">
            <motion.span 
              className="text-xl font-bold text-foreground font-mono"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: delay + 0.2 }}
            >
              {value}
            </motion.span>
            {trend === "up" && <TrendingUp className="h-4 w-4 text-emerald-400" />}
            {trend === "down" && <TrendingDown className="h-4 w-4 text-red-400" />}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </motion.div>
  );
}

// Main Hero Component
export function FuturisticHero({ 
  pendingTasks, 
  completedToday, 
  pendingPayments, 
  profit,
  students = 0,
  affiliates = 0
}: FuturisticHeroProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const flags = usePerformanceFlags(); // 🏛️ LEI I
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const userName = user?.user_metadata?.nome || user?.email?.split("@")[0] || "Comandante";
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
    }).format(value / 100);
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 6) return "Boa madrugada";
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative overflow-hidden rounded-3xl min-h-[380px] bg-gradient-to-br from-background via-card to-background border border-border/50"
    >
      {/* Background Effects */}
      <CyberParticles />
      <HolographicGrid />
      <ScanLine />
      <GlowingOrbs enabled={flags.ui_ambient_fx} />
      <NeuralNetwork />

      {/* Content */}
      <div className="relative z-10 p-6 md:p-8 h-full">
        {/* Top Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <AIStatusBadge />
            
            {/* Live Clock */}
            <motion.div 
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/50 backdrop-blur-xl border border-border/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Wifi className="h-3 w-3 text-emerald-400" />
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs font-mono text-foreground">
                {currentTime.toLocaleTimeString("pt-BR", { 
                  hour: "2-digit", 
                  minute: "2-digit",
                  second: "2-digit"
                })}
              </span>
            </motion.div>
          </div>

          {/* Quick Stats Badges */}
          <div className="flex flex-wrap gap-2">
            <motion.div 
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 cursor-pointer hover:bg-emerald-500/20 transition-colors"
              whileHover={{ scale: 1.05 }}
              onClick={() => navigate("/tarefas")}
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-400">{completedToday} concluídas hoje</span>
            </motion.div>
            
            {pendingTasks > 0 && (
              <motion.div 
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 cursor-pointer hover:bg-blue-500/20 transition-colors"
                whileHover={{ scale: 1.05 }}
                onClick={() => navigate("/tarefas")}
              >
                <Target className="h-3.5 w-3.5 text-blue-400" />
                <span className="text-xs font-medium text-blue-400">{pendingTasks} pendentes</span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left: Greeting & Actions */}
          <div className="lg:col-span-3 space-y-6">
            {/* Greeting */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              <p className="text-sm text-muted-foreground">
                {currentTime.toLocaleDateString("pt-BR", { 
                  weekday: "long", 
                  day: "numeric", 
                  month: "long",
                  year: "numeric"
                })}
              </p>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight">
                <span className="text-foreground">{getGreeting()}, </span>
                <motion.span 
                  className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-red-400 to-primary"
                  animate={{ 
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  }}
                  transition={{ duration: 5, repeat: Infinity }}
                  style={{ backgroundSize: "200% 200%" }}
                >
                  {userName}
                </motion.span>
              </h1>
              <p className="text-muted-foreground flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                Central de Comando Inteligente • Synapse v15.0
              </p>
            </motion.div>

            {/* Quick Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap gap-2"
            >
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate("/tarefas")}
                className="gap-2 bg-background/30 backdrop-blur-xl border-primary/30 hover:bg-primary/20 hover:border-primary hover:shadow-[0_0_20px_hsl(var(--primary)/0.3)] transition-all"
              >
                <Target className="h-4 w-4" />
                {pendingTasks} Tarefas
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate("/whatsapp-live")}
                className="gap-2 bg-background/30 backdrop-blur-xl border-emerald-500/30 hover:bg-emerald-500/20 hover:border-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all"
              >
                <Zap className="h-4 w-4 text-emerald-400" />
                WhatsApp Live
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate("/dashboard-executivo")}
                className="gap-2 bg-background/30 backdrop-blur-xl border-blue-500/30 hover:bg-blue-500/20 hover:border-blue-500 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all"
              >
                <BarChart3 className="h-4 w-4 text-blue-400" />
                Dashboard Executivo
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate("/calendario")}
                className="gap-2 bg-background/30 backdrop-blur-xl border-purple-500/30 hover:bg-purple-500/20 hover:border-purple-500 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all"
              >
                <Calendar className="h-4 w-4 text-purple-400" />
                Agenda
              </Button>
            </motion.div>

            {/* Alert Banner */}
            {pendingPayments > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                onClick={() => navigate("/pagamentos")}
                className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 cursor-pointer hover:bg-amber-500/20 transition-all group"
              >
                <div className="p-2 rounded-lg bg-amber-500/20">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-400">Atenção: {pendingPayments} pagamentos pendentes</p>
                  <p className="text-xs text-muted-foreground">Clique para ver detalhes</p>
                </div>
                <ChevronRight className="h-5 w-5 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            )}
          </div>

          {/* Right: AI Avatar Display */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="lg:col-span-2 flex items-center justify-center"
          >
            <div className="relative w-48 h-48 md:w-56 md:h-56">
              {/* Outer Ring */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-dashed border-primary/30"
                animate={{ rotate: 360 }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              />
              
              {/* Middle Ring with Gradient */}
              <motion.div
                className="absolute inset-4 rounded-full"
                style={{
                  background: `conic-gradient(from 0deg, hsl(var(--primary) / 0.3), transparent, hsl(var(--primary) / 0.3))`,
                }}
                animate={{ rotate: -360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              />
              
              {/* Inner Ring */}
              <motion.div
                className="absolute inset-8 rounded-full border border-primary/50"
                animate={{ rotate: 180 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              />
              
              {/* Center Bot */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  className="p-5 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 backdrop-blur-xl border border-primary/40"
                  animate={{ 
                    boxShadow: [
                      "0 0 20px hsl(var(--primary) / 0.3)",
                      "0 0 50px hsl(var(--primary) / 0.5)",
                      "0 0 20px hsl(var(--primary) / 0.3)",
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Bot className="h-12 w-12 md:h-14 md:w-14 text-primary" />
                </motion.div>
              </div>

              {/* Orbiting Particles */}
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="absolute top-1/2 left-1/2"
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 6 + i * 2,
                    repeat: Infinity,
                    ease: "linear",
                    delay: i * 0.3,
                  }}
                >
                  <motion.div 
                    className="w-2 h-2 rounded-full bg-primary"
                    style={{
                      transform: `translateX(${60 + i * 12}px) translateY(-50%)`,
                      boxShadow: `0 0 10px hsl(var(--primary))`,
                    }}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <CyberMetricCard 
            icon={DollarSign}
            label="Lucro Líquido"
            value={formatCurrency(profit)}
            trend={profit > 0 ? "up" : profit < 0 ? "down" : "neutral"}
            color={profit >= 0 ? "green" : "primary"}
            onClick={() => navigate("/relatorios")}
            delay={0.7}
          />
          <CyberMetricCard 
            icon={Users}
            label="Alunos Ativos"
            value={students.toLocaleString()}
            trend="up"
            color="blue"
            onClick={() => navigate("/alunos")}
            delay={0.8}
          />
          <CyberMetricCard 
            icon={Target}
            label="Tarefas"
            value={`${completedToday}/${pendingTasks + completedToday}`}
            color="purple"
            onClick={() => navigate("/tarefas")}
            delay={0.9}
          />
          <CyberMetricCard 
            icon={Sparkles}
            label="Afiliados"
            value={affiliates.toLocaleString()}
            trend="up"
            color="gold"
            onClick={() => navigate("/afiliados")}
            delay={1.0}
          />
        </motion.div>
      </div>
    </motion.section>
  );
}
