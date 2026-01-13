// ============================================
// 📚 CURSOS DO ALUNO - Year 2300 Cinematic Experience
// CONSTITUTIONAL: Student Courses Canonical Mirror v1.0
// 🚀 HIERARQUIA: Curso → Subcategoria → Módulo → Aulas
// 🔄 REALTIME: Sincronização instantânea com Gestão
// ============================================

import { memo } from 'react';
import { Play, Video } from 'lucide-react';
import AlunoCoursesHierarchy from '@/components/aluno/AlunoCoursesHierarchy';

// ============================================
// 🏛️ MAIN COMPONENT - Year 2300 Experience
// ============================================

const AlunoCursos = memo(function AlunoCursos() {
  return (
    <div className="relative bg-background min-h-screen">
      {/* UNIFIED HERO HEADER — Video Aulas Premium */}
      <div className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-rose-950/40 via-background to-background pointer-events-none" />
        
        {/* Tech grid pattern */}
        <div 
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(225, 29, 72, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(225, 29, 72, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px'
          }}
        />
        
        {/* Red glow orbs */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-64 h-64 bg-red-600/8 rounded-full blur-[100px] pointer-events-none" />
        
        {/* Content */}
        <div className="relative z-10 px-4 md:px-6 lg:px-8 pt-6 pb-8">
          <div className="max-w-[98vw] mx-auto">
            
            {/* VIDEO AULAS PREMIUM — Destaque Principal */}
            <div className="flex flex-col items-center text-center space-y-4">
              
              {/* Premium Badge */}
              <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-gradient-to-r from-rose-500/20 via-red-500/15 to-rose-500/20 border border-rose-500/40 shadow-lg shadow-rose-500/10">
                <Video className="w-5 h-5 text-rose-400" />
                <span className="text-sm font-bold text-rose-300 tracking-[0.2em] uppercase">
                  Área de Vídeos
                </span>
                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />
              </div>
              
              {/* Main Title — VIDEO AULAS PREMIUM em destaque */}
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight">
                <span className="bg-gradient-to-r from-rose-400 via-red-400 to-rose-500 bg-clip-text text-transparent drop-shadow-lg">
                  Video Aulas Premium
                </span>
              </h1>
              
              {/* Subtitle */}
              <p className="text-base md:text-lg text-muted-foreground max-w-xl">
                Navegue pela biblioteca completa de cursos, módulos e aulas
              </p>
              
              {/* Decorative line */}
              <div className="w-32 h-[2px] bg-gradient-to-r from-transparent via-rose-500/50 to-transparent mt-2" />
            </div>
          </div>
        </div>
        
        {/* Bottom fade into content */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </div>

      {/* MAIN CONTENT */}
      <div className="px-3 md:px-4 lg:px-6 pb-16">
        <div className="mx-auto max-w-[98vw]">
          <AlunoCoursesHierarchy />
        </div>
      </div>
    </div>
  );
});

export default AlunoCursos;
