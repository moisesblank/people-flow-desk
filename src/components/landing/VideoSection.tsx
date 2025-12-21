// ============================================
// VIDEO SECTION - APRESENTAÇÃO DO CURSO
// ============================================

import { motion } from "framer-motion";
import { Play, Sparkles, Users, Clock, Award, Zap } from "lucide-react";

export const VideoSection = () => {
  return (
    <section id="video" className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-black to-slate-950" />
      
      {/* Animated Grid */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `linear-gradient(rgba(236,72,153,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.2) 1px, transparent 1px)`,
        backgroundSize: '80px 80px'
      }} />

      {/* Glowing Orbs */}
      <motion.div
        className="absolute top-1/4 -left-20 w-96 h-96 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.2) 0%, transparent 60%)', filter: 'blur(80px)' }}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 60%)', filter: 'blur(80px)' }}
        animate={{ scale: [1.2, 1, 1.2] }}
        transition={{ duration: 10, repeat: Infinity }}
      />

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          {/* Badge */}
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-pink-500/20 to-blue-500/20 border border-pink-500/30 mb-6"
          >
            <Play className="w-4 h-4 text-pink-400" />
            <span className="text-sm font-medium text-pink-300">Apresentação Oficial 2026</span>
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs text-red-400">LIVE</span>
          </motion.div>

          <h2 className="text-4xl md:text-6xl font-black mb-4">
            <span className="text-white">Conheça a </span>
            <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
              Plataforma
            </span>
          </h2>
          
          <p className="text-gray-400 max-w-3xl mx-auto text-lg">
            Descubra como nossa metodologia revolucionária está transformando a forma de estudar Química
          </p>
        </motion.div>

        {/* Video Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative max-w-5xl mx-auto"
        >
          {/* Glow Effect */}
          <div className="absolute -inset-4 bg-gradient-to-r from-pink-500/30 via-purple-500/30 to-blue-500/30 rounded-3xl blur-2xl opacity-50" />
          
          {/* Video Frame */}
          <div className="relative rounded-2xl overflow-hidden border-2 border-white/10 bg-black/80 shadow-2xl shadow-pink-500/20">
            {/* Top Bar */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-4 py-3 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Sparkles className="w-4 h-4 text-pink-400" />
                <span>Prof. Moisés Medeiros - Matrículas 2026</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-green-400">HD</span>
              </div>
            </div>

            {/* YouTube Embed */}
            <div className="aspect-video">
              <iframe
                src="https://www.youtube.com/embed/aOzCtPc7byY?rel=0&modestbranding=1"
                title="Apresentação do Curso - Prof. Moisés Medeiros"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>

          {/* Floating Stats */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            viewport={{ once: true }}
            className="absolute -left-4 top-1/3 hidden lg:block"
          >
            <div className="bg-black/90 backdrop-blur-xl border border-pink-500/30 rounded-xl p-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-pink-500/20">
                  <Users className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">2.847+</div>
                  <div className="text-xs text-gray-400">Assistindo agora</div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            viewport={{ once: true }}
            className="absolute -right-4 top-1/2 hidden lg:block"
          >
            <div className="bg-black/90 backdrop-blur-xl border border-purple-500/30 rounded-xl p-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Clock className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-white">500h+</div>
                  <div className="text-xs text-gray-400">De conteúdo</div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Features Below Video */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
        >
          {[
            { icon: <Play className="w-5 h-5" />, label: "Aulas em 4K", color: "pink" },
            { icon: <Users className="w-5 h-5" />, label: "Lives Semanais", color: "purple" },
            { icon: <Award className="w-5 h-5" />, label: "Certificado", color: "blue" },
            { icon: <Zap className="w-5 h-5" />, label: "IA Assistente", color: "green" },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className={`p-4 rounded-xl border border-${item.color}-500/30 bg-${item.color}-500/10 text-center hover:scale-105 transition-transform`}
            >
              <div className={`inline-flex p-2 rounded-lg bg-${item.color}-500/20 text-${item.color}-400 mb-2`}>
                {item.icon}
              </div>
              <div className="text-sm font-medium text-white">{item.label}</div>
            </motion.div>
          ))}
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
            Garantir Minha Vaga 2026
            <Zap className="w-5 h-5" />
          </a>
        </motion.div>
      </div>
    </section>
  );
};
