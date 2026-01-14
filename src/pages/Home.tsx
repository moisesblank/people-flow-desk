// ============================================
// MOISÉS MEDEIROS v33.0 - LANDING PAGE 2500
// ULTRA PERFORMANCE - MOBILE/3G OPTIMIZED
// Suporta 5000+ usuários simultâneos
// ============================================

import { useState, useEffect, useCallback, lazy, memo, Suspense } from "react";
import { motion } from "framer-motion";
import { usePerformance } from "@/hooks/usePerformance";
import { LazySection } from "@/components/performance/LazySection";

// Critical components - loaded immediately
import { CinematicIntro } from "@/components/landing/CinematicIntro";
import { HeroSection } from "@/components/landing/HeroSection";
import { Navbar } from "@/components/landing/Navbar";

// Lazy loaded components - loaded on demand
const RealtimeStats = lazy(() => import("@/components/landing/RealtimeStats").then(m => ({ default: m.RealtimeStats })));
const MainApprovedArt = lazy(() => import("@/components/landing/MainApprovedArt").then(m => ({ default: m.MainApprovedArt })));
const VideoSection = lazy(() => import("@/components/landing/VideoSection").then(m => ({ default: m.VideoSection })));
const ProfessorSection = lazy(() => import("@/components/landing/ProfessorSection").then(m => ({ default: m.ProfessorSection })));
const AppExclusivoSection = lazy(() => import("@/components/landing/AppExclusivoSection").then(m => ({ default: m.AppExclusivoSection })));
const FirstPlaceShowcase = lazy(() => import("@/components/landing/FirstPlaceShowcase").then(m => ({ default: m.FirstPlaceShowcase })));
const ApprovedCarousel = lazy(() => import("@/components/landing/ApprovedCarousel").then(m => ({ default: m.ApprovedCarousel })));
const VideoFeedbackCarousel = lazy(() => import("@/components/landing/VideoFeedbackCarousel").then(m => ({ default: m.VideoFeedbackCarousel })));
const TestimonialsSection = lazy(() => import("@/components/landing/TestimonialsSection").then(m => ({ default: m.TestimonialsSection })));
const FeaturesSection = lazy(() => import("@/components/landing/FeaturesSection").then(m => ({ default: m.FeaturesSection })));
const MaterialSection = lazy(() => import("@/components/landing/MaterialSection").then(m => ({ default: m.MaterialSection })));
const AIAutomationsSection = lazy(() => import("@/components/landing/AIAutomationsSection").then(m => ({ default: m.AIAutomationsSection })));
const CoursesSection = lazy(() => import("@/components/landing/CoursesSection").then(m => ({ default: m.CoursesSection })));
const FAQSection = lazy(() => import("@/components/landing/FAQSection").then(m => ({ default: m.FAQSection })));
const EpicCTASection = lazy(() => import("@/components/landing/EpicCTASection").then(m => ({ default: m.EpicCTASection })));
const FuturisticFooter = lazy(() => import("@/components/landing/FuturisticFooter").then(m => ({ default: m.FuturisticFooter })));

// ============================================
// LIGHTWEIGHT BACKGROUND - GPU Optimized
// ============================================
const UltraBackground = memo(() => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-950 to-black" />
    
    {/* Grid holográfico - CSS only */}
    <div
      className="absolute inset-0 opacity-10"
      style={{
        backgroundImage: `linear-gradient(rgba(220,38,38,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(30,64,175,0.15) 1px, transparent 1px)`,
        backgroundSize: "80px 80px",
      }}
    />

    {/* Orbes estáticos */}
    <div
      className="absolute -left-40 top-1/4 w-[500px] h-[500px] rounded-full opacity-15"
      style={{
        background: "radial-gradient(circle, rgba(220,38,38,0.3) 0%, transparent 70%)",
        filter: "blur(60px)",
      }}
    />
    <div
      className="absolute -right-40 bottom-1/4 w-[400px] h-[400px] rounded-full opacity-15"
      style={{
        background: "radial-gradient(circle, rgba(30,64,175,0.3) 0%, transparent 70%)",
        filter: "blur(60px)",
      }}
    />
  </div>
));

UltraBackground.displayName = "UltraBackground";

// ============================================
// SECTION LOADER - Minimal skeleton
// ============================================
const SectionLoader = memo(() => (
  <div className="w-full py-12 flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-pink-500/50 border-t-pink-500 rounded-full animate-spin" />
  </div>
));

SectionLoader.displayName = "SectionLoader";

