// ============================================
// PÁGINA DEDICADA: CURSOS
// URL: /cursos
// Fragmento da Home - Seção de Cursos e Trilhas
// ============================================

import { lazy, Suspense } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Helmet } from "react-helmet";

// Lazy load dos componentes
const CoursesSection = lazy(() => import("@/components/landing/CoursesSection").then(m => ({ default: m.CoursesSection })));
const EpicCTASection = lazy(() => import("@/components/landing/EpicCTASection").then(m => ({ default: m.EpicCTASection })));
const FuturisticFooter = lazy(() => import("@/components/landing/FuturisticFooter").then(m => ({ default: m.FuturisticFooter })));

const SectionLoader = () => (
  <div className="w-full py-12 flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-pink-500/50 border-t-pink-500 rounded-full animate-spin" />
  </div>
);

const Cursos = () => {
  return (
    <>
      <Helmet>
        <title>Cursos | Prof. Moisés Medeiros - ENEM, Medicina, Intensivão</title>
        <meta name="description" content="Escolha o curso ideal: ENEM Completo, Medicina, Intensivão. Aulas em 4K, material em PDF, simulados ilimitados e suporte 24/7 com IA." />
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
            <CoursesSection />
          </Suspense>
          
          <Suspense fallback={<SectionLoader />}>
            <EpicCTASection />
          </Suspense>
          
          <Suspense fallback={<SectionLoader />}>
            <FuturisticFooter />
          </Suspense>
        </main>
      </div>
    </>
  );
};

export default Cursos;
