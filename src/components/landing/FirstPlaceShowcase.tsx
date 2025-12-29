// ============================================
// FIRST PLACE SHOWCASE - SEÇÃO DESTAQUE 1º LUGARES
// 🚀 LEI I: OptimizedImage + Blur Placeholder
// Design: 2300 | Performance: 3500
// ============================================

import { memo } from "react";
import { motion } from "framer-motion";
import { Crown, Trophy, Star, Sparkles, GraduationCap, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useQuantumReactivity } from "@/hooks/useQuantumReactivity";
import { OptimizedImage } from "@/components/ui/optimized-image";
import primeiroLugar1 from "@/assets/aprovados/primeiro-lugar-1.png";
import primeiroLugar2 from "@/assets/aprovados/primeiro-lugar-2.png";

// Dados dos primeiros lugares com cores para placeholder
const champions = [
  {
    id: 1,
    image: primeiroLugar1,
    nome: "Lucas Heitor",
    universidade: "UFRN",
    curso: "Medicina",
    ano: "2K25",
    posicao: "1º LUGAR GERAL",
    depoimento: "O método do Prof. Moisés me levou ao topo! Química deixou de ser um problema e virou minha arma secreta.",
    placeholderColor: "#1a1a2e" // Cor dominante para blur
  },
  {
    id: 2,
    image: primeiroLugar2,
    nome: "Yasmin Cordeiro",
    universidade: "UFPB",
    curso: "Medicina",
    ano: "2K25",
    posicao: "1º LUGAR GERAL",
    depoimento: "Conquistei meu sonho! A metodologia inovadora do curso me preparou como ninguém. Aprovação garantida!",
    placeholderColor: "#16213e" // Cor dominante para blur
  },
];

// 🏛️ CONSTITUTION: Fixed positions (no Math.random) + STATIC on 3G
const PARTICLE_POSITIONS = [
  { left: 10, top: 10 }, { left: 25, top: 20 }, { left: 40, top: 15 },
  { left: 55, top: 25 }, { left: 70, top: 12 }, { left: 85, top: 22 },
  { left: 15, top: 45 }, { left: 35, top: 55 }, { left: 60, top: 48 },
  { left: 80, top: 52 },
];

const FloatingParticles = memo(() => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {PARTICLE_POSITIONS.map((pos, i) => (
      <div
        key={i}
        className="absolute"
        style={{
          left: `${pos.left}%`,
          top: `${pos.top}%`,
        }}
      >
        {i % 3 === 0 ? (
          <Star className="w-3 h-3 text-amber-400 opacity-60" />
        ) : i % 3 === 1 ? (
          <Sparkles className="w-2 h-2 text-pink-400 opacity-50" />
        ) : (
          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-amber-400/50 to-pink-500/50" />
        )}
      </div>
    ))}
  </div>
));

FloatingParticles.displayName = "FloatingParticles";

// Card do campeão - 🛡️ LEI I: Animações condicionais + lazy images
const ChampionCard = memo(({ champion, index }: { champion: typeof champions[0]; index: number }) => {
  const { shouldAnimate } = useQuantumReactivity();
  
  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, y: 50, scale: 0.9 } : { opacity: 1, y: 0, scale: 1 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.2, duration: 0.5 }}
      viewport={{ once: true }}
      whileHover={shouldAnimate ? { y: -5 } : undefined}
      className="relative group"
    >
      {/* Glow - APENAS se animações habilitadas */}
      {shouldAnimate && (
        <div
          className="absolute -inset-4 rounded-3xl opacity-40 group-hover:opacity-60 transition-opacity duration-500"
          style={{
            background: index === 0 
              ? 'radial-gradient(circle, rgba(251,191,36,0.3) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(236,72,153,0.3) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />
      )}

    {/* Card principal */}
    <div className="relative bg-gradient-to-br from-black/80 via-slate-900/90 to-black/80 rounded-3xl border-2 border-amber-500/30 overflow-hidden backdrop-blur-xl p-1">
      {/* Borda gradiente - STATIC (remove rotate animation) */}
      <div
        className="absolute inset-0 rounded-3xl"
        style={{
          background: `conic-gradient(from 0deg, ${index === 0 ? '#f59e0b, #ef4444, #f59e0b' : '#ec4899, #8b5cf6, #ec4899'})`,
          padding: '2px',
        }}
      />

      <div className="relative bg-gradient-to-br from-black via-slate-900 to-black rounded-3xl overflow-hidden">
        {/* Coroa - STATIC (remove animation) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <Crown className="w-16 h-16 text-amber-400 drop-shadow-[0_0_30px_rgba(251,191,36,0.8)]" fill="rgba(251,191,36,0.3)" />
        </div>

        {/* Badge 1º Lugar */}
        <motion.div
          className="absolute top-6 left-1/2 -translate-x-1/2 z-10"
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
        >
          <div className="px-6 py-2 rounded-full bg-gradient-to-r from-stats-gold via-rarity-legendary to-stats-gold text-foreground font-black text-sm shadow-2xl shadow-stats-gold/50 flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            {champion.posicao}
            <Trophy className="w-4 h-4" />
          </div>
        </motion.div>

        {/* Imagem do aprovado - 🚀 OptimizedImage */}
        <div className="relative pt-14">
          <motion.div
            className="relative overflow-hidden"
            whileHover={shouldAnimate ? { scale: 1.02 } : undefined}
            transition={{ duration: 0.5 }}
          >
            <OptimizedImage
              src={champion.image}
              alt={champion.nome}
              aspectRatio="4:3"
              objectFit="cover"
              placeholderColor={champion.placeholderColor}
              priority={index === 0} // Primeiro campeão carrega prioritário
              className="w-full h-full"
            />
            
            {/* Overlay gradiente */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none" />
          </motion.div>

          {/* Info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black/90 to-transparent">
            {/* Universidade e Curso */}
            <motion.div
              className="flex items-center justify-center gap-4 mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="px-4 py-2 rounded-full bg-gradient-to-r from-red-600 to-pink-600 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-white" />
                <span className="text-white font-bold text-sm">{champion.curso}</span>
              </div>
              <div className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600">
                <span className="text-white font-bold text-sm">{champion.universidade}</span>
              </div>
            </motion.div>

            {/* Nome */}
            <motion.h3
              className="text-2xl md:text-3xl font-black text-center bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 bg-clip-text text-transparent mb-2"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {champion.nome}
            </motion.h3>

            {/* Ano */}
            <motion.div
              className="text-center text-gray-400 font-bold mb-4"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {champion.ano}
            </motion.div>

            {/* Depoimento */}
            <motion.p
              className="text-gray-300 text-center text-sm italic leading-relaxed"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              "{champion.depoimento}"
            </motion.p>
          </div>
        </div>
      </div>
    </div>
  </motion.div>
  );
});

