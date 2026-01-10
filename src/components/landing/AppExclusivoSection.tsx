// ============================================
// APP EXCLUSIVO SECTION - FUTURISTIC 2300
// 🏛️ LEI I: useQuantumReactivity aplicado
// ============================================

import { motion } from "framer-motion";
import { Smartphone, Apple, Download, Star, Zap, Shield, Rocket } from "lucide-react";
import { useQuantumReactivity } from "@/hooks/useQuantumReactivity";
import { SacredImage } from "@/components/performance/SacredImage";
import appArte from "@/assets/app-exclusivo-arte.png";

// Floating particles
const FloatingParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(30)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 rounded-full"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          background: i % 3 === 0 ? '#dc2626' : i % 3 === 1 ? '#1e40af' : '#9333ea',
          boxShadow: `0 0 ${6 + Math.random() * 10}px currentColor`,
        }}
        animate={{
          y: [0, -30, 0],
          opacity: [0.3, 1, 0.3],
          scale: [0.5, 1.5, 0.5],
        }}
        transition={{
          duration: 3 + Math.random() * 3,
          repeat: Infinity,
          delay: Math.random() * 2,
        }}
      />
    ))}
  </div>
);

// Holographic rings
const HolographicRings = () => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
    {[...Array(4)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full border"
        style={{
          width: `${300 + i * 120}px`,
          height: `${300 + i * 120}px`,
          borderColor: i % 2 === 0 ? 'rgba(220,38,38,0.2)' : 'rgba(30,64,175,0.2)',
        }}
        animate={{
          rotate: i % 2 === 0 ? 360 : -360,
          scale: [1, 1.05, 1],
        }}
        transition={{
          rotate: { duration: 20 + i * 5, repeat: Infinity, ease: "linear" },
          scale: { duration: 4, repeat: Infinity },
        }}
      />
    ))}
  </div>
);

// Feature badge
const FeatureBadge = ({ icon: Icon, text, delay }: { icon: any; text: string; delay: number }) => (
  <motion.div
    className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-slate-900/80 to-slate-800/80 border border-white/10 backdrop-blur-xl"
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    whileHover={{ scale: 1.05, borderColor: 'rgba(220,38,38,0.5)' }}
  >
    <Icon className="w-4 h-4 text-red-500" />
    <span className="text-xs font-medium text-white/80">{text}</span>
  </motion.div>
);

