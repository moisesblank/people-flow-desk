// ============================================
// ARTE PRINCIPAL DOS APROVADOS - DESTAQUE ÉPICO
// A imagem que mais impressiona
// 🏛️ LEI I: useQuantumReactivity aplicado
// ============================================

import { memo } from "react";
import { motion } from "framer-motion";
import { Crown, Trophy, Star, Sparkles, GraduationCap, Zap, Award, Target, Medal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuantumReactivity } from "@/hooks/useQuantumReactivity";
import { OptimizedImage } from "@/components/ui/optimized-image";
import artePrincipal from "@/assets/arte-aprovados-principal.png";

// Partículas de celebração - 🛡️ LEI I: Reduzido de 40 para 8, posições fixas
const CelebrationParticles = memo(() => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(8)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute will-change-transform"
        style={{
          left: `${10 + i * 10}%`,
          top: `${15 + i * 10}%`,
        }}
        animate={{
          y: [0, -15, 0],
          opacity: [0.3, 0.7, 0.3],
        }}
        transition={{
          duration: 4 + i,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {i % 4 === 0 ? (
          <Star className="w-3 h-3 text-amber-400" fill="rgba(251,191,36,0.5)" />
        ) : i % 4 === 1 ? (
          <Sparkles className="w-2 h-2 text-pink-400" />
        ) : i % 4 === 2 ? (
          <Trophy className="w-2 h-2 text-amber-500" />
        ) : (
          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-red-500 to-amber-400" />
        )}
      </motion.div>
    ))}
  </div>
));

CelebrationParticles.displayName = "CelebrationParticles";

