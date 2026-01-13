// ============================================
// PÁGINA DEDICADA: MATRÍCULA (CTA FINAL)
// URL: /matricula
// Fragmento da Home - EpicCTASection
// ============================================

import { lazy, Suspense } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Helmet } from "react-helmet";

// Lazy load dos componentes
const EpicCTASection = lazy(() => import("@/components/landing/EpicCTASection").then(m => ({ default: m.EpicCTASection })));
const FuturisticFooter = lazy(() => import("@/components/landing/FuturisticFooter").then(m => ({ default: m.FuturisticFooter })));

const SectionLoader = () => (
  <div className="w-full py-12 flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-pink-500/50 border-t-pink-500 rounded-full animate-spin" />
  </div>
);

const Matricula = () => {
  return (
    <>
      <Helmet>
        <title>Matricule-se Agora | Prof. Moisés Medeiros - Sua vaga está esperando</title>
        <meta name="description" content="Matricule-se agora no curso do Prof. Moisés Medeiros. Oferta por tempo limitado com até 50% de desconto. Garantia de 30 dias." />
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

export default Matricula;
