// ============================================
// IA & AUTOMAÇÕES 2500 - TRAMON v8
// Demonstração futurista das tecnologias
// ============================================

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Brain, Cpu, Zap, Sparkles, Bot, MessageSquare, 
  BarChart3, Shield, Rocket, ArrowRight,
  CheckCircle, Activity, Atom, Network, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const automations = [
  {
    id: 'tramon',
    icon: Brain,
    title: 'TRAMON v8',
    subtitle: 'Assistente IA Multimodal',
    description: 'IA avançada do futuro que entende texto, voz, imagens e PDFs. Tire dúvidas 24h sobre qualquer conteúdo de química.',
    features: ['Análise instantânea de exercícios', 'Correção de redações com IA', 'Explicações personalizadas 3D'],
    gradient: 'from-purple-600 via-violet-600 to-purple-700',
    glow: 'rgba(147, 51, 234, 0.5)',
    stats: { usuarios: '8.500+', satisfacao: '99%' },
  },
  {
    id: 'study',
    icon: Sparkles,
    title: 'Estudo Adaptativo',
    subtitle: 'Aprendizado Inteligente',
    description: 'Sistema quântico que identifica suas dificuldades e adapta o conteúdo ao seu ritmo de aprendizado em tempo real.',
    features: ['Trilhas 100% personalizadas', 'Revisão espaçada automática', 'Metas inteligentes'],
    gradient: 'from-amber-500 via-orange-500 to-amber-600',
    glow: 'rgba(245, 158, 11, 0.5)',
    stats: { eficiencia: '+47%', tempo: '-30%' },
  },
  {
    id: 'monitor',
    icon: BarChart3,
    title: 'Analytics 360°',
    subtitle: 'Monitoramento Holográfico',
    description: 'Dashboard holográfico completo com seu progresso, pontos fortes e áreas de melhoria em tempo real.',
    features: ['Gráficos de evolução 3D', 'Comparativo com turma', 'Previsão de nota por IA'],
    gradient: 'from-blue-600 via-cyan-500 to-blue-700',
    glow: 'rgba(37, 99, 235, 0.5)',
    stats: { precisao: '94%', dados: '50+' },
  },
  {
    id: 'support',
    icon: MessageSquare,
    title: 'Suporte Quântico',
    subtitle: 'Atendimento Instantâneo',
    description: 'Equipe de monitores e IA trabalhando juntos 24/7 para resolver suas dúvidas em segundos.',
    features: ['WhatsApp integrado', 'Respostas em segundos', 'Monitores online 24h'],
    gradient: 'from-green-600 via-emerald-500 to-green-700',
    glow: 'rgba(34, 197, 94, 0.5)',
    stats: { tempo: '<30s', online: '24/7' },
  },
];

