// ============================================
// SEÇÃO IA + AUTOMAÇÕES - TRAMON v8
// Demonstração das tecnologias integradas
// ============================================

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Brain, Cpu, Zap, Sparkles, Bot, MessageSquare, 
  BarChart3, Clock, Shield, Rocket, ArrowRight,
  CheckCircle, Play, Pause, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";

const automations = [
  {
    id: 'tramon',
    icon: Brain,
    title: 'TRAMON v8',
    subtitle: 'Assistente IA Multimodal',
    description: 'IA avançada que entende texto, voz, imagens e PDFs. Tire dúvidas 24h sobre qualquer conteúdo.',
    features: ['Análise de exercícios', 'Correção de redações', 'Explicações personalizadas'],
    color: 'from-purple-600 to-violet-700',
    glow: 'rgba(147, 51, 234, 0.4)',
  },
  {
    id: 'study',
    icon: Sparkles,
    title: 'Estudo Adaptativo',
    subtitle: 'Aprendizado Inteligente',
    description: 'Sistema que identifica suas dificuldades e adapta o conteúdo ao seu ritmo de aprendizado.',
    features: ['Trilhas personalizadas', 'Revisão espaçada', 'Metas automáticas'],
    color: 'from-amber-500 to-orange-600',
    glow: 'rgba(245, 158, 11, 0.4)',
  },
  {
    id: 'monitor',
    icon: BarChart3,
    title: 'Monitoramento 360°',
    subtitle: 'Analytics Avançado',
    description: 'Dashboard completo com seu progresso, pontos fortes e áreas de melhoria em tempo real.',
    features: ['Gráficos de evolução', 'Comparativo com turma', 'Previsão de nota'],
    color: 'from-blue-600 to-cyan-600',
    glow: 'rgba(37, 99, 235, 0.4)',
  },
  {
    id: 'support',
    icon: MessageSquare,
    title: 'Suporte Premium',
    subtitle: 'Atendimento 24/7',
    description: 'Equipe especializada e IA trabalhando juntos para resolver suas dúvidas instantaneamente.',
    features: ['WhatsApp integrado', 'Respostas em segundos', 'Monitores online'],
    color: 'from-green-600 to-emerald-600',
    glow: 'rgba(34, 197, 94, 0.4)',
  },
];

const NetworkAnimation = () => {
  const nodes = 20;
  const connections: { from: number; to: number }[] = [];
  
  for (let i = 0; i < nodes; i++) {
    for (let j = i + 1; j < nodes; j++) {
      if (Math.random() > 0.85) {
        connections.push({ from: i, to: j });
      }
    }
  }

  return (
    <div className="absolute inset-0 overflow-hidden opacity-20">
      <svg className="w-full h-full">
        {connections.map((conn, i) => {
          const x1 = ((conn.from % 5) / 5) * 100 + 10;
          const y1 = (Math.floor(conn.from / 5) / 4) * 100 + 10;
          const x2 = ((conn.to % 5) / 5) * 100 + 10;
          const y2 = (Math.floor(conn.to / 5) / 4) * 100 + 10;
          
          return (
            <motion.line
              key={i}
              x1={`${x1}%`}
              y1={`${y1}%`}
              x2={`${x2}%`}
              y2={`${y2}%`}
              stroke="url(#gradient)"
              strokeWidth="1"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: [0, 0.5, 0] }}
              transition={{
                duration: 3,
                delay: i * 0.1,
                repeat: Infinity,
                repeatDelay: 2,
              }}
            />
          );
        })}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

