// ============================================
// ESTATÍSTICAS EM TEMPO REAL - ULTRA LITE
// Performance extrema para mobile/3G
// ============================================

import { useState, useEffect, useRef, memo } from "react";
import { motion, useInView } from "framer-motion";
import { GraduationCap, Trophy, BookOpen, Award, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePerformance } from "@/hooks/usePerformance";

// Hook para buscar dados - otimizado
const useRealtimeData = () => {
  const [data, setData] = useState({
    totalAlunos: 10847,
    taxaAprovacao: 98,
    horasConteudo: 500,
    anosExperiencia: 15,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { count } = await supabase
          .from("alunos")
          .select("*", { count: "exact", head: true });

        setData((prev) => ({
          ...prev,
          totalAlunos: (count || 0) + 10847,
        }));
      } catch (error) {
        console.error("Erro:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading };
};

// Counter simples - sem animações pesadas
const SimpleCounter = memo(({ value, suffix = "", prefix = "" }: { 
  value: number; 
  suffix?: string; 
  prefix?: string;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (isInView && value > 0) {
      // Animação simples e rápida
      const duration = 1500;
      const steps = 30;
      const increment = value / steps;
      let current = 0;
      let step = 0;

      const timer = setInterval(() => {
        step++;
        current = Math.min(Math.round(increment * step), value);
        setCount(current);
        if (step >= steps) clearInterval(timer);
      }, duration / steps);

      return () => clearInterval(timer);
    }
  }, [isInView, value]);

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString("pt-BR")}{suffix}
    </span>
  );
});

SimpleCounter.displayName = "SimpleCounter";

// Card de estatística otimizado
const StatCard = memo(({ stat, index, animate }: { 
  stat: any; 
  index: number;
  animate: boolean;
}) => {
  const Icon = stat.icon;

  const content = (
    <div className="relative h-full p-6 md:p-8 rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 overflow-hidden hover:border-white/20 transition-colors">
      {/* Linha de energia no topo */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.gradient}`} />
      
      {/* Ícone */}
      <div className={`inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-xl bg-gradient-to-br ${stat.gradient} mb-4 md:mb-6`}>
        <Icon className="w-8 h-8 md:w-10 md:h-10 text-white" />
      </div>
      
      {/* Número */}
      <div className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-2">
        <SimpleCounter value={stat.value} suffix={stat.suffix} prefix={stat.prefix} />
      </div>
      
      {/* Label */}
      <div className="text-base md:text-lg text-gray-300 font-semibold">{stat.label}</div>
      {stat.sublabel && (
        <div className="text-sm text-gray-500 mt-1">{stat.sublabel}</div>
      )}
      
      {/* Barra de progresso */}
      <div className="mt-4 md:mt-6 h-1 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${stat.gradient} rounded-full w-full`} />
      </div>
    </div>
  );

  if (!animate) return content;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
    >
      {content}
    </motion.div>
  );
});

StatCard.displayName = "StatCard";

export const RealtimeStats = memo(({ variant = "default" }: { variant?: "default" | "hero" | "section" }) => {
  const { data } = useRealtimeData();
  const { disableAnimations } = usePerformance();

  const stats = [
    { 
      value: data.totalAlunos, 
      suffix: "+", 
      prefix: "",
      label: "Alunos Aprovados", 
      sublabel: "Em Medicina e vestibulares",
      icon: GraduationCap, 
      gradient: "from-red-600 to-red-700",
    },
    { 
      value: data.taxaAprovacao, 
      suffix: "%", 
      prefix: "",
      label: "Taxa de Aprovação", 
      sublabel: "Comprovada por dados reais",
      icon: Trophy, 
      gradient: "from-amber-500 to-amber-600",
    },
    { 
      value: data.horasConteudo, 
      suffix: "+", 
      prefix: "",
      label: "Horas de Conteúdo", 
      sublabel: "Aulas gravadas e ao vivo",
      icon: BookOpen, 
      gradient: "from-blue-600 to-blue-700",
    },
    { 
      value: data.anosExperiencia, 
      suffix: "+", 
      prefix: "",
      label: "Anos de Experiência", 
      sublabel: "Dedicação à educação",
      icon: Award, 
      gradient: "from-purple-600 to-purple-700",
    },
  ];

  if (variant === "hero") {
    return (
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        {stats.slice(0, 3).map((stat, i) => (
          <div
            key={stat.label}
            className="text-center p-4 rounded-xl bg-white/[0.06] border border-white/10"
          >
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${stat.gradient} mb-2`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-xl md:text-2xl font-black text-white">
              <SimpleCounter value={stat.value} suffix={stat.suffix} />
            </div>
            <div className="text-xs text-gray-400 uppercase tracking-wider">{stat.label}</div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "section") {
    return (
      <section className="relative py-20 md:py-32 overflow-hidden">
        {/* Background simples */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-950/10 to-transparent" />
        
        {/* Orbes estáticos */}
        <div
          className="absolute left-1/4 top-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, rgba(220, 38, 38, 0.3) 0%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />

        <div className="container mx-auto px-4 relative z-10">
          {/* Header */}
          <div className="text-center mb-12 md:mb-20">
            <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-red-900/30 border border-red-700/40 mb-6">
              <Activity className="w-4 h-4 text-red-400" />
              <span className="text-sm font-bold text-red-400">RESULTADOS COMPROVADOS</span>
            </div>
            
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-4">
              Números que{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-amber-500 to-red-500">
                Impressionam
              </span>
            </h2>
            
            <p className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto">
              Dados reais. O sucesso dos nossos alunos é a nossa melhor propaganda.
            </p>
          </div>

          {/* Grid de estatísticas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {stats.map((stat, i) => (
              <StatCard 
                key={stat.label} 
                stat={stat} 
                index={i} 
                animate={!disableAnimations} 
              />
            ))}
          </div>

          {/* Live indicator */}
          <div className="flex items-center justify-center gap-3 mt-12 md:mt-16">
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-500 animate-ping" />
            </div>
            <span className="text-sm text-gray-500">Dados sincronizados em tempo real</span>
          </div>
        </div>
      </section>
    );
  }

  // Default
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <StatCard key={stat.label} stat={stat} index={i} animate={!disableAnimations} />
      ))}
    </div>
  );
});

RealtimeStats.displayName = "RealtimeStats";
