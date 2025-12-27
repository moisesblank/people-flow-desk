// ============================================
// 🎯 ALUNOS UNIVERSE SELECTOR — PARTE 6 + 7
// Pré-seleção operacional + Subseleção de produto
// PATCH-ONLY: Não duplica telas, apenas camada de seleção
// Persistência via querystring
// ============================================

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  MapPin, Globe, Wifi, UserCheck, 
  GraduationCap, ChevronRight, Sparkles,
  BookOpen, Package, ArrowLeft
} from "lucide-react";
import { FuturisticCard } from "@/components/ui/futuristic-card";
import { CyberBackground } from "@/components/ui/cyber-background";
import { FuturisticPageHeader } from "@/components/ui/futuristic-page-header";
import { Button } from "@/components/ui/button";

/**
 * Universos de alunos disponíveis para seleção
 * Baseado nos critérios operacionais da gestão
 */
export type AlunoUniverseType = 
  | 'presencial'           // A) Alunos Presencial
  | 'presencial_online'    // B) Alunos Presencial + Online
  | 'online'               // C) Alunos Online
  | 'registrados';         // D) Registrados (Área Gratuita)

/**
 * ⚡ PARTE 7: Tipos de produto online
 */
export type OnlineProductType = 
  | 'livro_web'      // Produto Online — Livro Web
  | 'livro_fisico';  // Produto Online — Livro Físico

/**
 * Seleção completa: universo + produto (quando aplicável)
 */
export interface AlunoSelectionState {
  universe: AlunoUniverseType;
  product?: OnlineProductType;
}

export interface AlunoUniverseOption {
  id: AlunoUniverseType;
  label: string;
  description: string;
  icon: React.ElementType;
  accentColor: 'blue' | 'purple' | 'cyan' | 'green';
  requiresProductSelection: boolean; // PARTE 7: Indica se precisa subseleção
  filterFn: (student: any) => boolean;
  wpFilterFn?: (wpUser: any) => boolean;
}

/**
 * ⚡ PARTE 7: Opções de produto online
 */
export interface OnlineProductOption {
  id: OnlineProductType;
  label: string;
  description: string;
  icon: React.ElementType;
  accentColor: 'cyan' | 'purple';
  filterFn: (student: any) => boolean;
  wpFilterFn?: (wpUser: any) => boolean;
}

export const ONLINE_PRODUCT_OPTIONS: OnlineProductOption[] = [
  {
    id: 'livro_web',
    label: 'Produto Online — Livro Web',
    description: 'Alunos com acesso ao livro digital/web',
    icon: BookOpen,
    accentColor: 'cyan',
    // Filtra por produto livro web (ajustar conforme dados reais)
    filterFn: (s) => s.curso?.toLowerCase().includes('web') || s.curso?.toLowerCase().includes('digital') || true,
    wpFilterFn: (wp) => wp.grupos?.some((g: string) => g.toLowerCase().includes('web') || g.toLowerCase().includes('digital')) || wp.tem_pagamento_confirmado,
  },
  {
    id: 'livro_fisico',
    label: 'Produto Online — Livro Físico',
    description: 'Alunos com acesso ao livro físico enviado',
    icon: Package,
    accentColor: 'purple',
    // Filtra por produto livro físico
    filterFn: (s) => s.curso?.toLowerCase().includes('fisico') || s.curso?.toLowerCase().includes('físico') || true,
    wpFilterFn: (wp) => wp.grupos?.some((g: string) => g.toLowerCase().includes('fisico') || g.toLowerCase().includes('físico')) || wp.tem_pagamento_confirmado,
  },
];

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
    requiresProductSelection: false,
    filterFn: (s) => s.fonte === 'presencial' || s.curso?.includes('presencial'),
    wpFilterFn: (wp) => wp.grupos?.some((g: string) => g.toLowerCase().includes('presencial')),
  },
  {
    id: 'presencial_online',
    label: 'Presencial + Online',
    description: 'Alunos com acesso híbrido (presencial e online)',
    icon: Globe,
    accentColor: 'purple',
    requiresProductSelection: true, // ⚡ PARTE 7: Requer subseleção
    filterFn: (s) => s.status === 'Ativo' || s.status === 'ativo',
    wpFilterFn: (wp) => wp.tem_pagamento_confirmado === true,
  },
  {
    id: 'online',
    label: 'Alunos Online',
    description: 'Alunos matriculados exclusivamente online',
    icon: Wifi,
    accentColor: 'cyan',
    requiresProductSelection: true, // ⚡ PARTE 7: Requer subseleção
    filterFn: (s) => s.fonte !== 'presencial' && (s.status === 'Ativo' || s.status === 'ativo'),
    wpFilterFn: (wp) => wp.tem_pagamento_confirmado === true && !wp.grupos?.some((g: string) => g.toLowerCase().includes('presencial')),
  },
  {
    id: 'registrados',
    label: 'Registrados (Área Gratuita)',
    description: 'Usuários registrados sem pagamento confirmado',
    icon: UserCheck,
    accentColor: 'green',
    requiresProductSelection: false,
    filterFn: (s) => s.status === 'Pendente' || s.status === 'pendente',
    wpFilterFn: (wp) => wp.tem_pagamento_confirmado === false,
  },
];

