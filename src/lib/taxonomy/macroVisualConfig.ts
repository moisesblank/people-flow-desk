// ============================================
// 🎨 CONFIGURAÇÃO VISUAL UNIVERSAL DOS MACROs
// LEI SUPREMA: Apenas CORES e ÍCONES ficam aqui
// Os NOMES vêm do banco (question_taxonomy)
// Constituição SYNAPSE Ω v10.4
// ============================================

import {
  Beaker,
  Atom,
  FlaskConical,
  Leaf,
  Dna,
  LucideIcon
} from 'lucide-react';

/**
 * Configuração visual para cada MACRO
 * IMPORTANTE: As chaves são os LABELs do banco (Química Geral, etc.)
 */
export interface MacroVisualConfig {
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  hoverBg: string;
  gradient: string;
  badgeClass: string;
}

/**
 * 🎨 MAPEAMENTO VISUAL ÚNICO
 * Chave = LABEL do banco (ex: "Química Geral")
 */
export const MACRO_VISUAL_CONFIG: Record<string, MacroVisualConfig> = {
  'Química Geral': {
    icon: Beaker,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    hoverBg: 'hover:bg-amber-500/20',
    gradient: 'from-amber-500 to-orange-500',
    badgeClass: 'bg-amber-500/90 text-white',
  },
  'Físico-Química': {
    icon: Atom,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    hoverBg: 'hover:bg-cyan-500/20',
    gradient: 'from-cyan-500 to-blue-500',
    badgeClass: 'bg-cyan-500/90 text-white',
  },
  'Química Orgânica': {
    icon: FlaskConical,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    hoverBg: 'hover:bg-purple-500/20',
    gradient: 'from-purple-500 to-violet-500',
    badgeClass: 'bg-purple-600/90 text-white',
  },
  'Química Ambiental': {
    icon: Leaf,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    hoverBg: 'hover:bg-green-500/20',
    gradient: 'from-green-500 to-emerald-500',
    badgeClass: 'bg-green-600/90 text-white',
  },
  'Bioquímica': {
    icon: Dna,
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
    borderColor: 'border-pink-500/30',
    hoverBg: 'hover:bg-pink-500/20',
    gradient: 'from-pink-500 to-rose-500',
    badgeClass: 'bg-pink-600/90 text-white',
  },
};

/**
 * Configuração visual padrão para MACROs não mapeados
 */
export const DEFAULT_MACRO_VISUAL: MacroVisualConfig = {
  icon: Beaker,
  color: 'text-muted-foreground',
  bgColor: 'bg-muted/10',
  borderColor: 'border-muted/30',
  hoverBg: 'hover:bg-muted/20',
  gradient: 'from-muted to-muted-foreground',
  badgeClass: 'bg-muted text-muted-foreground',
};

/**
 * Obtém a configuração visual de um MACRO pelo seu LABEL
 * @param macroLabel - O label do macro (ex: "Química Geral")
 * @returns Configuração visual ou default
 */
export function getMacroVisual(macroLabel: string | null | undefined): MacroVisualConfig {
  if (!macroLabel) return DEFAULT_MACRO_VISUAL;
  return MACRO_VISUAL_CONFIG[macroLabel] || DEFAULT_MACRO_VISUAL;
}

/**
 * Obtém apenas o ícone de um MACRO
 */
export function getMacroIcon(macroLabel: string | null | undefined): LucideIcon {
  return getMacroVisual(macroLabel).icon;
}

/**
 * Obtém apenas a cor de um MACRO
 */
export function getMacroColor(macroLabel: string | null | undefined): string {
  return getMacroVisual(macroLabel).color;
}

/**
 * Obtém a classe de badge de um MACRO
 */
export function getMacroBadgeClass(macroLabel: string | null | undefined): string {
  return getMacroVisual(macroLabel).badgeClass;
}

/**
 * Obtém o gradiente de um MACRO
 */
export function getMacroGradient(macroLabel: string | null | undefined): string {
  return getMacroVisual(macroLabel).gradient;
}

/**
 * Lista de todos os MACROs conhecidos (para validação)
 * NOTA: Para a lista canônica, use useQuestionTaxonomy()
 */
export const KNOWN_MACRO_LABELS = Object.keys(MACRO_VISUAL_CONFIG);
