// ============================================
// 📚 CURSOS DO ALUNO - Year 2300 Cinematic Experience
// CONSTITUTIONAL: Student Courses Canonical Mirror v1.0
// 🚀 HIERARQUIA: Curso → Subcategoria → Módulo → Aulas
// 🔄 REALTIME: Sincronização instantânea com Gestão
// ============================================

import { memo } from 'react';
import { GraduationCap } from 'lucide-react';
import { CyberBackground } from '@/components/ui/cyber-background';
import { FuturisticPageHeader } from '@/components/ui/futuristic-page-header';
import AlunoCoursesHierarchy from '@/components/aluno/AlunoCoursesHierarchy';

// ============================================
// 🏛️ MAIN COMPONENT - Year 2300 Experience
// ============================================

const AlunoCursos = memo(function AlunoCursos() {
  return (
    // 🛡️ ROOT LAYOUT FIX: Usar pb-safe para garantir padding inferior em viewports móveis
    // Removido min-h-screen que forçava altura fixa causando clipping
    <div className="relative">
      {/* 🌌 Cinematic Background */}
      <CyberBackground variant="grid" intensity="medium" />
      
      <div className="relative z-10 p-3 md:p-4 lg:p-6 pb-16">
        <div className="mx-auto max-w-[98vw] space-y-6">
          
          {/* 🎬 Futuristic Header */}
          <FuturisticPageHeader
            title="Meus Cursos"
            subtitle="Navegue pela biblioteca completa de cursos, módulos e aulas"
            icon={GraduationCap}
            accentColor="primary"
          />

          {/* 📚 Hierarchical Content */}
          <AlunoCoursesHierarchy />
        </div>
      </div>
    </div>
  );
});

export default AlunoCursos;