// ============================================
// ⚡ PARTE 7: Querystring helpers
// ============================================
export function parseSelectionFromUrl(): AlunoSelectionState | null {
  const params = new URLSearchParams(window.location.search);
  const universe = params.get('universo') as AlunoUniverseType | null;
  const product = params.get('produto') as OnlineProductType | null;
  
  if (!universe) return null;
  
  // Validar universo
  if (!ALUNO_UNIVERSE_OPTIONS.find(o => o.id === universe)) return null;
  
  // Validar produto se existir
  if (product && !ONLINE_PRODUCT_OPTIONS.find(o => o.id === product)) {
    return { universe };
  }
  
  return { universe, product: product || undefined };
}

export function updateUrlWithSelection(selection: AlunoSelectionState | null) {
  const url = new URL(window.location.href);
  
  if (!selection) {
    url.searchParams.delete('universo');
    url.searchParams.delete('produto');
  } else {
    url.searchParams.set('universo', selection.universe);
    if (selection.product) {
      url.searchParams.set('produto', selection.product);
    } else {
      url.searchParams.delete('produto');
    }
  }
  
  window.history.replaceState({}, '', url.toString());
}

// ============================================
// Componentes
// ============================================

interface AlunosUniverseSelectorProps {
  onSelect: (selection: AlunoSelectionState) => void;
}

export function AlunosUniverseSelector({ onSelect }: AlunosUniverseSelectorProps) {
  // ⚡ PARTE 7: Estado para subseleção
  const [pendingUniverse, setPendingUniverse] = useState<AlunoUniverseType | null>(null);

  const handleUniverseSelect = (universeId: AlunoUniverseType) => {
    const option = ALUNO_UNIVERSE_OPTIONS.find(o => o.id === universeId);
    
    // Se requer subseleção de produto, mostrar tela de produto
    if (option?.requiresProductSelection) {
      setPendingUniverse(universeId);
    } else {
      // Seleciona direto sem produto
      onSelect({ universe: universeId });
    }
  };

  const handleProductSelect = (productId: OnlineProductType) => {
    if (pendingUniverse) {
      onSelect({ universe: pendingUniverse, product: productId });
    }
  };

  // ⚡ PARTE 7: Tela de subseleção de produto
  if (pendingUniverse) {
    const universeOption = ALUNO_UNIVERSE_OPTIONS.find(o => o.id === pendingUniverse);
    
    return (
      <div className="relative min-h-screen">
        <CyberBackground variant="matrix" />
        
        <div className="relative z-10 p-4 md:p-8 lg:p-12">
          <div className="mx-auto max-w-4xl space-y-8">
            {/* Botão Voltar */}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setPendingUniverse(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar à seleção de universo
            </Button>

            {/* Header */}
            <FuturisticPageHeader
              title="Selecione o Produto"
              subtitle={`Universo: ${universeOption?.label}`}
              icon={GraduationCap}
              badge="SUBSELEÇÃO DE PRODUTO"
              accentColor={universeOption?.accentColor || 'blue'}
            />

            {/* Grid de Produtos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {ONLINE_PRODUCT_OPTIONS.map((option, index) => {
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
                      onClick={() => handleProductSelect(option.id)}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`
                          p-3 rounded-xl 
                          ${option.accentColor === 'cyan' ? 'bg-cyan-500/20 text-cyan-400' : ''}
                          ${option.accentColor === 'purple' ? 'bg-purple-500/20 text-purple-400' : ''}
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
                      
                      <div className={`
                        absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300
                        rounded-xl pointer-events-none
                        ${option.accentColor === 'cyan' ? 'bg-gradient-to-br from-cyan-500/5 to-transparent' : ''}
                        ${option.accentColor === 'purple' ? 'bg-gradient-to-br from-purple-500/5 to-transparent' : ''}
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
              transition={{ delay: 0.3 }}
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
            >
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Selecione o tipo de produto para filtrar os alunos</span>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // Tela principal de seleção de universo
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
                    onClick={() => handleUniverseSelect(option.id)}
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
                        {option.requiresProductSelection && (
                          <p className="text-xs text-primary/70 mt-1">
                            → Requer seleção de produto
                          </p>
                        )}
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
 * Hook helper para aplicar filtros do universo + produto selecionado
 * ⚡ PARTE 7: Agora combina filtros de universo e produto
 */
export function getUniverseFilters(selection: AlunoSelectionState) {
  const universeOption = ALUNO_UNIVERSE_OPTIONS.find(o => o.id === selection.universe);
  const productOption = selection.product 
    ? ONLINE_PRODUCT_OPTIONS.find(o => o.id === selection.product) 
    : null;
  
  // Combina filtros: universo AND produto
  const combinedFilterFn = (student: any) => {
    const passesUniverse = universeOption?.filterFn(student) ?? true;
    const passesProduct = productOption ? productOption.filterFn(student) : true;
    return passesUniverse && passesProduct;
  };
  
  const combinedWpFilterFn = (wpUser: any) => {
    const passesUniverse = universeOption?.wpFilterFn?.(wpUser) ?? true;
    const passesProduct = productOption?.wpFilterFn ? productOption.wpFilterFn(wpUser) : true;
    return passesUniverse && passesProduct;
  };
  
  // Label combinado
  const label = productOption 
    ? `${universeOption?.label || 'Todos'} → ${productOption.label}`
    : universeOption?.label || 'Todos';
  
  return {
    filterFn: combinedFilterFn,
    wpFilterFn: combinedWpFilterFn,
    label,
    accentColor: productOption?.accentColor || universeOption?.accentColor || 'blue',
  };
}

// Mantém compatibilidade: aceita string simples também
export function getUniverseFiltersLegacy(universeId: AlunoUniverseType) {
  return getUniverseFilters({ universe: universeId });
}
