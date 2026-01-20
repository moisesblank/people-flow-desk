// ============================================
// VIDEO SECTION - APRESENTAÇÃO DO CURSO 2300
// Com player futurista cinematográfico
// 🏛️ LEI I: useQuantumReactivity aplicado
// ============================================

import { motion } from "framer-motion";
import { Play, Sparkles, Users, Clock, Award, Zap } from "lucide-react";
import { FuturisticVideoPlayer } from "./FuturisticVideoPlayer";
import { useQuantumReactivity } from "@/hooks/useQuantumReactivity";

export const VideoSection = () => {
  const { shouldAnimate, gpuAnimationProps } = useQuantumReactivity();
  
  return (
    <section id="video" className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-black to-slate-950" />
      
      {/* Grid estático */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `linear-gradient(rgba(236,72,153,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.2) 1px, transparent 1px)`,
        backgroundSize: '80px 80px'
      }} />

      {/* Orbes estáticos - sem animação */}
      {shouldAnimate && (
        <>
          <div
            className="absolute top-1/4 -left-20 w-96 h-96 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 60%)', filter: 'blur(80px)' }}
          />
          <div
            className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 60%)', filter: 'blur(80px)' }}
          />
        </>
      )}

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

        {/* Video Container - Now with Futuristic Player */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative max-w-5xl mx-auto"
        >
          <FuturisticVideoPlayer
            videoId="aOzCtPc7byY"
            title="Prof. Moisés Medeiros - Matrículas 2026"
          />

          {/* Floating Stats */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            viewport={{ once: true }}
            className="absolute -left-4 top-1/3 hidden lg:block"
          >
            <div className="bg-black/90 backdrop-blur-xl border border-pink-500/30 rounded-xl p-4 shadow-xl shadow-pink-500/20">
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
            <div className="bg-black/90 backdrop-blur-xl border border-purple-500/30 rounded-xl p-4 shadow-xl shadow-purple-500/20">
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
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
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
              whileHover={{ scale: 1.05, y: -5 }}
              className={`p-4 rounded-xl border border-${item.color}-500/30 bg-${item.color}-500/10 text-center transition-all cursor-pointer`}
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
            href="https://moisesmedeiros.com.br/black-friday-2025"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 px-10 py-5 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 text-white font-bold text-lg shadow-2xl shadow-pink-500/40 relative overflow-hidden hover:scale-105 transition-transform"
          >
            <Sparkles className="w-5 h-5 relative z-10" />
            <span className="relative z-10">Garantir Minha Vaga 2026</span>
            <Zap className="w-5 h-5 relative z-10" />
          </a>
        </motion.div>
      </div>
    </section>
  );
};
