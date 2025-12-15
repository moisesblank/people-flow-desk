// ============================================
// MOISÉS MEDEIROS v7.0 - STATS COM TEMA QUÍMICA
// Gráficos e indicadores temáticos
// ============================================

import { motion } from "framer-motion";
import {
  FlaskConical,
  Atom,
  Beaker,
  TestTube,
  TrendingUp,
  TrendingDown,
  Zap,
  Target,
  Award,
  Users
} from "lucide-react";
import { AnimatedAtom, BubblingFlask, MiniPeriodicTable, ChemicalFormula } from "@/components/chemistry/ChemistryVisuals";

interface ChemistryStatsProps {
  data: {
    totalAlunos: number;
    cursosAtivos: number;
    taxaAprovacao: number;
    horasAulas: number;
    modulosConcluidos: number;
    engajamento: number;
  };
}

export function ChemistryStats({ data }: ChemistryStatsProps) {
  const stats = [
    {
      label: "Total de Alunos",
      value: data.totalAlunos,
      icon: Users,
      formula: "H₂O", // Água - base da vida
      color: "stats-blue",
      trend: "+12%"
    },
    {
      label: "Cursos Ativos",
      value: data.cursosAtivos,
      icon: FlaskConical,
      formula: "C₆H₁₂O₆", // Glicose - energia
      color: "stats-green",
      trend: "+3"
    },
    {
      label: "Taxa de Aprovação",
      value: `${data.taxaAprovacao}%`,
      icon: Award,
      formula: "Au", // Ouro
      color: "stats-gold",
      trend: "+5%"
    },
    {
      label: "Horas de Aulas",
      value: data.horasAulas,
      icon: Atom,
      formula: "NaCl", // Sal - essencial
      color: "primary",
      trend: "+24h"
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-3xl p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <Atom className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Indicadores do Curso</h3>
            <p className="text-xs text-muted-foreground">Métricas de performance</p>
          </div>
        </div>
        <AnimatedAtom size={40} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="relative p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors group"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-lg bg-[hsl(var(--${stat.color}))]/10`}>
                  <stat.icon className={`h-4 w-4 text-[hsl(var(--${stat.color}))]`} />
                </div>
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
              <span className="text-xs text-[hsl(var(--stats-green))] flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {stat.trend}
              </span>
            </div>
            
            <div className="mt-3 flex items-end justify-between">
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <motion.span 
                className="text-xs font-mono text-muted-foreground/50 group-hover:text-primary transition-colors"
                whileHover={{ scale: 1.1 }}
              >
                {stat.formula}
              </motion.span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Engajamento Visual */}
      <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-[hsl(var(--stats-gold))]" />
            <span className="text-sm font-medium text-foreground">Engajamento Geral</span>
          </div>
          <span className="text-lg font-bold text-primary">{data.engajamento}%</span>
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <motion.div
            className="h-full bg-gradient-spider"
            initial={{ width: 0 }}
            animate={{ width: `${data.engajamento}%` }}
            transition={{ duration: 1, delay: 0.5 }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>{data.modulosConcluidos} módulos concluídos</span>
          <span>Meta: 90%</span>
        </div>
      </div>
    </motion.div>
  );
}

// Card de Elemento Químico como Stat
interface ElementStatCardProps {
  symbol: string;
  number: number;
  name: string;
  value: string | number;
  label: string;
  color: string;
}

export function ElementStatCard({ symbol, number, name, value, label, color }: ElementStatCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className={`relative overflow-hidden p-4 rounded-2xl border-2 transition-colors`}
      style={{ borderColor: `hsl(var(--${color}) / 0.3)` }}
    >
      {/* Periodic table style */}
      <div className="absolute top-2 left-2 text-[10px] text-muted-foreground font-mono">
        {number}
      </div>
      
      <div className="text-center pt-4">
        <motion.span 
          className="text-4xl font-bold block"
          style={{ color: `hsl(var(--${color}))` }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {symbol}
        </motion.span>
        <span className="text-xs text-muted-foreground block mt-1">{name}</span>
      </div>

      <div className="mt-4 pt-3 border-t border-border/50 text-center">
        <p className="text-xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>

      {/* Glow effect */}
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{ background: `radial-gradient(circle at center, hsl(var(--${color})) 0%, transparent 70%)` }}
      />
    </motion.div>
  );
}

// Grid de Elementos como Dashboard
export function ElementsGrid() {
  const elements = [
    { symbol: "Au", number: 79, name: "Ouro", value: "R$ 45.2K", label: "Receita", color: "stats-gold" },
    { symbol: "Fe", number: 26, name: "Ferro", value: "156", label: "Alunos Ativos", color: "stats-purple" },
    { symbol: "O", number: 8, name: "Oxigênio", value: "98%", label: "Satisfação", color: "primary" },
    { symbol: "C", number: 6, name: "Carbono", value: "12", label: "Cursos", color: "stats-blue" },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {elements.map((el, i) => (
        <motion.div
          key={el.symbol}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
        >
          <ElementStatCard {...el} />
        </motion.div>
      ))}
    </div>
  );
}

// Reaction Progress (para mostrar conversões, etc)
export function ReactionProgress({
  from,
  to,
  progress,
  label
}: {
  from: string;
  to: string;
  progress: number;
  label: string;
}) {
  return (
    <div className="p-4 rounded-xl bg-secondary/30">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-bold text-primary">{progress}%</span>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="text-center">
          <ChemicalFormula formula={from} className="text-lg" />
          <span className="text-xs text-muted-foreground">Início</span>
        </div>
        
        <div className="flex-1 relative">
          <div className="h-2 rounded-full bg-secondary">
            <motion.div
              className="h-full rounded-full bg-gradient-spider"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
            />
          </div>
          <motion.div
            className="absolute top-1/2 -translate-y-1/2"
            style={{ left: `${progress}%` }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <Zap className="h-4 w-4 text-[hsl(var(--stats-gold))] -translate-x-1/2" />
          </motion.div>
        </div>
        
        <div className="text-center">
          <ChemicalFormula formula={to} className="text-lg" />
          <span className="text-xs text-muted-foreground">Meta</span>
        </div>
      </div>
    </div>
  );
}