export const MainApprovedArt = () => {
  const { shouldAnimate, gpuAnimationProps } = useQuantumReactivity();
  
  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      {/* Background com gradiente épico */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-950 to-black" />
      
      {/* Glows laterais - desabilitados se shouldAnimate false */}
      {shouldAnimate && (
        <>
          <motion.div
            className="absolute -left-40 top-1/4 w-[600px] h-[600px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(220,38,38,0.25) 0%, transparent 60%)',
              filter: 'blur(100px)',
            }}
            {...gpuAnimationProps.slideIn}
          />
          <motion.div
            className="absolute -right-40 bottom-1/4 w-[600px] h-[600px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(251,191,36,0.2) 0%, transparent 60%)',
              filter: 'blur(100px)',
            }}
            {...gpuAnimationProps.slideIn}
          />
        </>
      )}

      {/* Partículas apenas se animações habilitadas */}
      {shouldAnimate && <CelebrationParticles />}

      <div className="container mx-auto px-4 relative z-10">
        {/* Header épico */}
        <motion.div
          {...(shouldAnimate ? gpuAnimationProps.fadeUp : {})}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          {/* Badge principal */}
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            whileInView={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", duration: 0.8 }}
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-red-600/30 via-amber-500/30 to-red-600/30 border-2 border-red-500/50 mb-8"
          >
            <Crown className="w-7 h-7 text-amber-400" />
            <span className="text-xl md:text-2xl font-black text-white tracking-wider">HALL DA FAMA</span>
            <Crown className="w-7 h-7 text-amber-400" />
          </motion.div>

          {/* Título principal animado */}
          <motion.h2
            className="text-4xl md:text-6xl lg:text-7xl font-black mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="text-white">NOSSOS </span>
            <span className="bg-gradient-to-r from-red-500 via-amber-500 to-red-500 bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(220,38,38,0.5)]">
              CAMPEÕES
            </span>
          </motion.h2>

          <motion.p
            className="text-gray-400 text-lg md:text-xl max-w-3xl mx-auto mb-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            O curso de química que mais <span className="text-red-400 font-bold">APROVA</span> e <span className="text-amber-400 font-bold">COMPROVA</span> para 
            <span className="text-white font-bold"> MEDICINA</span> em universidades públicas no Brasil
          </motion.p>

          {/* Stats rápidas */}
          <motion.div
            className="flex flex-wrap justify-center gap-6 mt-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {[
              { icon: <GraduationCap className="w-5 h-5" />, label: "+200 Aprovados", color: "text-red-400" },
              { icon: <Medal className="w-5 h-5" />, label: "1º Lugares", color: "text-amber-400" },
              { icon: <Target className="w-5 h-5" />, label: "Medicina", color: "text-green-400" },
            ].map((stat, i) => (
              <div 
                key={i}
                className={`flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 ${stat.color}`}
              >
                {stat.icon}
                <span className="font-bold">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Imagem principal com efeitos épicos */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative max-w-6xl mx-auto"
        >
          {/* Glow atrás da imagem - estático */}
          {shouldAnimate && (
            <div
              className="absolute -inset-4 md:-inset-8 rounded-3xl opacity-50"
              style={{
                background: 'linear-gradient(45deg, rgba(220,38,38,0.3), rgba(251,191,36,0.3), rgba(220,38,38,0.3))',
                filter: 'blur(40px)',
              }}
            />
          )}

          {/* Borda gradiente - estática */}
          <div className="relative p-1 rounded-3xl bg-gradient-to-r from-red-600 via-amber-500 to-red-600 overflow-hidden">
            
            {/* Imagem - 🚀 OptimizedImage com blur placeholder */}
            <div className="relative rounded-2xl overflow-hidden bg-black">
              <OptimizedImage
                src={artePrincipal}
                alt="Todos os alunos aprovados em medicina pelo curso Moisés Medeiros"
                width={1200}
                height={800}
                aspectRatio="16:9"
                objectFit="contain"
                placeholderColor="#0a0a0a"
                priority={false}
                className="w-full h-auto"
              />
              
              {/* Overlay gradiente sutil no topo */}
              <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />
              
              {/* Overlay gradiente no fundo */}
              <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
            </div>
          </div>

          {/* Badges - estáticos para performance */}
          <div className="absolute -top-4 -left-4 md:-top-6 md:-left-6">
            <div className="bg-gradient-to-r from-red-600 to-red-500 px-4 py-2 md:px-6 md:py-3 rounded-full shadow-2xl shadow-red-500/50 flex items-center gap-2">
              <Trophy className="w-5 h-5 md:w-6 md:h-6 text-amber-300" />
              <span className="text-white font-black text-sm md:text-base">RESULTADOS REAIS</span>
            </div>
          </div>

          <div className="absolute -bottom-4 -right-4 md:-bottom-6 md:-right-6">
            <div className="bg-gradient-to-r from-amber-600 to-amber-500 px-4 py-2 md:px-6 md:py-3 rounded-full shadow-2xl shadow-amber-500/50 flex items-center gap-2">
              <Award className="w-5 h-5 md:w-6 md:h-6 text-white" />
              <span className="text-white font-black text-sm md:text-base">+200 APROVADOS</span>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <motion.p
            className="text-2xl md:text-3xl font-black mb-6"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
          >
            <span className="text-white">VOCÊ SERÁ O </span>
            <span className="bg-gradient-to-r from-red-500 to-amber-500 bg-clip-text text-transparent">PRÓXIMO APROVADO!</span>
          </motion.p>
          
          <a
            href="https://moisesmedeiros.com.br/black-friday-2025"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="inline-block relative group">
              {/* Glow - estático */}
              {shouldAnimate && (
                <div
                  className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-red-600 via-amber-500 to-red-600 opacity-50 blur-xl"
                />
              )}
              
              <Button 
                size="lg"
                className="relative px-10 py-7 text-lg md:text-xl font-black rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white border-0 shadow-2xl shadow-red-500/40"
              >
                <Zap className="w-6 h-6 mr-3" />
                QUERO SER APROVADO
                <span className="ml-3">→</span>
              </Button>
            </div>
          </a>
        </motion.div>
      </div>
    </section>
  );
};
