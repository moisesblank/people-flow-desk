// ============================================
// 🎯 ALUNOS UNIVERSE SELECTOR — PARTE 6
// Pré-seleção operacional antes de renderizar gestão
// PATCH-ONLY: Não duplica telas, apenas camada de seleção
// ============================================

import { motion } from "framer-motion";
import { 
  MapPin, Globe, Wifi, UserCheck, 
  GraduationCap, ChevronRight, Sparkles 
} from "lucide-react";
import { FuturisticCard } from "@/components/ui/futuristic-card";
import { CyberBackground } from "@/components/ui/cyber-background";
import { FuturisticPageHeader } from "@/components/ui/futuristic-page-header";

/**
 * Universos de alunos disponíveis para seleção
 * Baseado nos critérios operacionais da gestão
 */
export type AlunoUniverseType = 
  | 'presencial'           // A) Alunos Presencial
  | 'presencial_online'    // B) Alunos Presencial + Online
  | 'online'               // C) Alunos Online
  | 'registrados';         // D) Registrados (Área Gratuita)

export interface AlunoUniverseOption {
  id: AlunoUniverseType;
  label: string;
  description: string;
  icon: React.ElementType;
  accentColor: 'blue' | 'purple' | 'cyan' | 'green';
  filterFn: (student: any) => boolean;
  wpFilterFn?: (wpUser: any) => boolean;
}

/**
 * Opções de universo com filtros correspondentes
 * Os filtros serão aplicados nos dados já carregados
 */
export const ALUNO_UNIVERSE_OPTIONS: AlunoUniverseOption[] = [
  {
    id: 'presencial',
    label: 'Alunos Presencial',
    description: 'Alunos matriculados em cursos presenciais',
    icon: MapPin,
    accentColor: 'blue',
    // Filtra por fonte ou curso presencial (ajustar conforme dados reais)
    filterFn: (s) => s.fonte === 'presencial' || s.curso?.includes('presencial'),
    wpFilterFn: (wp) => wp.grupos?.some((g: string) => g.toLowerCase().includes('presencial')),
  },
  {
    id: 'presencial_online',
    label: 'Presencial + Online',
    description: 'Alunos com acesso híbrido (presencial e online)',
    icon: Globe,
    accentColor: 'purple',
    // Mostra todos os alunos pagantes (presencial ou online)
    filterFn: (s) => s.status === 'Ativo' || s.status === 'ativo',
    wpFilterFn: (wp) => wp.tem_pagamento_confirmado === true,
  },
  {
    id: 'online',
    label: 'Alunos Online',
    description: 'Alunos matriculados exclusivamente online',
    icon: Wifi,
    accentColor: 'cyan',
    // Filtra por fonte online ou WordPress com pagamento
    filterFn: (s) => s.fonte !== 'presencial' && (s.status === 'Ativo' || s.status === 'ativo'),
    wpFilterFn: (wp) => wp.tem_pagamento_confirmado === true && !wp.grupos?.some((g: string) => g.toLowerCase().includes('presencial')),
  },
  {
    id: 'registrados',
    label: 'Registrados (Área Gratuita)',
    description: 'Usuários registrados sem pagamento confirmado',
    icon: UserCheck,
    accentColor: 'green',
    // Filtra usuários sem pagamento (aluno_gratuito)
    filterFn: (s) => s.status === 'Pendente' || s.status === 'pendente',
    wpFilterFn: (wp) => wp.tem_pagamento_confirmado === false,
  },
];

interface AlunosUniverseSelectorProps {
  onSelect: (universe: AlunoUniverseType) => void;
}

export function AlunosUniverseSelector({ onSelect }: AlunosUniverseSelectorProps) {
  return (
    <div className="relative min-h-screen">
      <CyberBackground variant="matrix" />
      
      <div className="relative z-10 p-4 md:p-8 lg:p-12">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Header */}
          <FuturisticPageHeader
            title="Gestão de Alunos"
            subtitle="Selecione o universo de alunos para gerenciar"
            icon={GraduationCap}
            badge="SELEÇÃO OPERACIONAL"
            accentColor="blue"
          />

          {/* Grid de Opções */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ALUNO_UNIVERSE_OPTIONS.map((option, index) => {
              const Icon = option.icon;
              
              return (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <FuturisticCard
                    accentColor={option.accentColor}
                    className="p-6 cursor-pointer group hover:scale-[1.02] transition-all duration-300"
                    onClick={() => onSelect(option.id)}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`
                        p-3 rounded-xl 
                        ${option.accentColor === 'blue' ? 'bg-blue-500/20 text-blue-400' : ''}
                        ${option.accentColor === 'purple' ? 'bg-purple-500/20 text-purple-400' : ''}
                        ${option.accentColor === 'cyan' ? 'bg-cyan-500/20 text-cyan-400' : ''}
                        ${option.accentColor === 'green' ? 'bg-emerald-500/20 text-emerald-400' : ''}
                      `}>
                        <Icon className="h-6 w-6" />
                      </div>
                      
                      <div className="flex-1 space-y-1">
                        <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                          {option.label}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {option.description}
                        </p>
                      </div>
                      
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                    
                    {/* Hover Glow Effect */}
                    <div className={`
                      absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300
                      rounded-xl pointer-events-none
                      ${option.accentColor === 'blue' ? 'bg-gradient-to-br from-blue-500/5 to-transparent' : ''}
                      ${option.accentColor === 'purple' ? 'bg-gradient-to-br from-purple-500/5 to-transparent' : ''}
                      ${option.accentColor === 'cyan' ? 'bg-gradient-to-br from-cyan-500/5 to-transparent' : ''}
                      ${option.accentColor === 'green' ? 'bg-gradient-to-br from-emerald-500/5 to-transparent' : ''}
                    `} />
                  </FuturisticCard>
                </motion.div>
              );
            })}
          </div>

          {/* Info Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Selecione um universo para visualizar e gerenciar os alunos correspondentes</span>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook helper para aplicar filtros do universo selecionado
 */
export function getUniverseFilters(universeId: AlunoUniverseType) {
  const option = ALUNO_UNIVERSE_OPTIONS.find(o => o.id === universeId);
  return {
    filterFn: option?.filterFn || (() => true),
    wpFilterFn: option?.wpFilterFn || (() => true),
    label: option?.label || 'Todos',
    accentColor: option?.accentColor || 'blue',
  };
}
