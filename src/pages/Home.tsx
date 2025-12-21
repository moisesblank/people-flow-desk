// ============================================
// MOISÉS MEDEIROS v30.0 - LANDING PAGE 2300
// ============================================

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

// Components
import { CinematicIntro } from "@/components/landing/CinematicIntro";
import { HeroSection } from "@/components/landing/HeroSection";
import { RealtimeStats } from "@/components/landing/RealtimeStats";
import { AIAutomationsSection } from "@/components/landing/AIAutomationsSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { CoursesSection } from "@/components/landing/CoursesSection";
import { EpicCTASection } from "@/components/landing/EpicCTASection";
import { FuturisticFooter } from "@/components/landing/FuturisticFooter";
import { Navbar } from "@/components/landing/Navbar";
import { FAQSection } from "@/components/landing/FAQSection";
import { VideoSection } from "@/components/landing/VideoSection";
import { MaterialSection } from "@/components/landing/MaterialSection";
import { ProfessorSection } from "@/components/landing/ProfessorSection";
import { ApprovedStudentsSection } from "@/components/landing/ApprovedStudentsSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { VideoFeedbackCarousel } from "@/components/landing/VideoFeedbackCarousel";

// ============================================
// BACKGROUND ANIMADO ULTRA
// ============================================
const UltraBackground = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-950 to-black" />
    <div className="absolute inset-0 opacity-15" style={{
      backgroundImage: `linear-gradient(rgba(220,38,38,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(30,64,175,0.25) 1px, transparent 1px)`,
      backgroundSize: '100px 100px'
    }} />
    <motion.div 
      className="absolute -left-60 top-1/4 w-[1000px] h-[1000px] rounded-full" 
      style={{ background: 'radial-gradient(circle, rgba(220,38,38,0.25) 0%, transparent 60%)', filter: 'blur(120px)' }} 
      animate={{ x: [0, 150, 0], y: [0, 100, 0] }} 
      transition={{ duration: 25, repeat: Infinity }} 
    />
    <motion.div 
      className="absolute -right-60 bottom-1/4 w-[900px] h-[900px] rounded-full" 
      style={{ background: 'radial-gradient(circle, rgba(30,64,175,0.25) 0%, transparent 60%)', filter: 'blur(120px)' }} 
      animate={{ x: [0, -100, 0], y: [0, -120, 0] }} 
      transition={{ duration: 22, repeat: Infinity }} 
    />
    <motion.div 
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full" 
      style={{ background: 'radial-gradient(circle, rgba(147,51,234,0.15) 0%, transparent 60%)', filter: 'blur(100px)' }} 
      animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }} 
      transition={{ duration: 18, repeat: Infinity }} 
    />
  </div>
);

// ============================================
// MAIN HOME COMPONENT
// ============================================
const Home = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const introSeen = sessionStorage.getItem("intro_seen_v31");
    if (introSeen) { setShowIntro(false); setIsLoaded(true); }
  }, []);

  const handleIntroComplete = useCallback(() => {
    sessionStorage.setItem("intro_seen_v31", "true");
    setShowIntro(false);
    setTimeout(() => setIsLoaded(true), 100);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      {showIntro && <CinematicIntro onComplete={handleIntroComplete} />}
      {!showIntro && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: isLoaded ? 1 : 0 }} transition={{ duration: 0.5 }}>
          <UltraBackground />
          <Navbar />
          <HeroSection />
          <RealtimeStats variant="section" />
          <VideoSection />
          <ProfessorSection />
          <FeaturesSection />
          <MaterialSection />
          <AIAutomationsSection />
          <CoursesSection />
          <ApprovedStudentsSection />
          <TestimonialsSection />
          <VideoFeedbackCarousel />
          <FAQSection />
          <EpicCTASection />
          <FuturisticFooter />
        </motion.div>
      )}
    </div>
  );
};

export default Home;