// Visualização de rede neural
const NeuralNetworkVisualization = ({ activeIndex }: { activeIndex: number }) => {
  const nodes = 25;
  const activeAutomation = automations[activeIndex];
  
  return (
    <motion.div
      className="relative w-full h-full min-h-[500px] rounded-3xl overflow-hidden"
      style={{
        background: `linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(20,0,30,0.95) 100%)`,
      }}
    >
      {/* Grid holográfico */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(147, 51, 234, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(147, 51, 234, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Conexões neurais */}
      <svg className="absolute inset-0 w-full h-full opacity-30">
        {[...Array(30)].map((_, i) => {
          const x1 = Math.random() * 100;
          const y1 = Math.random() * 100;
          const x2 = Math.random() * 100;
          const y2 = Math.random() * 100;
          return (
            <motion.line
              key={i}
              x1={`${x1}%`}
              y1={`${y1}%`}
              x2={`${x2}%`}
              y2={`${y2}%`}
              stroke={`url(#neural-gradient-${activeIndex})`}
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
          <linearGradient id={`neural-gradient-${activeIndex}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={activeAutomation.glow.replace('0.5', '1')} />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Nós da rede */}
      {[...Array(nodes)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 rounded-full"
          style={{
            left: `${10 + (i % 5) * 20}%`,
            top: `${10 + Math.floor(i / 5) * 20}%`,
            background: `radial-gradient(circle, ${activeAutomation.glow.replace('0.5', '0.8')} 0%, transparent 70%)`,
            boxShadow: `0 0 20px ${activeAutomation.glow}`,
          }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}

      {/* Central orb - ícone principal */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="relative"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          {/* Anéis orbitais */}
          {[1, 2, 3].map((ring) => (
            <motion.div
              key={ring}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
              style={{
                width: 100 + ring * 50,
                height: 100 + ring * 50,
                borderColor: activeAutomation.glow.replace('0.5', `${0.3 - ring * 0.08}`),
              }}
              animate={{
                rotate: ring % 2 === 0 ? 360 : -360,
              }}
              transition={{
                duration: 8 + ring * 3,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          ))}

          {/* Ícone central */}
          <motion.div
            className={`relative w-28 h-28 rounded-full bg-gradient-to-br ${activeAutomation.gradient} flex items-center justify-center`}
            style={{
              boxShadow: `0 0 60px ${activeAutomation.glow}, 0 0 120px ${activeAutomation.glow}`,
            }}
            animate={{
              boxShadow: [
                `0 0 60px ${activeAutomation.glow}, 0 0 120px ${activeAutomation.glow}`,
                `0 0 100px ${activeAutomation.glow}, 0 0 180px ${activeAutomation.glow}`,
                `0 0 60px ${activeAutomation.glow}, 0 0 120px ${activeAutomation.glow}`,
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <activeAutomation.icon className="w-14 h-14 text-white" />
          </motion.div>
        </motion.div>
      </div>

      {/* Info overlay */}
      <motion.div
        className="absolute bottom-6 left-6 right-6 p-5 rounded-2xl bg-black/70 backdrop-blur-2xl border border-white/10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        key={activeAutomation.id}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${activeAutomation.gradient}`}>
              <activeAutomation.icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h4 className="text-white font-bold text-lg">{activeAutomation.title}</h4>
              <p className="text-gray-400 text-sm">{activeAutomation.subtitle}</p>
            </div>
          </div>
          <div className="flex gap-4">
            {Object.entries(activeAutomation.stats).map(([key, value]) => (
              <div key={key} className="text-right">
                <div className="text-white font-bold">{value}</div>
                <div className="text-xs text-gray-500 capitalize">{key}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Partículas flutuantes */}
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute w-1 h-1 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: activeAutomation.glow,
            boxShadow: `0 0 10px ${activeAutomation.glow}`,
          }}
          animate={{
            y: [0, -40, 0],
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 2, 1],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 3,
          }}
        />
      ))}
    </motion.div>
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
      initial={{ opacity: 0, x: -40 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      onClick={onClick}
      className="relative cursor-pointer group"
    >
      {/* Glow de fundo quando ativo */}
      <motion.div
        className="absolute -inset-1 rounded-2xl blur-xl"
        style={{ background: automation.glow }}
        animate={{ opacity: isActive ? 0.3 : 0 }}
      />
      
      <div className={`relative p-6 rounded-2xl border transition-all duration-300 ${
        isActive 
          ? `bg-gradient-to-br ${automation.gradient} border-white/30` 
          : 'bg-white/[0.05] border-white/10 hover:border-white/20 hover:bg-white/[0.08]'
      }`}>
        <div className="flex items-start gap-4">
          <motion.div 
            className={`p-3 rounded-xl ${isActive ? 'bg-white/20' : `bg-gradient-to-br ${automation.gradient}`}`}
            animate={{ rotate: isActive ? [0, 5, -5, 0] : 0 }}
            transition={{ duration: 0.5 }}
          >
            <Icon className="w-6 h-6 text-white" />
          </motion.div>
          
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
              className="mt-5 pt-5 border-t border-white/20"
            >
              <p className="text-white/90 text-sm mb-5">{automation.description}</p>
              <div className="space-y-3">
                {automation.features.map((feature, i) => (
                  <motion.div
                    key={feature}
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-center gap-3 text-sm text-white/85"
                  >
                    <div className="p-0.5 rounded-full bg-white/30">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
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

export const AIAutomationsSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  // Auto-rotate
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % automations.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  return (
    <section id="metodo" className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-950/10 to-transparent" />
        
        <motion.div
          className="absolute right-0 top-1/4 w-[700px] h-[700px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(147, 51, 234, 0.12) 0%, transparent 70%)',
            filter: 'blur(100px)',
          }}
          animate={{
            x: [0, 80, 0],
            y: [0, -60, 0],
          }}
          transition={{ duration: 20, repeat: Infinity }}
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-purple-900/30 border border-purple-700/40 mb-8"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            >
              <Cpu className="w-5 h-5 text-purple-400" />
            </motion.div>
            <span className="text-sm font-bold text-purple-400 tracking-wide">TECNOLOGIA DO ANO 2500</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6"
          >
            IA & Automações do <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">Futuro</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-400 max-w-2xl mx-auto"
          >
            Tecnologias quânticas avançadas trabalhando 24/7 para maximizar seu aprendizado
          </motion.p>
        </div>

        {/* Grid principal */}
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          {/* Cards de automação */}
          <div className="space-y-5">
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
            initial={{ opacity: 0, x: 60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="sticky top-24"
          >
            <NeuralNetworkVisualization activeIndex={activeIndex} />
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-20"
        >
          <Link to="/auth">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                size="lg"
                className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:to-pink-500 text-white border-0 shadow-2xl shadow-purple-500/30 px-10 h-16 text-lg font-bold rounded-xl"
              >
                <Rocket className="w-5 h-5 mr-2" />
                Experimentar Tecnologias Grátis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};
