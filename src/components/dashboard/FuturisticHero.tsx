// ============================================
// FUTURISTIC HERO 2050 - Visual Cyberpunk v1.0
// Animações avançadas, partículas, hologramas
// ============================================

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { 
  Zap, 
  Brain, 
  Sparkles, 
  Activity,
  TrendingUp,
  Users,
  Target,
  Rocket,
  ChevronRight,
  Bot,
  Cpu,
  Wifi
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface FuturisticHeroProps {
  pendingTasks: number;
  completedToday: number;
  pendingPayments: number;
  profit: number;
  students?: number;
  affiliates?: number;
}

// Animated Particles Background
function ParticlesField() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-primary/40"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 3 + Math.random() * 3,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// Holographic Grid
function HolographicGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(139, 0, 0, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139, 0, 0, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          animation: 'pulse 4s ease-in-out infinite',
        }}
      />
    </div>
  );
}

// Scanning Line Effect
function ScanLine() {
  return (
    <motion.div
      className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"
      animate={{
        top: ["0%", "100%", "0%"],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: "linear",
      }}
    />
  );
}

// AI Status Indicator
function AIStatusIndicator() {
  const [status, setStatus] = useState("analyzing");
  const statuses = ["analyzing", "processing", "ready", "syncing"];
  
  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(statuses[Math.floor(Math.random() * statuses.length)]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const statusConfig = {
    analyzing: { color: "text-blue-400", bg: "bg-blue-500/20", label: "Analisando dados..." },
    processing: { color: "text-yellow-400", bg: "bg-yellow-500/20", label: "Processando..." },
    ready: { color: "text-green-400", bg: "bg-green-500/20", label: "Sistema pronto" },
    syncing: { color: "text-purple-400", bg: "bg-purple-500/20", label: "Sincronizando..." },
  };

  const config = statusConfig[status as keyof typeof statusConfig];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${config.bg} border border-white/10`}
    >
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
        className={`w-2 h-2 rounded-full ${config.color.replace('text-', 'bg-')}`}
      />
      <span className={`text-xs font-mono ${config.color}`}>{config.label}</span>
    </motion.div>
  );
}

// Holographic Stat Card
function HoloStatCard({ icon: Icon, label, value, trend, onClick, delay = 0 }: {
  icon: any;
  label: string;
  value: string | number;
  trend?: "up" | "down" | "neutral";
  onClick?: () => void;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, rotateX: -15 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ delay, type: "spring", stiffness: 100 }}
      whileHover={{ 
        scale: 1.05, 
        rotateY: 5,
        boxShadow: "0 0 30px rgba(139, 0, 0, 0.4)"
      }}
      onClick={onClick}
      className="relative group cursor-pointer"
    >
      {/* Glow Effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 via-primary/50 to-primary/30 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="relative p-4 rounded-xl bg-background/40 backdrop-blur-xl border border-primary/20 hover:border-primary/50 transition-all">
        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary/50 rounded-tl-xl" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary/50 rounded-tr-xl" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary/50 rounded-bl-xl" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary/50 rounded-br-xl" />
        
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20 group-hover:bg-primary/40 transition-colors">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
            <div className="flex items-center gap-2">
              <motion.span 
                className="text-xl font-bold text-foreground font-mono"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: delay + 0.2 }}
              >
                {value}
              </motion.span>
              {trend === "up" && <TrendingUp className="h-4 w-4 text-green-500" />}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Main Component
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative overflow-hidden rounded-3xl min-h-[320px] bg-gradient-to-br from-[#0a0a0a] via-[#1a0505] to-[#0f0f0f]"
    >
      {/* Background Effects */}
      <ParticlesField />
      <HolographicGrid />
      <ScanLine />
      
      {/* Gradient Orbs */}
      <motion.div
        className="absolute top-0 right-0 w-96 h-96 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(139, 0, 0, 0.2) 0%, transparent 70%)',
        }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 6, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-0 left-0 w-80 h-80 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(50, 0, 0, 0.3) 0%, transparent 70%)',
        }}
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 5, repeat: Infinity }}
      />

      <div className="relative z-10 p-6 md:p-8">
        {/* Header Row */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
          {/* Left: Greeting & Time */}
          <div className="space-y-4">
            {/* AI Status & Time */}
            <div className="flex items-center gap-4">
              <AIStatusIndicator />
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/30 border border-white/10">
                <Wifi className="h-3 w-3 text-green-400" />
                <span className="text-xs font-mono text-muted-foreground">
                  {currentTime.toLocaleTimeString("pt-BR", { 
                    hour: "2-digit", 
                    minute: "2-digit",
                    second: "2-digit"
                  })}
                </span>
              </div>
            </div>

            {/* Main Greeting */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <p className="text-sm text-muted-foreground mb-1">
                {currentTime.toLocaleDateString("pt-BR", { 
                  weekday: "long", 
                  day: "numeric", 
                  month: "long",
                  year: "numeric"
                })}
              </p>
              <h1 className="text-3xl md:text-4xl font-bold">
                <span className="text-foreground">Bem-vindo, </span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-red-400 to-primary animate-pulse">
                  {userName}
                </span>
              </h1>
              <p className="text-muted-foreground mt-2 flex items-center gap-2">
                <Brain className="h-4 w-4 text-primary" />
                Central de Comando Inteligente • Synapse v15.0
              </p>
            </motion.div>

            {/* Quick Actions */}
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
                className="gap-2 bg-background/20 border-primary/30 hover:bg-primary/20 hover:border-primary"
              >
                <Target className="h-4 w-4" />
                {pendingTasks} Tarefas
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate("/whatsapp-live")}
                className="gap-2 bg-background/20 border-green-500/30 hover:bg-green-500/20 hover:border-green-500"
              >
                <Zap className="h-4 w-4 text-green-500" />
                WhatsApp Live
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate("/dashboard-executivo")}
                className="gap-2 bg-background/20 border-blue-500/30 hover:bg-blue-500/20 hover:border-blue-500"
              >
                <Activity className="h-4 w-4 text-blue-500" />
                Executivo
              </Button>
            </motion.div>
          </div>

          {/* Right: Holographic AI Display */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotateY: -20 }}
            animate={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="relative"
          >
            {/* AI Avatar Container */}
            <div className="relative w-48 h-48 md:w-56 md:h-56">
              {/* Rotating Ring */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-primary/30 border-dashed"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              />
              
              {/* Inner Ring */}
              <motion.div
                className="absolute inset-4 rounded-full border border-primary/50"
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              />
              
              {/* Center Bot Icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  className="p-6 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 backdrop-blur-xl border border-primary/40"
                  animate={{ 
                    boxShadow: [
                      "0 0 20px rgba(139, 0, 0, 0.3)",
                      "0 0 40px rgba(139, 0, 0, 0.5)",
                      "0 0 20px rgba(139, 0, 0, 0.3)",
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Bot className="h-12 w-12 md:h-16 md:w-16 text-primary" />
                </motion.div>
              </div>

              {/* Orbiting Elements */}
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{
                    top: "50%",
                    left: "50%",
                  }}
                  animate={{
                    rotate: 360,
                  }}
                  transition={{
                    duration: 8 + i * 2,
                    repeat: Infinity,
                    ease: "linear",
                    delay: i * 0.5,
                  }}
                >
                  <div 
                    className="w-3 h-3 rounded-full bg-primary/60"
                    style={{
                      transform: `translateX(${70 + i * 15}px) translateY(-50%)`,
                    }}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <HoloStatCard 
            icon={TrendingUp}
            label="Lucro"
            value={formatCurrency(profit)}
            trend={profit > 0 ? "up" : "neutral"}
            onClick={() => navigate("/relatorios")}
            delay={0.5}
          />
          <HoloStatCard 
            icon={Users}
            label="Alunos"
            value={students.toLocaleString()}
            onClick={() => navigate("/alunos")}
            delay={0.6}
          />
          <HoloStatCard 
            icon={Target}
            label="Concluídas"
            value={`${completedToday}/${pendingTasks + completedToday}`}
            onClick={() => navigate("/tarefas")}
            delay={0.7}
          />
          <HoloStatCard 
            icon={Sparkles}
            label="Afiliados"
            value={affiliates}
            onClick={() => navigate("/afiliados")}
            delay={0.8}
          />
        </div>
      </div>
    </motion.div>
  );
}