const AutomationCard = ({ 
  automation, 
  index, 
  isActive, 
  onClick 
}: { 
  automation: typeof automations[0];
  index: number;
  isActive: boolean;
  onClick: () => void;
}) => {
  const Icon = automation.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      onClick={onClick}
      className={`relative cursor-pointer group ${isActive ? 'scale-105' : ''}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${automation.color} opacity-0 group-hover:opacity-10 rounded-2xl blur-xl transition-opacity duration-500`} />
      
      <div className={`relative p-6 rounded-2xl border transition-all duration-300 ${
        isActive 
          ? `bg-gradient-to-br ${automation.color} border-white/20` 
          : 'bg-white/5 border-white/10 hover:border-white/20'
      }`}>
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${isActive ? 'bg-white/20' : `bg-gradient-to-br ${automation.color}`}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-1">{automation.title}</h3>
            <p className={`text-sm ${isActive ? 'text-white/80' : 'text-gray-400'}`}>
              {automation.subtitle}
            </p>
          </div>

          <motion.div
            animate={{ rotate: isActive ? 90 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <ArrowRight className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
          </motion.div>
        </div>

        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-white/20"
            >
              <p className="text-white/90 text-sm mb-4">{automation.description}</p>
              <div className="space-y-2">
                {automation.features.map((feature, i) => (
                  <motion.div
                    key={feature}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-2 text-sm text-white/80"
                  >
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    {feature}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const AIVisualization = ({ activeAutomation }: { activeAutomation: typeof automations[0] | null }) => {
  const Icon = activeAutomation?.icon || Brain;

  return (
    <motion.div
      className="relative h-full min-h-[400px] rounded-3xl overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${activeAutomation ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.6)'} 0%, rgba(0,0,0,0.95) 100%)`,
      }}
    >
      <NetworkAnimation />
      
      {/* Central orb */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="relative"
          animate={{
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          {/* Outer rings */}
          {[1, 2, 3].map((ring) => (
            <motion.div
              key={ring}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
              style={{
                width: 80 + ring * 60,
                height: 80 + ring * 60,
                borderColor: activeAutomation 
                  ? `rgba(220, 38, 38, ${0.3 - ring * 0.08})` 
                  : `rgba(255, 255, 255, ${0.1 - ring * 0.02})`,
              }}
              animate={{
                rotate: ring % 2 === 0 ? 360 : -360,
                scale: [1, 1.05, 1],
              }}
              transition={{
                rotate: { duration: 10 + ring * 5, repeat: Infinity, ease: "linear" },
                scale: { duration: 3, repeat: Infinity },
              }}
            />
          ))}

          {/* Central icon */}
          <motion.div
            className={`relative w-24 h-24 rounded-full bg-gradient-to-br ${activeAutomation?.color || 'from-red-600 to-purple-600'} flex items-center justify-center`}
            style={{
              boxShadow: `0 0 60px ${activeAutomation?.glow || 'rgba(220, 38, 38, 0.5)'}`,
            }}
            animate={{
              boxShadow: [
                `0 0 60px ${activeAutomation?.glow || 'rgba(220, 38, 38, 0.5)'}`,
                `0 0 100px ${activeAutomation?.glow || 'rgba(220, 38, 38, 0.7)'}`,
                `0 0 60px ${activeAutomation?.glow || 'rgba(220, 38, 38, 0.5)'}`,
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Icon className="w-12 h-12 text-white" />
          </motion.div>
        </motion.div>
      </div>

      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-red-500/30"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0.2, 0.6, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}

      {/* Info overlay */}
      <AnimatePresence mode="wait">
        {activeAutomation && (
          <motion.div
            key={activeAutomation.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-black/60 backdrop-blur-xl border border-white/10"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${activeAutomation.color}`}>
                <activeAutomation.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-white font-bold">{activeAutomation.title}</h4>
                <p className="text-gray-400 text-sm">{activeAutomation.subtitle}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const AIAutomationsSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeAutomation = automations[activeIndex];

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-950/10 to-transparent" />
        <motion.div
          className="absolute right-0 top-1/4 w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(147, 51, 234, 0.15) 0%, transparent 70%)',
            filter: 'blur(100px)',
          }}
          animate={{
            x: [0, 50, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 15, repeat: Infinity }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-900/30 border border-purple-700/40 mb-6"
          >
            <Cpu className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-semibold text-purple-400">Tecnologia de Ponta</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-black text-white mb-6"
          >
            IA & Automações do <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">Futuro</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-400 max-w-2xl mx-auto"
          >
            Tecnologias avançadas trabalhando 24/7 para maximizar seu aprendizado
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Cards de automação */}
          <div className="space-y-4">
            {automations.map((automation, i) => (
              <AutomationCard
                key={automation.id}
                automation={automation}
                index={i}
                isActive={i === activeIndex}
                onClick={() => setActiveIndex(i)}
              />
            ))}
          </div>

          {/* Visualização */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <AIVisualization activeAutomation={activeAutomation} />
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <Button
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-0 shadow-xl shadow-purple-500/30 px-8 h-14 text-lg font-bold"
          >
            <Rocket className="w-5 h-5 mr-2" />
            Experimentar Tecnologias
          </Button>
        </motion.div>
      </div>
    </section>
  );
};
