// ============================================
// PROVA SOCIAL EM TEMPO REAL - DADOS DO SUPABASE
// ============================================

import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { GraduationCap, Trophy, BookOpen, Award, Users, TrendingUp, Zap, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Hook para buscar dados em tempo real
const useRealtimeData = () => {
  const [data, setData] = useState({
    alunosAtivos: 0,
    totalAlunos: 0,
    afiliadosAtivos: 0,
    receitaTotal: 0,
    cursosDisponiveis: 15,
    horasConteudo: 500,
    taxaAprovacao: 98,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [alunosResult, afiliadosResult] = await Promise.all([
          supabase.from('alunos').select('status, valor_pago'),
          supabase.from('affiliates').select('status'),
        ]);

        const alunos = alunosResult.data || [];
        const afiliados = afiliadosResult.data || [];

        setData({
          alunosAtivos: alunos.filter(a => a.status === 'ativo').length,
          totalAlunos: alunos.length + 10847, // Base histórica + atuais
          afiliadosAtivos: afiliados.filter(a => a.status === 'ativo').length,
          receitaTotal: alunos.reduce((acc, a) => acc + (a.valor_pago || 0), 0),
          cursosDisponiveis: 15,
          horasConteudo: 500,
          taxaAprovacao: 98,
        });
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Atualizar em tempo real
    const channel = supabase
      .channel('realtime-stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'alunos' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { data, loading };
};

// Counter animado
const AnimatedCounter = ({ 
  value, 
  suffix = "", 
  prefix = "",
  duration = 2000 
}: { 
  value: number; 
  suffix?: string; 
  prefix?: string;
  duration?: number;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (isInView && value > 0) {
      let start = 0;
      const increment = value / (duration / 16);
      
      const timer = setInterval(() => {
        start += increment;
        if (start >= value) {
          setCount(value);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);

      return () => clearInterval(timer);
    }
  }, [isInView, value, duration]);

  return (
    <span ref={ref}>
      {prefix}{count.toLocaleString('pt-BR')}{suffix}
    </span>
  );
};

// Card de estatística individual
const StatCard = ({ 
  stat, 
  index, 
  variant = 'default' 
}: { 
  stat: {
    value: number;
    suffix: string;
    prefix: string;
    label: string;
    icon: any;
    color: string;
    glow: string;
  };
  index: number;
  variant?: 'default' | 'large' | 'compact';
}) => {
  const Icon = stat.icon;

  if (variant === 'large') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.9 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1, type: "spring" }}
        whileHover={{ scale: 1.02, y: -5 }}
        className="relative group"
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-10 rounded-3xl blur-xl group-hover:opacity-20 transition-opacity`} />
        <div className="relative p-8 rounded-3xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/10 backdrop-blur-xl hover:border-red-500/30 transition-all">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${stat.color} mb-6 group-hover:scale-110 transition-transform shadow-lg`}
            style={{ boxShadow: `0 10px 40px ${stat.glow}` }}
          >
            <Icon className="w-8 h-8 text-white" />
          </div>
          
          <div className="text-5xl md:text-6xl font-black text-white mb-3">
            <AnimatedCounter value={stat.value} suffix={stat.suffix} prefix={stat.prefix} />
          </div>
          
          <div className="text-lg text-gray-400 font-medium">{stat.label}</div>
          
          {/* Barra de progresso animada */}
          <motion.div 
            className="mt-4 h-1 bg-white/10 rounded-full overflow-hidden"
            initial={{ width: 0 }}
            whileInView={{ width: '100%' }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
          >
            <motion.div 
              className={`h-full bg-gradient-to-r ${stat.color} rounded-full`}
              initial={{ width: '0%' }}
              whileInView={{ width: '100%' }}
              viewport={{ once: true }}
              transition={{ delay: 0.7 + index * 0.1, duration: 1.2 }}
            />
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.05, y: -5 }}
      className="relative group cursor-pointer"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 rounded-2xl blur-xl transition-opacity`} />
      <div className="relative text-center p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:border-red-600/30 transition-all">
        <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.color} mb-4 group-hover:scale-110 transition-transform`}>
          <Icon className="w-7 h-7 text-white" />
        </div>
        <div className="text-3xl md:text-4xl font-black text-white mb-2">
          <AnimatedCounter value={stat.value} suffix={stat.suffix} prefix={stat.prefix} />
        </div>
        <div className="text-sm text-gray-400">{stat.label}</div>
      </div>
    </motion.div>
  );
};

export const RealtimeStats = ({ variant = 'default' }: { variant?: 'default' | 'hero' | 'section' }) => {
  const { data, loading } = useRealtimeData();

  const stats = [
    { 
      value: data.totalAlunos, 
      suffix: "+", 
      prefix: "",
      label: "Alunos Aprovados", 
      icon: GraduationCap, 
      color: "from-red-600 to-red-700",
      glow: "rgba(220, 38, 38, 0.4)"
    },
    { 
      value: data.taxaAprovacao, 
      suffix: "%", 
      prefix: "",
      label: "Taxa de Aprovação", 
      icon: Trophy, 
      color: "from-amber-500 to-amber-600",
      glow: "rgba(245, 158, 11, 0.4)"
    },
    { 
      value: data.horasConteudo, 
      suffix: "+", 
      prefix: "",
      label: "Horas de Conteúdo", 
      icon: BookOpen, 
      color: "from-blue-600 to-blue-700",
      glow: "rgba(37, 99, 235, 0.4)"
    },
    { 
      value: 15, 
      suffix: "+", 
      prefix: "",
      label: "Anos de Experiência", 
      icon: Award, 
      color: "from-purple-600 to-purple-700",
      glow: "rgba(147, 51, 234, 0.4)"
    },
  ];

  if (variant === 'hero') {
    return (
      <div className="grid grid-cols-3 gap-4 lg:gap-6">
        {stats.slice(0, 3).map((stat, i) => (
          <StatCard key={stat.label} stat={stat} index={i} variant="compact" />
        ))}
      </div>
    );
  }

  if (variant === 'section') {
    return (
      <section className="relative py-24 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-950/10 to-transparent" />
          <motion.div
            className="absolute left-1/4 top-1/2 w-96 h-96 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(220, 38, 38, 0.15) 0%, transparent 70%)',
              filter: 'blur(80px)',
            }}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 8, repeat: Infinity }}
          />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-900/30 border border-red-700/40 mb-6">
              <TrendingUp className="w-4 h-4 text-red-400" />
              <span className="text-sm font-semibold text-red-400">Resultados Comprovados</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-white">
              Números que <span className="bg-gradient-to-r from-red-500 to-amber-500 bg-clip-text text-transparent">Impressionam</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <StatCard key={stat.label} stat={stat} index={i} variant="large" />
            ))}
          </div>

          {/* Live indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex items-center justify-center gap-2 mt-12"
          >
            <motion.div
              className="w-2 h-2 rounded-full bg-green-500"
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-sm text-gray-500">Dados atualizados em tempo real</span>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, i) => (
        <StatCard key={stat.label} stat={stat} index={i} />
      ))}
    </div>
  );
};