export const AppExclusivoSection = () => {
  const { shouldAnimate, gpuAnimationProps } = useQuantumReactivity();
  
  return (
    <section className="relative py-24 md:py-32 overflow-hidden bg-gradient-to-b from-black via-slate-950 to-black">
      {/* Epic background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(220,38,38,0.15)_0%,transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(30,64,175,0.1)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(147,51,234,0.1)_0%,transparent_60%)]" />
      </div>

      {/* Partículas e anéis apenas se animações habilitadas */}
      {shouldAnimate && <FloatingParticles />}
      {shouldAnimate && <HolographicRings />}

      <div className="container mx-auto px-4 relative z-10">
        {/* Epic title */}
        <motion.div
          className="text-center mb-16"
          {...(shouldAnimate ? gpuAnimationProps.fadeUp : {})}
        >
          {/* Badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-red-600/20 via-purple-600/20 to-blue-600/20 border border-red-500/30 mb-8"
            animate={shouldAnimate ? {
              boxShadow: [
                '0 0 20px rgba(220,38,38,0.3)',
                '0 0 40px rgba(147,51,234,0.3)',
                '0 0 20px rgba(30,64,175,0.3)',
                '0 0 40px rgba(220,38,38,0.3)',
              ],
            } : undefined}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <Smartphone className="w-5 h-5 text-red-400" />
            <span className="text-sm font-bold text-white uppercase tracking-wider">Exclusivo no Brasil</span>
            <Rocket className="w-5 h-5 text-blue-400" />
          </motion.div>

          {/* Main title */}
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6">
            <span className="block text-white mb-2">SOMOS O</span>
            <motion.span
              className="block bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 bg-clip-text text-transparent"
              animate={shouldAnimate ? {
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              } : undefined}
              transition={{ duration: 5, repeat: Infinity }}
              style={{ backgroundSize: '200% 200%' }}
            >
              ÚNICO CURSO DO BRASIL
            </motion.span>
            <span className="block text-white mt-2">COM APP</span>
            <motion.span
              className="block text-3xl md:text-5xl mt-2"
              {...(shouldAnimate ? gpuAnimationProps.fadeIn : {})}
            >
              <span className="text-white/80">iOS</span>
              <span className="text-red-500 mx-4">&</span>
              <span className="text-white/80">ANDROID</span>
            </motion.span>
          </h2>

          <motion.p
            className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto"
            {...(shouldAnimate ? gpuAnimationProps.fadeIn : {})}
          >
            Estude química de qualquer lugar, a qualquer hora. Tecnologia de ponta para sua aprovação.
          </motion.p>
        </motion.div>

        {/* Main image with epic rotation */}
        <div className="relative flex justify-center items-center">
          {/* Rotating glow behind image */}
          <motion.div
            className="absolute w-[500px] h-[500px] md:w-[700px] md:h-[700px]"
            style={{
              background: 'conic-gradient(from 0deg, rgba(220,38,38,0.4), rgba(147,51,234,0.4), rgba(30,64,175,0.4), rgba(220,38,38,0.4))',
              filter: 'blur(60px)',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          />

          {/* Image container */}
          <motion.div
            className="relative z-10"
            initial={{ opacity: 0, scale: 0.8, rotateY: -30 }}
            whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
            transition={{ duration: 1, type: "spring" }}
          >
            {/* Animated border */}
            <motion.div
              className="absolute -inset-4 rounded-3xl"
              style={{
                background: 'linear-gradient(45deg, #dc2626, #9333ea, #1e40af, #dc2626)',
                backgroundSize: '300% 300%',
              }}
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ duration: 4, repeat: Infinity }}
            />

            {/* Inner glow */}
            <div className="absolute -inset-2 rounded-2xl bg-gradient-to-r from-red-500/20 via-purple-500/20 to-blue-500/20 blur-xl" />

            {/* Image */}
            <motion.div
              className="relative w-full max-w-lg md:max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
              style={{ 
                boxShadow: '0 0 60px rgba(220,38,38,0.3), 0 0 120px rgba(147,51,234,0.2)',
              }}
              animate={{
                y: [0, -10, 0],
                rotateZ: [-1, 1, -1],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              whileHover={{
                scale: 1.02,
                boxShadow: '0 0 80px rgba(220,38,38,0.5), 0 0 160px rgba(147,51,234,0.3)',
              }}
            >
              <SacredImage
                src={appArte}
                alt="App Exclusivo iOS e Android - Curso Moisés Medeiros"
                className="w-full h-auto"
                objectFit="cover"
                priority
              />
            </motion.div>

            {/* Floating badges around image */}
            <motion.div
              className="absolute -top-6 -right-6 md:-top-8 md:-right-8"
              animate={{ y: [0, -8, 0], rotate: [0, 5, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 shadow-lg shadow-green-500/30">
                <Star className="w-4 h-4 text-white fill-white" />
                <span className="text-sm font-bold text-white">5.0</span>
              </div>
            </motion.div>

            <motion.div
              className="absolute -bottom-6 -left-6 md:-bottom-8 md:-left-8"
              animate={{ y: [0, -8, 0], rotate: [0, -5, 0] }}
              transition={{ duration: 3.5, repeat: Infinity }}
            >
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-600 to-violet-600 shadow-lg shadow-purple-500/30">
                <Download className="w-4 h-4 text-white" />
                <span className="text-sm font-bold text-white">1000+ Downloads</span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Feature badges */}
        <motion.div
          className="flex flex-wrap justify-center gap-4 mt-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <FeatureBadge icon={Zap} text="Aulas Offline" delay={0.9} />
          <FeatureBadge icon={Shield} text="100% Seguro" delay={1.0} />
          <FeatureBadge icon={Star} text="Avaliação 5.0" delay={1.1} />
          <FeatureBadge icon={Smartphone} text="iOS & Android" delay={1.2} />
        </motion.div>

        {/* Download buttons */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
        >
          {/* App Store */}
          <motion.a
            href="https://apps.apple.com/br/app/prof-mois%C3%A9s-medeiros/id6449224810"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 border border-white/10 hover:border-white/30 transition-all group"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <Apple className="w-8 h-8 text-white" />
            <div className="text-left">
              <p className="text-xs text-white/60">Disponível na</p>
              <p className="text-lg font-bold text-white">App Store</p>
            </div>
          </motion.a>

          {/* Google Play */}
          <motion.a
            href="https://play.google.com/store/apps/details?id=app.navalia.aplicativo_moises_medeiros&hl=pt_BR"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 border border-white/10 hover:border-white/30 transition-all group"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
              <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92z" fill="#00F076"/>
              <path d="M20.85 10.045l-3.458-2.003-3.96 3.958 3.96 3.958 3.458-2.003c.747-.434 1.15-1.176 1.15-1.955s-.403-1.521-1.15-1.955z" fill="#FFC900"/>
              <path d="M3.609 1.814l10.783 10.182-3.96-3.958L3.61 1.814z" fill="#00D6FF"/>
              <path d="M13.432 15.958l-3.96-3.958L3.61 22.186l9.823-6.228z" fill="#FF3A44"/>
            </svg>
            <div className="text-left">
              <p className="text-xs text-white/60">Disponível no</p>
              <p className="text-lg font-bold text-white">Google Play</p>
            </div>
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
};
