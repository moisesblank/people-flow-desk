// ============================================
// FEATURES/VANTAGENS SECTION - ANO 2300
// ============================================

import { motion } from "framer-motion";
import { 
  Brain, 
  Sparkles, 
  Zap, 
  Target,
  BookOpen,
  Video,
  Calendar,
  BarChart3,
  MessageCircle,
  Layers,
  FileQuestion,
  Clock,
  Trophy,
  Lightbulb,
  Network,
  Cpu
} from "lucide-react";

const features = [
  {
    icon: <Layers className="w-7 h-7" />,
    title: "Flashcards ANKI",
    description: "Sistema de repetição espaçada com IA que memoriza seu progresso e adapta os cards ao seu ritmo de aprendizado.",
    color: "pink",
    badge: "IA Adaptativa"
  },
  {
    icon: <BarChart3 className="w-7 h-7" />,
    title: "Métricas em Tempo Real",
    description: "Dashboard holográfico com análise de desempenho, pontos fortes, fracos e previsão de nota no ENEM.",
    color: "purple",
    badge: "Analytics 3D"
  },
  {
    icon: <FileQuestion className="w-7 h-7" />,
    title: "Simulados Adaptativos",
    description: "Provas personalizadas pela IA que aumentam a dificuldade conforme você evolui. Correção instantânea.",
    color: "blue",
    badge: "Auto-Ajuste"
  },
  {
    icon: <Brain className="w-7 h-7" />,
    title: "IA Integrativa TRAMON",
    description: "Assistente neural 24/7 que responde dúvidas, explica conceitos e cria planos de estudo personalizados.",
    color: "green",
    badge: "GPT-5 + Gemini"
  },
  {
    icon: <Network className="w-7 h-7" />,
    title: "Mapas Mentais 3D",
    description: "Visualização holográfica de conceitos interconectados. Navegue pela química como nunca antes.",
    color: "cyan",
    badge: "Holográfico"
  },
  {
    icon: <Target className="w-7 h-7" />,
    title: "Provas Anteriores",
    description: "Banco com +10.000 questões de ENEM e vestibulares, todas resolvidas em vídeo e comentadas.",
    color: "orange",
    badge: "10.000+ Questões"
  },
  {
    icon: <Calendar className="w-7 h-7" />,
    title: "Cronograma Inteligente",
    description: "Plano de estudos que se adapta automaticamente à sua rotina, metas e tempo disponível.",
    color: "yellow",
    badge: "Auto-Organiza"
  },
  {
    icon: <Video className="w-7 h-7" />,
    title: "Videoaulas 4K HDR",
    description: "Mais de 500 horas de conteúdo em qualidade cinematográfica. Aprenda com animações 3D exclusivas.",
    color: "red",
    badge: "500h+ Conteúdo"
  },
  {
    icon: <Lightbulb className="w-7 h-7" />,
    title: "Resoluções em Vídeo",
    description: "Cada questão com resolução detalhada em vídeo. Entenda o raciocínio por trás de cada resposta.",
    color: "emerald",
    badge: "Step-by-Step"
  },
  {
    icon: <MessageCircle className="w-7 h-7" />,
    title: "Comunicação Inteligente",
    description: "Fórum com IA moderadora, grupos de estudo e monitoria 24h com resposta em até 72h.",
    color: "violet",
    badge: "Suporte 24/7"
  },
  {
    icon: <Cpu className="w-7 h-7" />,
    title: "Processamento Quântico",
    description: "Infraestrutura de ponta que suporta 5.000+ alunos simultâneos sem lag ou quedas.",
    color: "slate",
    badge: "99.99% Uptime"
  },
  {
    icon: <Trophy className="w-7 h-7" />,
    title: "Gamificação Total",
    description: "Sistema de XP, rankings, conquistas e prêmios reais. Estude jogando e vença o ENEM.",
    color: "amber",
    badge: "Ranking Global"
  }
];

