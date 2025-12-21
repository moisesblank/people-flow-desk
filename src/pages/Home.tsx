// ============================================
// MOISÉS MEDEIROS v32.0 - LANDING PAGE 2300
// ULTRA PERFORMANCE OPTIMIZED
// ============================================

import { useState, useEffect, useCallback, lazy, memo } from "react";
import { motion } from "framer-motion";
import { LazyMount } from "@/components/performance/LazyMount";

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
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 will-change-auto">
    <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-950 to-black" />

    <div
      className="absolute inset-0 opacity-10"
      style={{
        backgroundImage: `linear-gradient(rgba(220,38,38,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(30,64,175,0.2) 1px, transparent 1px)`,
        backgroundSize: "80px 80px",
        willChange: "auto",
      }}
    />

    <div
      className="absolute -left-40 top-1/4 w-[600px] h-[600px] rounded-full opacity-20"
      style={{
        background: "radial-gradient(circle, rgba(220,38,38,0.3) 0%, transparent 70%)",
        filter: "blur(60px)",
        willChange: "auto",
      }}
    />
    <div
      className="absolute -right-40 bottom-1/4 w-[500px] h-[500px] rounded-full opacity-20"
      style={{
        background: "radial-gradient(circle, rgba(30,64,175,0.3) 0%, transparent 70%)",
        filter: "blur(60px)",
        willChange: "auto",
      }}
    />
  </div>
));

UltraBackground.displayName = "UltraBackground";

// ============================================
// SECTION LOADER - Minimal skeleton
// ============================================
const SectionLoader = memo(() => (
  <div className="w-full py-16 flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
  </div>
));

SectionLoader.displayName = "SectionLoader";

// ============================================
// MAIN HOME COMPONENT - ULTRA OPTIMIZED
// ============================================
const Home = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const introSeen = sessionStorage.getItem("intro_seen_v32");
    if (introSeen) { 
      setShowIntro(false); 
      setIsLoaded(true); 
    }
  }, []);

  const handleIntroComplete = useCallback(() => {
    sessionStorage.setItem("intro_seen_v32", "true");
    setShowIntro(false);
    requestAnimationFrame(() => setIsLoaded(true));
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
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: isLoaded ? 1 : 0 }} 
        transition={{ duration: 0.3 }}
        className="will-change-auto"
      >
        <UltraBackground />
        <Navbar />
        
        {/* HERO - Critical, loads first */}
        <HeroSection />
        
        {/* All other sections lazy loaded */}
        <LazySection>
          <RealtimeStats variant="section" />
        </LazySection>
        
        <LazySection>
          <MainApprovedArt />
        </LazySection>
        
        <LazySection>
          <VideoSection />
        </LazySection>
        
        <LazySection>
          <ProfessorSection />
        </LazySection>
        
        <LazySection>
          <AppExclusivoSection />
        </LazySection>
        
        <LazySection>
          <FirstPlaceShowcase />
        </LazySection>
        
        <LazySection>
          <ApprovedCarousel />
        </LazySection>
        
        <LazySection>
          <VideoFeedbackCarousel />
        </LazySection>
        
        <LazySection>
          <TestimonialsSection />
        </LazySection>
        
        <LazySection>
          <FeaturesSection />
        </LazySection>
        
        <LazySection>
          <MaterialSection />
        </LazySection>
        
        <LazySection>
          <AIAutomationsSection />
        </LazySection>
        
        <LazySection>
          <CoursesSection />
        </LazySection>
        
        <LazySection>
          <FAQSection />
        </LazySection>
        
        <LazySection>
          <EpicCTASection />
        </LazySection>
        
        <LazySection>
          <FuturisticFooter />
        </LazySection>
      </motion.div>
    </div>
  );
};

export default Home;