ChampionCard.displayName = "ChampionCard";

export const FirstPlaceShowcase = () => {
  const { shouldAnimate, gpuAnimationProps } = useQuantumReactivity();
  
  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-950 to-black" />
      
      {/* Glow central - disabled when shouldAnimate is false */}
      {shouldAnimate && (
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px]"
          style={{
            background: 'radial-gradient(ellipse, rgba(251,191,36,0.15) 0%, rgba(220,38,38,0.1) 30%, transparent 60%)',
            filter: 'blur(80px)',
          }}
          {...gpuAnimationProps.scaleIn}
        />
      )}

      {shouldAnimate && <FloatingParticles />}

      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <motion.div
          {...(shouldAnimate ? gpuAnimationProps.fadeUp : {})}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          {/* Badge épico */}
          <motion.div
            initial={{ scale: 0, rotate: -10 }}
            whileInView={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", duration: 0.8 }}
            className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 border-2 border-amber-500/50 mb-8"
          >
            <Crown className="w-6 h-6 text-amber-400" />
            <span className="text-lg font-black text-amber-300 tracking-wider">OS PRIMEIROS LUGARES TAMBÉM SÃO NOSSOS</span>
            <Crown className="w-6 h-6 text-amber-400" />
          </motion.div>

          {/* Título principal */}
          <motion.h2
            className="text-5xl md:text-7xl font-black mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(251,191,36,0.5)]">
              CAMPEÕES
            </span>
            <br />
            <span className="text-white text-4xl md:text-5xl">ABSOLUTOS</span>
          </motion.h2>

          <motion.p
            className="text-gray-400 text-lg max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Não apenas aprovamos em medicina — conquistamos o <span className="text-amber-400 font-bold">1º LUGAR</span> nas maiores universidades federais do Brasil!
          </motion.p>
        </motion.div>

        {/* Cards dos campeões */}
        <div className="grid md:grid-cols-2 gap-8 lg:gap-16 max-w-5xl mx-auto mb-16">
          {champions.map((champion, index) => (
            <ChampionCard key={champion.id} champion={champion} index={index} />
          ))}
        </div>

        {/* Botão Área do Aluno em destaque */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <motion.p
            className="text-gray-400 mb-6 text-lg"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
          >
            Já é aluno? Acesse agora sua área exclusiva
          </motion.p>
          
          <Link to="/auth">
            <div className="inline-block relative group">
              {/* Glow - apenas se animações habilitadas */}
              {shouldAnimate && (
                <>
                  <motion.div
                    className="absolute -inset-2 rounded-2xl"
                    style={{
                      background: 'linear-gradient(90deg, #f59e0b, #ef4444, #ec4899, #8b5cf6, #f59e0b)',
                      backgroundSize: '300% 100%',
                    }}
                    animate={{
                      backgroundPosition: ['0% 0%', '100% 0%', '0% 0%'],
                      opacity: [0.5, 0.8, 0.5],
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                  <div
                    className="absolute -inset-4 rounded-2xl opacity-40 blur-xl"
                    style={{
                      background: 'linear-gradient(90deg, #f59e0b, #ef4444, #ec4899)',
                    }}
                  />
                </>
              )}
              
              <Button 
                size="lg"
                className="relative px-12 py-8 text-xl font-black rounded-xl bg-gradient-to-r from-amber-600 via-red-600 to-pink-600 hover:from-amber-500 hover:via-red-500 hover:to-pink-500 text-white border-0 shadow-2xl shadow-red-500/50"
              >
                <Zap className="w-7 h-7 mr-3" />
                ÁREA DO ALUNO
                <span className="ml-3">→</span>
              </Button>
            </div>
          </Link>

          {/* Selo de garantia */}
          <motion.div
            className="mt-8 flex items-center justify-center gap-3 text-gray-500"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm">Acesso seguro e criptografado</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
