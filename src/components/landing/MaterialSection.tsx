// ============================================
// MATERIAL DIDÁTICO SECTION - FUTURISTA 2300
// ============================================

import { motion } from "framer-motion";
import { 
  BookOpen, 
  Sparkles, 
  Download, 
  Brain, 
  Smartphone,
  Monitor,
  Layers,
  FileText,
  Video,
  Headphones,
  Zap,
  Award,
  CheckCircle
} from "lucide-react";

const materials = [
  {
    title: "Química Geral",
    description: "Fundamentos completos com exercícios resolvidos",
    icon: <BookOpen className="w-6 h-6" />,
    color: "pink"
  },
  {
    title: "Química Orgânica",
    description: "Reações e mecanismos explicados com IA",
    icon: <Layers className="w-6 h-6" />,
    color: "purple"
  },
  {
    title: "Revisão Cíclica",
    description: "Sistema inteligente de repetição espaçada",
    icon: <Brain className="w-6 h-6" />,
    color: "blue"
  },
  {
    title: "Flashcards ANKI",
    description: "Questões personalizadas pela IA",
    icon: <FileText className="w-6 h-6" />,
    color: "green"
  },
  {
    title: "Videoaulas 4K",
    description: "Mais de 500 horas de conteúdo premium",
    icon: <Video className="w-6 h-6" />,
    color: "orange"
  },
  {
    title: "Podcasts de Química",
    description: "Estude enquanto caminha ou dirige",
    icon: <Headphones className="w-6 h-6" />,
    color: "cyan"
  }
];

const features = [
  "Material atualizado para ENEM 2026",
  "Mais de 10.000 questões resolvidas",
  "Mapas mentais interativos",
  "Calendário de estudos com IA",
  "Simulados semanais",
  "Correção de redação",
  "Grupo exclusivo de alunos",
  "Certificado de conclusão"
];

export const MaterialSection = () => {
  return (
    <section id="material" className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-950 to-black" />
      
      {/* Animated Lines */}
      <div className="absolute inset-0">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-px w-full bg-gradient-to-r from-transparent via-pink-500/30 to-transparent"
            style={{ top: `${20 + i * 15}%` }}
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 15 + i * 2, repeat: Infinity, ease: "linear" }}
          />
        ))}
      </div>

      {/* Glowing Orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 60%)', filter: 'blur(80px)' }}
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 10, repeat: Infinity }}
      />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 mb-6"
          >
            <BookOpen className="w-4 h-4 text-pink-400" />
            <span className="text-sm font-medium text-pink-300">Material Exclusivo</span>
            <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
          </motion.div>

          <h2 className="text-4xl md:text-6xl font-black mb-4">
            <span className="text-white">O </span>
            <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">melhor </span>
            <span className="text-white">material</span>
          </h2>
          <h3 className="text-3xl md:text-5xl font-black">
            <span className="text-white">didático do </span>
            <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">Brasil</span>
          </h3>
          
          <p className="text-gray-400 max-w-3xl mx-auto text-lg mt-6">
            Desenvolvido pelo professor de química que mais aprova em federais de medicina. 
            Material exclusivo que transforma seu estudo em aprovação!
          </p>
        </motion.div>

        {/* Material Cards Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {materials.map((material, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="group relative"
            >
              {/* Glow */}
              <div className={`absolute inset-0 bg-${material.color}-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity`} />
              
              <div className={`relative p-6 rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl hover:border-${material.color}-500/50 transition-all duration-300`}>
                {/* Icon */}
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br from-${material.color}-500/30 to-${material.color}-600/20 text-${material.color}-400 mb-4`}>
                  {material.icon}
                </div>
                
                <h4 className="text-xl font-bold text-white mb-2">{material.title}</h4>
                <p className="text-gray-400">{material.description}</p>
                
                {/* Hover Effect */}
                <motion.div
                  className="mt-4 flex items-center gap-2 text-pink-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  whileHover={{ x: 5 }}
                >
                  <span className="text-sm font-medium">Acessar conteúdo</span>
                  <Zap className="w-4 h-4" />
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Features List */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="relative rounded-3xl border border-white/10 bg-black/60 backdrop-blur-xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-pink-500/20 p-6 border-b border-white/10">
              <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                <Award className="w-6 h-6 text-pink-400" />
                O que está incluso no seu acesso
              </h3>
            </div>
            
            {/* Features Grid */}
            <div className="p-6 grid md:grid-cols-2 gap-4">
              {features.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-pink-500/10 transition-colors"
                >
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-gray-300">{feature}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Platforms */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <p className="text-gray-400 mb-6">Acesse de qualquer dispositivo:</p>
          <div className="flex justify-center gap-8">
            {[
              { icon: <Monitor className="w-8 h-8" />, label: "Desktop" },
              { icon: <Smartphone className="w-8 h-8" />, label: "Mobile" },
              { icon: <Download className="w-8 h-8" />, label: "Download" }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="flex flex-col items-center gap-2 text-gray-400 hover:text-pink-400 transition-colors"
              >
                {item.icon}
                <span className="text-sm">{item.label}</span>
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
            <BookOpen className="w-5 h-5" />
            Quero esse Material Agora
            <Sparkles className="w-5 h-5" />
          </a>
        </motion.div>
      </div>
    </section>
  );
};