// ============================================
// MAIN HOME COMPONENT - ULTRA OPTIMIZED
// ============================================
const Home = () => {
  const { isSlowConnection, disableAnimations } = usePerformance();
  
  // 🛡️ FIX TELA PRETA: Verificar sessionStorage ANTES de qualquer estado
  const introAlreadySeen = typeof window !== 'undefined' && sessionStorage.getItem("intro_seen_v33") === "true";
  
  const [showIntro, setShowIntro] = useState(!introAlreadySeen);
  const [isLoaded, setIsLoaded] = useState(introAlreadySeen);

  // 🛡️ SAFETY: Se conexão lenta detectada, skip intro imediatamente
  useEffect(() => {
    if (isSlowConnection && showIntro) { 
      console.log('[Home] Slow connection detected, skipping intro');
      sessionStorage.setItem("intro_seen_v33", "true");
      setShowIntro(false); 
      setIsLoaded(true); 
    }
  }, [isSlowConnection, showIntro]);

  // 🛡️ EMERGENCY TIMEOUT: Garante que NUNCA ficará em tela preta
  useEffect(() => {
    if (!showIntro) return;

    const emergencyTimeout = setTimeout(() => {
      console.warn('[Home] ⚠️ EMERGENCY: Intro timeout exceeded, forcing completion');
      sessionStorage.setItem("intro_seen_v33", "true");
      setIsLoaded(true);
      setShowIntro(false);
    }, 6000); // 6s = 1s além do safety do CinematicIntro

    return () => clearTimeout(emergencyTimeout);
  }, [showIntro]);

  // 🛡️ P0: invariável — se não tem intro, o conteúdo SEMPRE deve estar liberado
  useEffect(() => {
    if (!showIntro) setIsLoaded(true);
  }, [showIntro]);

  const handleIntroComplete = useCallback(() => {
    console.log('[Home] Intro complete callback fired');
    sessionStorage.setItem("intro_seen_v33", "true");
    // 🛡️ P0: garantir que conteúdo nunca fique com opacity 0
    setIsLoaded(true);
    setShowIntro(false);
  }, []);

  if (showIntro) {
    return (
      <div className="min-h-screen bg-black text-white overflow-x-hidden">
        <CinematicIntro onComplete={handleIntroComplete} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      
      {disableAnimations ? (
        <div className="will-change-auto">
          <UltraBackground />
          <Navbar />
          <HeroSection />
          
          <Suspense fallback={<SectionLoader />}>
            <RealtimeStats variant="section" />
          </Suspense>
          
          <LazySection><MainApprovedArt /></LazySection>
          <LazySection><VideoSection /></LazySection>
          <LazySection><ProfessorSection /></LazySection>
          <LazySection><AppExclusivoSection /></LazySection>
          <LazySection><FirstPlaceShowcase /></LazySection>
          <LazySection><ApprovedCarousel /></LazySection>
          <LazySection><VideoFeedbackCarousel /></LazySection>
          <LazySection><TestimonialsSection /></LazySection>
          <LazySection><FeaturesSection /></LazySection>
          <LazySection><MaterialSection /></LazySection>
          <LazySection><AIAutomationsSection /></LazySection>
          <LazySection><CoursesSection /></LazySection>
          <LazySection><FAQSection /></LazySection>
          <LazySection><EpicCTASection /></LazySection>
          <LazySection><FuturisticFooter /></LazySection>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: isLoaded ? 1 : 0 }} 
          transition={{ duration: 0.3 }}
          className="will-change-auto"
        >
          <UltraBackground />
          <Navbar />
          <HeroSection />
          
          <LazySection><RealtimeStats variant="section" /></LazySection>
          <LazySection><MainApprovedArt /></LazySection>
          <LazySection><VideoSection /></LazySection>
          <LazySection><ProfessorSection /></LazySection>
          <LazySection><AppExclusivoSection /></LazySection>
          <LazySection><FirstPlaceShowcase /></LazySection>
          <LazySection><ApprovedCarousel /></LazySection>
          <LazySection><VideoFeedbackCarousel /></LazySection>
          <LazySection><TestimonialsSection /></LazySection>
          <LazySection><FeaturesSection /></LazySection>
          <LazySection><MaterialSection /></LazySection>
          <LazySection><AIAutomationsSection /></LazySection>
          <LazySection><CoursesSection /></LazySection>
          <LazySection><FAQSection /></LazySection>
          <LazySection><EpicCTASection /></LazySection>
          <LazySection><FuturisticFooter /></LazySection>
        </motion.div>
      )}
    </div>
  );
};

export default Home;