const FeatureCard = ({ feature, index }: { feature: typeof features[0]; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.05 }}
    viewport={{ once: true }}
    className="group relative"
  >
    {/* Glow Effect */}
    <div className={`absolute inset-0 bg-${feature.color}-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500`} />
    
    <div className={`relative h-full p-6 rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl hover:border-${feature.color}-500/50 transition-all duration-300 overflow-hidden`}>
      {/* Top Glow Line */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-${feature.color}-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
      
      {/* Badge */}
      <div className={`absolute top-4 right-4 px-2 py-1 rounded-full text-xs font-bold bg-${feature.color}-500/20 text-${feature.color}-400 border border-${feature.color}-500/30`}>
        {feature.badge}
      </div>
      
      {/* Icon */}
      <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br from-${feature.color}-500/30 to-${feature.color}-600/20 text-${feature.color}-400 mb-4 group-hover:scale-110 transition-transform`}>
        {feature.icon}
      </div>
      
      {/* Content */}
      <h3 className="text-xl font-bold text-white mb-2 group-hover:text-pink-300 transition-colors">
        {feature.title}
      </h3>
      <p className="text-gray-400 text-sm leading-relaxed">
        {feature.description}
      </p>
      
      {/* Hover Arrow */}
      <motion.div 
        className="mt-4 flex items-center gap-2 text-pink-400 opacity-0 group-hover:opacity-100 transition-opacity"
        whileHover={{ x: 5 }}
      >
        <span className="text-sm font-medium">Explorar</span>
        <Zap className="w-4 h-4" />
      </motion.div>
      
      {/* Corner Decoration */}
      <div className={`absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-${feature.color}-500/10 to-transparent rounded-tl-full`} />
    </div>
  </motion.div>
);

export const FeaturesSection = () => {
  return (
    <section id="vantagens" className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-950 to-black" />
      
      {/* Neural Network Background */}
      <div className="absolute inset-0 opacity-10">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-pink-500"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              scale: [1, 2, 1],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Connecting Lines */}
      <svg className="absolute inset-0 w-full h-full opacity-10" preserveAspectRatio="none">
        {[...Array(8)].map((_, i) => (
          <motion.line
            key={i}
            x1={`${10 + i * 12}%`}
            y1="0%"
            x2={`${20 + i * 10}%`}
            y2="100%"
            stroke="url(#pinkGradient)"
            strokeWidth="1"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 3, delay: i * 0.2, repeat: Infinity, repeatType: "reverse" }}
          />
        ))}
        <defs>
          <linearGradient id="pinkGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#EC4899" stopOpacity="0" />
            <stop offset="50%" stopColor="#EC4899" stopOpacity="1" />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          {/* Badge */}
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 mb-6"
          >
            <Cpu className="w-4 h-4 text-pink-400" />
            <span className="text-sm font-medium text-pink-300">Tecnologia do Ano 2300</span>
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          </motion.div>

          <h2 className="text-4xl md:text-6xl font-black mb-4">
            <span className="text-white">Recursos </span>
            <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
              do Futuro
            </span>
          </h2>
          
          <p className="text-gray-400 max-w-3xl mx-auto text-lg">
            Plataforma equipada com as tecnologias mais avançadas do universo educacional. 
            IA, automação e gamificação trabalhando juntos pela sua aprovação.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {features.map((feature, i) => (
            <FeatureCard key={i} feature={feature} index={i} />
          ))}
        </div>

        {/* Bottom Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 p-8 rounded-3xl border border-white/10 bg-black/60 backdrop-blur-xl"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: "500h+", label: "Videoaulas", icon: <Video className="w-6 h-6" /> },
              { number: "10k+", label: "Questões", icon: <FileQuestion className="w-6 h-6" /> },
              { number: "24/7", label: "Suporte IA", icon: <Brain className="w-6 h-6" /> },
              { number: "99.99%", label: "Uptime", icon: <Zap className="w-6 h-6" /> },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="space-y-2"
              >
                <div className="inline-flex p-3 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-400 mx-auto">
                  {stat.icon}
                </div>
                <div className="text-3xl md:text-4xl font-black bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
                  {stat.number}
                </div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <a
            href="https://www.moisesmedeiros.com.br"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-10 py-5 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 text-white font-bold text-lg hover:scale-105 transition-transform shadow-2xl shadow-pink-500/40"
          >
            <Sparkles className="w-5 h-5" />
            Quero Todas Essas Vantagens
            <Zap className="w-5 h-5" />
          </a>
        </motion.div>
      </div>
    </section>
  );
};
