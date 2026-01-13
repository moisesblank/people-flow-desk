// ============================================
// PÁGINA DEDICADA: METODOLOGIA
// URL: /metodologia
// Fragmento da Home - Features e Materiais
// ============================================

import { lazy, Suspense } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Helmet } from "react-helmet";

// Lazy load dos componentes
const FeaturesSection = lazy(() => import("@/components/landing/FeaturesSection").then(m => ({ default: m.FeaturesSection })));
const MaterialSection = lazy(() => import("@/components/landing/MaterialSection").then(m => ({ default: m.MaterialSection })));
const AIAutomationsSection = lazy(() => import("@/components/landing/AIAutomationsSection").then(m => ({ default: m.AIAutomationsSection })));
const FuturisticFooter = lazy(() => import("@/components/landing/FuturisticFooter").then(m => ({ default: m.FuturisticFooter })));

const SectionLoader = () => (
  <div className="w-full py-12 flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-pink-500/50 border-t-pink-500 rounded-full animate-spin" />
  </div>
);

const Metodologia = () => {
  return (
    <>
      <Helmet>
        <title>Metodologia | Prof. Moisés Medeiros - Química que Aprova</title>
        <meta name="description" content="Conheça a metodologia exclusiva do Prof. Moisés Medeiros. IA personalizada, materiais exclusivos, flashcards ANKI e muito mais." />
      </Helmet>
      
      <div className="min-h-screen bg-black text-white overflow-x-hidden">
        {/* Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-950 to-black" />
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `linear-gradient(rgba(220,38,38,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(30,64,175,0.15) 1px, transparent 1px)`,
              backgroundSize: "80px 80px",
            }}
          />
        </div>

        <Navbar />
        
        <main className="relative z-10 pt-20">
          <Suspense fallback={<SectionLoader />}>
            <FeaturesSection />
          </Suspense>
          
          <Suspense fallback={<SectionLoader />}>
            <MaterialSection />
          </Suspense>
          
          <Suspense fallback={<SectionLoader />}>
            <AIAutomationsSection />
          </Suspense>
          
          <Suspense fallback={<SectionLoader />}>
            <FuturisticFooter />
          </Suspense>
        </main>
      </div>
    </>
  );
};

export default Metodologia;
