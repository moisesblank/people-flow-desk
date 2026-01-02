// ============================================
// 📚 QUESTION RESOLUTION — COMPONENTE UNIVERSAL
// PADRÃO OBRIGATÓRIO PARA TODAS AS RESOLUÇÕES
// 
// ESTRUTURA VISUAL ORGANIZADA EM BLOCOS:
// - Parser inteligente detecta seções e alternativas
// - CADA alternativa em seu bloco visual individual
// - Separação clara entre seções
// - Design profissional de 2300
// ============================================

import { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { formatChemicalFormulas } from '@/lib/chemicalFormatter';
import { getBancaLabel } from '@/constants/bancas';
import { 
  Sparkles, 
  Target, 
  FolderTree, 
  Lightbulb,
  AlertTriangle,
  Compass,
  CheckCircle,
  Beaker,
  Cog,
  BarChart3,
  GraduationCap,
  Zap,
  XCircle,
  CircleDot,
  MessageCircle,
} from 'lucide-react';

// Fallback padrão
const DEFAULT_BANCA_HEADER = 'QUESTÃO SIMULADO PROF. MOISÉS MEDEIROS';

// Mapa de dificuldade
const DIFFICULTY_LABELS: Record<string, { label: string; color: string }> = {
  'facil': { label: 'FÁCIL', color: 'text-green-500' },
  'medio': { label: 'MÉDIO', color: 'text-yellow-500' },
  'dificil': { label: 'DIFÍCIL', color: 'text-red-500' },
};

// Tipos de seção detectáveis
type SectionType = 
  | 'intro' 
  | 'passo' 
  | 'conclusao' 
  | 'competencia' 
  | 'estrategia' 
  | 'pegadinhas' 
  | 'dica'
  | 'afirmacao_correta'
  | 'afirmacao_incorreta'
  | 'alternativa_analise'
  | 'alternativa_correta'
  | 'alternativa_errada'
  | 'resumo';

interface ParsedSection {
  type: SectionType;
  title?: string;
  content: string;
  stepNumber?: number;
  afirmacaoNumber?: string;
  alternativaLetter?: string;
  isCorrect?: boolean;
}

interface QuestionResolutionProps {
  resolutionText: string;
  banca?: string | null;
  ano?: number | null;
  difficulty?: string | null;
  tema?: string | null;
  macro?: string | null;
  micro?: string | null;
  competenciaEnem?: string | null;
  habilidadeEnem?: string | null;
  className?: string;
}

/**
 * Limpa metadados/HTML indesejados do início do texto
 */
function cleanResolutionText(text: string): string {
  if (!text) return '';
  
  let cleaned = text;
  
  // PASSO 1: Remover TODO o lixo de HTML/interface copiado antes do conteúdo real
  const contentStartPatterns = [
    /QUESTÃO\s+SIMULADO/i,
    /🔬\s*RESOLUÇÃO/i,
    /✨\s*QUESTÃO/i,
    /O\s+gráfico/i,
    /Observando/i,
    /Analis/i,
    /A\s+questão/i,
    /Meus\s+queridos/i,
    /Queridos/i,
    /Vamos\s+analisar/i,
  ];
  
  for (const pattern of contentStartPatterns) {
    const match = cleaned.match(pattern);
    if (match && match.index !== undefined && match.index > 0) {
      cleaned = cleaned.substring(match.index);
      break;
    }
  }
  
  // PASSO 2: Limpar metadados específicos
  cleaned = cleaned
    .replace(/\*\]:[^"]*"[^>]*>/g, '')
    .replace(/\*\]:pointer-events[^"]*"[^>]*>/g, '')
    .replace(/\*\][^"]*scroll-mt[^"]*"[^>]*>/g, '')
    .replace(/dir="auto"[^>]*>/g, '')
    .replace(/tabindex="-?\d+"[^>]*>/g, '')
    .replace(/data-[a-z-]+="[^"]*"/gi, '')
    .replace(/\*\]:[^\s]+/g, '')
    .trim();
  
  // PASSO 3: Remover duplicatas de header
  cleaned = cleaned
    .replace(/QUESTÃO SIMULADO PROF\. MOISÉS MEDEIROS/gi, '')
    .replace(/✨\s*QUESTÃO:\s*NÍVEL\s*(FÁCIL|MÉDIO|DIFÍCIL)/gi, '')
    .replace(/🧪\s*TEMA:[^\n]*/gi, '')
    .replace(/📁\s*CLASSIFICAÇÃO/gi, '')
    .replace(/🔹\s*Macroassunto:[^\n]*/gi, '')
    .replace(/🔹\s*Microassunto:[^\n]*/gi, '')
    .trim();
  
  return cleaned;
}

/**
 * Parser inteligente AVANÇADO que detecta seções E alternativas
 */
function parseResolutionText(text: string): ParsedSection[] {
  if (!text) return [];
  
  const cleanedText = cleanResolutionText(text);
  if (!cleanedText) return [];

  const sections: ParsedSection[] = [];
  
  // ========== DETECTAR ALTERNATIVAS INDIVIDUAIS ==========
  // Padrões para alternativas: "❌ Alternativa A", "✅ Alternativa D", "🔵 Alternativa A"
  const alternativaPatterns = [
    // Alternativas erradas com X
    { 
      regex: /[❌✖️✗]\s*Alternativa\s*([A-E])\s*/gi, 
      type: 'alternativa_errada' as SectionType,
      isCorrect: false 
    },
    // Alternativas corretas com check
    { 
      regex: /[✅✔️✓]\s*Alternativa\s*([A-E])\s*/gi, 
      type: 'alternativa_correta' as SectionType,
      isCorrect: true 
    },
    // Alternativas neutras (para análise)
    { 
      regex: /[🔵🔹▪️•]\s*Alternativa\s*([A-E])\s*/gi, 
      type: 'alternativa_analise' as SectionType,
      isCorrect: false 
    },
    // Afirmações corretas
    { 
      regex: /[✅✔️]\s*AFIRMAÇÃO\s*([IVX]+)/gi, 
      type: 'afirmacao_correta' as SectionType,
      isCorrect: true 
    },
    // Afirmações incorretas
    { 
      regex: /[❌✖️]\s*AFIRMAÇÃO\s*([IVX]+)/gi, 
      type: 'afirmacao_incorreta' as SectionType,
      isCorrect: false 
    },
  ];

  // Padrões de seções especiais (ORDEM IMPORTA - mais específico primeiro)
  const sectionPatterns = [
    // Conclusão e Gabarito
    { regex: /[🧬📊✅☑️]\s*CONCLUSÃO[:\s]*/gi, type: 'conclusao' as SectionType },
    { regex: /A alternativa correta é/gi, type: 'conclusao' as SectionType },
    { regex: /Apenas\s+Alternativa/gi, type: 'conclusao' as SectionType },
    { regex: /CONCLUSÃO E GABARITO/gi, type: 'conclusao' as SectionType },
    
    // Competência e Habilidade ENEM (múltiplos formatos)
    { regex: /[🎯⚫]\s*COMPETÊNCIA\s*E\s*HABILIDADE\s*[-–]?\s*ENEM[:\s]*/gi, type: 'competencia' as SectionType },
    { regex: /COMPETÊNCIA\s*E\s*HABILIDADE\s*[-–]?\s*ENEM[:\s]*/gi, type: 'competencia' as SectionType },
    { regex: /[◆⚫🎯]\s*COMPETÊNCIA:/gi, type: 'competencia' as SectionType },
    
    // Direcionamento / Estratégia (múltiplos formatos)
    { regex: /[📌⊙◎]\s*DIRECIONAMENTO\s*[\/|]?\s*ESTRATÉGIA[:\s]*/gi, type: 'estrategia' as SectionType },
    { regex: /DIRECIONAMENTO\s*[\/|]?\s*ESTRATÉGIA[:\s]*/gi, type: 'estrategia' as SectionType },
    { regex: /[🚀✦]\s*ESTRATÉGIA[:\s]*/gi, type: 'estrategia' as SectionType },
    
    // Pegadinhas Comuns (múltiplos formatos)
    { regex: /[⚠️⚠△]\s*PEGADINHAS?\s*(COMUNS?)?[:\s]*/gi, type: 'pegadinhas' as SectionType },
    { regex: /PEGADINHAS?\s*(COMUNS?)?[:\s]*/gi, type: 'pegadinhas' as SectionType },
    { regex: /[⚠️⚠△]\s*Confundir/gi, type: 'pegadinhas' as SectionType },
    
    // Dica de Ouro (múltiplos formatos)
    { regex: /[💡🔆✨]\s*DICA\s*DE\s*OURO[:\s]*/gi, type: 'dica' as SectionType },
    { regex: /DICA\s*DE\s*OURO[:\s]*/gi, type: 'dica' as SectionType },
    { regex: /[💡]\s*Dica:/gi, type: 'dica' as SectionType },
    
    // Passos
    { regex: /[📊⚗️⚙️🔬]\s*PASSO\s*(\d+)[:\s]*/gi, type: 'passo' as SectionType },
    { regex: /PASSO\s*(\d+)[:\s]*/gi, type: 'passo' as SectionType },
    
    // Resumo
    { regex: /Agora reunindo tudo/gi, type: 'resumo' as SectionType },
    { regex: /Reunindo tudo/gi, type: 'resumo' as SectionType },
  ];

  // Coletar todas as posições
  interface SectionStart {
    index: number;
    type: SectionType;
    match: string;
    stepNumber?: number;
    afirmacaoNumber?: string;
    alternativaLetter?: string;
    isCorrect?: boolean;
  }
  
  const allStarts: SectionStart[] = [];

  // Buscar alternativas
  for (const pattern of alternativaPatterns) {
    let match;
    const regex = new RegExp(pattern.regex.source, 'gi');
    while ((match = regex.exec(cleanedText)) !== null) {
      allStarts.push({
        index: match.index,
        type: pattern.type,
        match: match[0],
        alternativaLetter: match[1]?.toUpperCase(),
        afirmacaoNumber: pattern.type.includes('afirmacao') ? match[1] : undefined,
        isCorrect: pattern.isCorrect,
      });
    }
  }

  // Buscar seções especiais
  for (const pattern of sectionPatterns) {
    let match;
    const regex = new RegExp(pattern.regex.source, 'gi');
    while ((match = regex.exec(cleanedText)) !== null) {
      allStarts.push({
        index: match.index,
        type: pattern.type,
        match: match[0],
        stepNumber: pattern.type === 'passo' ? parseInt(match[1] || '0') : undefined,
      });
    }
  }

  // Ordenar por posição
  allStarts.sort((a, b) => a.index - b.index);

  // Sem seções = retorna como intro
  if (allStarts.length === 0) {
    return [{ type: 'intro', content: cleanedText.trim() }];
  }

  // Intro (texto antes da primeira seção) - LIMPAR referências a alternativas
  const firstSection = allStarts[0];
  if (firstSection.index > 0) {
    let introText = cleanedText.substring(0, firstSection.index).trim();
    
    // Remover qualquer menção a alternativas que possa ter vazado para a intro
    introText = introText
      .replace(/🔬\s*RESOLUÇÃO COMENTADA PELO PROF\. MOISÉS MEDEIROS[:\s]*/gi, '')
      .replace(/RESOLUÇÃO COMENTADA PELO PROF\. MOISÉS MEDEIROS[:\s]*/gi, '')
      .replace(/[❌✅✔️✓✗✖️🔵🔹▪️•]\s*Alternativa\s*[A-E][^\n]*/gi, '') // Remove linhas de alternativa
      .replace(/Alternativa\s*[A-E]\s*[-–→:][^\n]*/gi, '') // Remove padrões alternativos
      .replace(/\n{3,}/g, '\n\n') // Limpa linhas vazias extras
      .trim();
    
    if (introText) {
      sections.push({ type: 'intro', content: introText });
    }
  }

  // Processar cada seção
  for (let i = 0; i < allStarts.length; i++) {
    const current = allStarts[i];
    const next = allStarts[i + 1];
    
    const startIndex = current.index + current.match.length;
    const endIndex = next ? next.index : cleanedText.length;
    let content = cleanedText.substring(startIndex, endIndex).trim();

    // Limpar emojis redundantes do início do conteúdo
    content = content.replace(/^[🔵🔹▪️•❌✅✓✗✔️✖️]\s*/g, '').trim();

    if (content) {
      sections.push({
        type: current.type,
        content,
        stepNumber: current.stepNumber,
        afirmacaoNumber: current.afirmacaoNumber,
        alternativaLetter: current.alternativaLetter,
        isCorrect: current.isCorrect,
        title: current.match.trim(),
      });
    }
  }

  // ========== MERGE GLOBAL DE SEÇÕES DO MESMO TIPO ==========
  // REGRA UNIVERSAL: Agrupa TODAS as seções do mesmo tipo mergeable
  // NÃO importa se são consecutivas ou não - SEMPRE agrupa em uma única seção
  // Tipos afetados: pegadinhas, dica, estrategia, competencia
  // Esta é uma REGRA ABSOLUTA e PERMANENTE conforme Constitution v10.0
  
  const mergableTypes: SectionType[] = ['pegadinhas', 'dica', 'estrategia', 'competencia'];
  
  // Passo 1: Separar seções mergeáveis das não-mergeáveis
  const nonMergeable: ParsedSection[] = [];
  const mergeableByType: Map<SectionType, ParsedSection[]> = new Map();
  
  for (const section of sections) {
    if (mergableTypes.includes(section.type)) {
      const existing = mergeableByType.get(section.type) || [];
      existing.push(section);
      mergeableByType.set(section.type, existing);
    } else {
      nonMergeable.push(section);
    }
  }
  
  // Passo 2: Criar seções consolidadas para cada tipo mergeable
  const consolidatedMergeable: ParsedSection[] = [];
  
  for (const [type, sectionsOfType] of mergeableByType.entries()) {
    if (sectionsOfType.length === 0) continue;
    
    // Extrair todos os conteúdos únicos (deduplicação)
    const allContents: string[] = [];
    
    for (const section of sectionsOfType) {
      // Limpar o conteúdo de marcadores repetidos
      let content = section.content
        .replace(/^[•\-\s]+/gm, '')  // Remove bullets do início
        .replace(/PEGADINHAS?\s*(COMUNS?)?:?\s*/gi, '')  // Remove headers internos
        .replace(/DICA\s*DE\s*OURO:?\s*/gi, '')
        .replace(/DIRECIONAMENTO\s*[\/|]?\s*ESTRATÉGIA:?\s*/gi, '')
        .replace(/ESTRATÉGIA:?\s*/gi, '')
        .replace(/COMPETÊNCIAS?\s*E\s*HABILIDADES?\s*[-–]?\s*ENEM:?\s*/gi, '')  // Remove headers ENEM
        .replace(/\*\*Gabarito:[^\*]+\*\*/gi, '')  // Remove gabarito duplicado
        .replace(/---+/g, '')  // Remove separadores
        .replace(/\n{3,}/g, '\n\n')  // Normaliza quebras de linha
        .trim();
      
      if (content) {
        // Dividir em itens individuais se tiver múltiplos bullets
        const items = content.split(/\n+/).filter(item => item.trim());
        
        for (const item of items) {
          const normalizedItem = item.replace(/^[•\-\s]+/, '').trim();
          
          // Verificar duplicação semântica (ignorando pontuação e espaços)
          const normalized = normalizedItem.toLowerCase().replace(/[^\w\s]/g, '').trim();
          
          const isDuplicate = allContents.some(existing => {
            const existingNormalized = existing.toLowerCase().replace(/[^\w\s]/g, '').trim();
            return existingNormalized === normalized || 
                   existingNormalized.includes(normalized) ||
                   normalized.includes(existingNormalized);
          });
          
          if (!isDuplicate && normalizedItem.length > 10) {
            allContents.push(normalizedItem);
          }
        }
      }
    }
    
    if (allContents.length > 0) {
      // Formatar como lista com bullets
      const consolidatedContent = allContents.length === 1
        ? allContents[0]
        : allContents.map(item => `• ${item}`).join('\n\n');
      
      consolidatedMergeable.push({
        type,
        content: consolidatedContent,
        title: sectionsOfType[0].title,
      });
    }
  }
  
  // Passo 3: Reconstruir array final mantendo ordem lógica
  // Ordem: intro > passos > alternativas > conclusão > competência > [estratégia, pegadinhas, dica]
  const mergedSections: ParsedSection[] = [];
  
  // Adicionar não-mergeáveis na ordem original
  for (const section of nonMergeable) {
    mergedSections.push(section);
  }
  
  // Adicionar mergeáveis consolidados no final (ordem: competencia > estrategia > pegadinhas > dica)
  const mergeOrder: SectionType[] = ['competencia', 'estrategia', 'pegadinhas', 'dica'];
  for (const type of mergeOrder) {
    const consolidated = consolidatedMergeable.find(s => s.type === type);
    if (consolidated) {
      mergedSections.push(consolidated);
    }
  }

  return mergedSections;
}

/**
 * Ícone para cada tipo de seção
 */
function getSectionIcon(type: SectionType, stepNumber?: number) {
  switch (type) {
    case 'passo':
      if (stepNumber === 1) return Cog;
      if (stepNumber === 2) return Beaker;
      if (stepNumber === 3) return BarChart3;
      if (stepNumber === 4) return CheckCircle;
      return Zap;
    case 'conclusao':
      return CheckCircle;
    case 'competencia':
      return GraduationCap;
    case 'estrategia':
      return Compass;
    case 'pegadinhas':
      return AlertTriangle;
    case 'dica':
      return Lightbulb;
    case 'afirmacao_correta':
    case 'alternativa_correta':
      return CheckCircle;
    case 'afirmacao_incorreta':
    case 'alternativa_errada':
      return XCircle;
    case 'alternativa_analise':
      return CircleDot;
    case 'resumo':
      return MessageCircle;
    default:
      return Sparkles;
  }
}

/**
 * Configuração visual para cada tipo de seção
 */
function getSectionStyles(type: SectionType, isCorrect?: boolean): { 
  border: string; 
  bg: string; 
  iconColor: string; 
  titleColor: string;
  accentColor: string;
} {
  switch (type) {
    case 'alternativa_correta':
      return {
        border: 'border-l-4 border-l-green-500 border-t border-r border-b border-green-500/30',
        bg: 'bg-green-500/10',
        iconColor: 'text-green-500',
        titleColor: 'text-green-500',
        accentColor: 'bg-green-500/20',
      };
    case 'alternativa_errada':
      return {
        border: 'border-l-4 border-l-red-500 border-t border-r border-b border-red-500/30',
        bg: 'bg-red-500/5',
        iconColor: 'text-red-500',
        titleColor: 'text-red-500',
        accentColor: 'bg-red-500/20',
      };
    case 'alternativa_analise':
      return {
        border: 'border-l-4 border-l-blue-500 border-t border-r border-b border-blue-500/30',
        bg: 'bg-blue-500/5',
        iconColor: 'text-blue-500',
        titleColor: 'text-blue-500',
        accentColor: 'bg-blue-500/20',
      };
    case 'afirmacao_correta':
      return {
        border: 'border-l-4 border-l-green-500 border-t border-r border-b border-green-500/30',
        bg: 'bg-green-500/10',
        iconColor: 'text-green-500',
        titleColor: 'text-green-500',
        accentColor: 'bg-green-500/20',
      };
    case 'afirmacao_incorreta':
      return {
        border: 'border-l-4 border-l-red-500 border-t border-r border-b border-red-500/30',
        bg: 'bg-red-500/5',
        iconColor: 'text-red-500',
        titleColor: 'text-red-500',
        accentColor: 'bg-red-500/20',
      };
    case 'passo':
      return {
        border: 'border-l-4 border-l-blue-500 border-t border-r border-b border-blue-500/30',
        bg: 'bg-blue-500/5',
        iconColor: 'text-blue-500',
        titleColor: 'text-blue-500',
        accentColor: 'bg-blue-500/20',
      };
    case 'conclusao':
      return {
        border: 'border-l-4 border-l-emerald-500 border-t border-r border-b border-emerald-500/30',
        bg: 'bg-emerald-500/10',
        iconColor: 'text-emerald-500',
        titleColor: 'text-emerald-500',
        accentColor: 'bg-emerald-500/20',
      };
    case 'competencia':
      return {
        border: 'border-l-4 border-l-purple-500 border-t border-r border-b border-purple-500/30',
        bg: 'bg-purple-500/5',
        iconColor: 'text-purple-500',
        titleColor: 'text-purple-500',
        accentColor: 'bg-purple-500/20',
      };
    case 'estrategia':
      return {
        border: 'border-l-4 border-l-amber-500 border-t border-r border-b border-amber-500/30',
        bg: 'bg-amber-500/5',
        iconColor: 'text-amber-500',
        titleColor: 'text-amber-500',
        accentColor: 'bg-amber-500/20',
      };
    case 'pegadinhas':
      return {
        border: 'border-l-4 border-l-orange-500 border-t border-r border-b border-orange-500/30',
        bg: 'bg-orange-500/5',
        iconColor: 'text-orange-500',
        titleColor: 'text-orange-500',
        accentColor: 'bg-orange-500/20',
      };
    case 'dica':
      return {
        border: 'border-l-4 border-l-yellow-500 border-t border-r border-b border-yellow-500/30',
        bg: 'bg-yellow-500/5',
        iconColor: 'text-yellow-500',
        titleColor: 'text-yellow-500',
        accentColor: 'bg-yellow-500/20',
      };
    case 'resumo':
      return {
        border: 'border-l-4 border-l-cyan-500 border-t border-r border-b border-cyan-500/30',
        bg: 'bg-cyan-500/5',
        iconColor: 'text-cyan-500',
        titleColor: 'text-cyan-500',
        accentColor: 'bg-cyan-500/20',
      };
    default:
      return {
        border: 'border border-border/50',
        bg: 'bg-muted/20',
        iconColor: 'text-primary',
        titleColor: 'text-foreground',
        accentColor: 'bg-primary/20',
      };
  }
}

/**
 * Título formatado para cada tipo de seção
 */
function getSectionTitle(section: ParsedSection): string {
  switch (section.type) {
    case 'alternativa_correta':
      return `✅ ALTERNATIVA ${section.alternativaLetter} — CORRETA`;
    case 'alternativa_errada':
      return `❌ ALTERNATIVA ${section.alternativaLetter} — ERRADA`;
    case 'alternativa_analise':
      return `🔵 ALTERNATIVA ${section.alternativaLetter}`;
    case 'afirmacao_correta':
      return `✅ AFIRMAÇÃO ${section.afirmacaoNumber} — CORRETA`;
    case 'afirmacao_incorreta':
      return `❌ AFIRMAÇÃO ${section.afirmacaoNumber} — ERRADA`;
    case 'passo':
      return `📊 PASSO ${section.stepNumber}`;
    case 'conclusao':
      return '✅ CONCLUSÃO E GABARITO';
    case 'competencia':
      return '🎯 COMPETÊNCIA E HABILIDADE - ENEM';
    case 'estrategia':
      return '📌 DIRECIONAMENTO / ESTRATÉGIA';
    case 'pegadinhas':
      return '⚠️ PEGADINHAS COMUNS';
    case 'dica':
      return '💡 DICA DE OURO';
    case 'resumo':
      return '📋 RESUMO FINAL';
    default:
      return '';
  }
}

/**
 * Extrai URLs de imagens do texto usando o padrão [IMAGEM: URL]
 */
function extractImagesFromResolution(text: string): { cleanedText: string; images: string[] } {
  const imagePattern = /\[IMAGEM:\s*(https?:\/\/[^\]\s]+)\s*\]/gi;
  const images: string[] = [];
  let match;
  
  while ((match = imagePattern.exec(text)) !== null) {
    if (match[1]) {
      images.push(match[1]);
    }
  }
  
  // Remove as tags de imagem do texto
  const cleanedText = text.replace(imagePattern, '').trim();
  
  return { cleanedText, images };
}

/**
 * Formata conteúdo com fórmulas químicas (sem imagens)
 */
const formatTextContent = (content: string): string => {
  return formatChemicalFormulas(
    content
      .replace(/👉\s*/g, '\n• ')
      .replace(/Reunindo:/gi, '\n📋 Reunindo:')
      .trim()
  );
};

/**
 * Componente para renderizar imagens embutidas na resolução
 */
const ResolutionImage = memo(function ResolutionImage({ src, index }: { src: string; index: number }) {
  return (
    <div className="my-4 flex justify-center">
      <img 
        src={src} 
        alt={`Imagem da resolução ${index + 1}`}
        className="max-h-[600px] w-auto rounded-lg border border-border/50 shadow-md object-contain"
        loading="lazy"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
        }}
      />
    </div>
  );
});

/**
 * Formata conteúdo com fórmulas químicas E renderiza imagens
 */
const formatContent = (content: string) => {
  const { cleanedText, images } = extractImagesFromResolution(content);
  const formattedText = formatTextContent(cleanedText);
  
  // Se não há imagens, retorna só o texto formatado
  if (images.length === 0) {
    return formattedText;
  }
  
  // Retorna texto + imagens
  return (
    <>
      {formattedText}
      {images.map((imgUrl, idx) => (
        <ResolutionImage key={`res-img-${idx}`} src={imgUrl} index={idx} />
      ))}
    </>
  );
};

/**
 * Item de alternativa — TUDO NA MESMA LINHA
 */
const AlternativaItem = memo(function AlternativaItem({ section }: { section: ParsedSection }) {
  const isCorrect = section.type === 'alternativa_correta' || section.type === 'afirmacao_correta';
  
  const letter = section.alternativaLetter || section.afirmacaoNumber || '';
  const icon = isCorrect ? '✅' : '❌';
  
  return (
    <div className="px-4 py-2.5">
      <p className={cn(
        "text-sm leading-relaxed",
        isCorrect ? "text-green-500" : "text-red-500"
      )}>
        <span className="font-semibold">{icon} Alternativa {letter}</span>
        {isCorrect && <span className="font-semibold"> — CORRETA</span>}
        <span className="text-foreground/80"> → {formatContent(section.content)}</span>
      </p>
    </div>
  );
});

/**
 * Bloco visual para seções NÃO-alternativas
 */
const SectionBlock = memo(function SectionBlock({ section }: { section: ParsedSection }) {
  const Icon = getSectionIcon(section.type, section.stepNumber);
  const styles = getSectionStyles(section.type, section.isCorrect);
  const title = getSectionTitle(section);

  // INTRO — Bloco especial
  if (section.type === 'intro') {
    return (
      <div className="p-4 rounded-xl border border-border/50 bg-muted/20">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-500/20">
            <Sparkles className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm text-emerald-500 mb-2">
              📝 ANÁLISE DA QUESTÃO
            </h4>
            <p className="text-justify leading-relaxed text-sm text-foreground/90">
              {formatContent(section.content)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl overflow-hidden", styles.border, styles.bg)}>
      {/* Header do bloco */}
      <div className={cn("px-4 py-2.5 flex items-center gap-2", styles.accentColor)}>
        <Icon className={cn("h-4 w-4", styles.iconColor)} />
        <h4 className={cn("font-bold text-sm", styles.titleColor)}>
          {title}
        </h4>
      </div>
      
      {/* Conteúdo do bloco */}
      <div className="px-4 py-3">
        <div className="text-justify leading-relaxed text-sm text-foreground/90 whitespace-pre-wrap">
          {formatContent(section.content)}
        </div>
      </div>
    </div>
  );
});

/**
 * Formata o header da banca
 */
const formatBancaHeader = (banca?: string | null, ano?: number | null): string => {
  if (banca) {
    const bancaLabel = getBancaLabel(banca);
    return ano ? `${bancaLabel} (${ano})` : bancaLabel;
  }
  return DEFAULT_BANCA_HEADER;
};

/**
 * Componente universal para exibir resolução de questão
 * Com parsing inteligente e organização visual em blocos SEPARADOS
 */
const QuestionResolution = memo(function QuestionResolution({
  resolutionText,
  banca,
  ano,
  difficulty,
  tema,
  macro,
  micro,
  competenciaEnem,
  habilidadeEnem,
  className,
}: QuestionResolutionProps) {
  const bancaHeader = formatBancaHeader(banca, ano);
  const difficultyData = difficulty ? DIFFICULTY_LABELS[difficulty] : null;

  // Parser inteligente AVANÇADO
  const parsedSections = useMemo(() => parseResolutionText(resolutionText), [resolutionText]);

  // Verificações
  const hasClassification = macro || micro;
  const hasEnemInText = parsedSections.some(s => s.type === 'competencia');
  const showEnemBlock = (competenciaEnem || habilidadeEnem) && !hasEnemInText;

  // Agrupar seções por categoria para melhor visualização
  const alternativasSections = parsedSections.filter(s => 
    s.type === 'alternativa_correta' || 
    s.type === 'alternativa_errada' || 
    s.type === 'alternativa_analise' ||
    s.type === 'afirmacao_correta' ||
    s.type === 'afirmacao_incorreta'
  );
  const conclusaoSections = parsedSections.filter(s => s.type === 'conclusao');
  const resumoSections = parsedSections.filter(s => s.type === 'resumo');
  
  // Seções especiais pedagógicas (SEMPRE exibir no final, na ordem correta)
  const competenciaSections = parsedSections.filter(s => s.type === 'competencia');
  const estrategiaSections = parsedSections.filter(s => s.type === 'estrategia');
  const pegadinhasSections = parsedSections.filter(s => s.type === 'pegadinhas');
  const dicaSections = parsedSections.filter(s => s.type === 'dica');
  
  // Outras seções (passos, etc.)
  const otherSections = parsedSections.filter(s => 
    !alternativasSections.includes(s) && 
    s.type !== 'intro' &&
    s.type !== 'conclusao' &&
    s.type !== 'resumo' &&
    s.type !== 'competencia' &&
    s.type !== 'estrategia' &&
    s.type !== 'pegadinhas' &&
    s.type !== 'dica'
  );
  const introSection = parsedSections.find(s => s.type === 'intro');

  return (
    <div className={cn("space-y-6", className)}>
      {/* ========== HEADER ========== */}
      <div className="text-center pb-3 border-b-2 border-primary/20">
        <h3 className="text-2xl font-bold uppercase tracking-wide text-primary">
          {bancaHeader}
        </h3>
      </div>

      {/* ========== METADADOS ========== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card Nível + Tema */}
        {(difficultyData || tema) && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
            <div className="flex flex-col gap-2 text-sm">
              {difficultyData && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold">✨ NÍVEL:</span>
                  <span className={cn("font-bold px-2 py-0.5 rounded", difficultyData.color)}>
                    {difficultyData.label}
                  </span>
                </div>
              )}
              {tema && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold">📧 TEMA:</span>
                  <span className="text-muted-foreground">{tema}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Card Classificação */}
        {hasClassification && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-blue-500/5 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-2">
              <FolderTree className="h-4 w-4 text-blue-500" />
              <span className="font-semibold text-sm text-blue-500">CLASSIFICAÇÃO</span>
            </div>
            <div className="flex flex-col gap-1 text-sm">
              {macro && (
                <div>
                  <span className="font-medium text-blue-400">Macro:</span>{' '}
                  <span className="text-muted-foreground">{macro}</span>
                </div>
              )}
              {micro && (
                <div>
                  <span className="font-medium text-blue-400">Micro:</span>{' '}
                  <span className="text-muted-foreground">{micro}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ========== TÍTULO PRINCIPAL ========== */}
      <div className="text-center py-4">
        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-emerald-500/10 border border-emerald-500/30">
          <Sparkles className="h-6 w-6 text-emerald-500" />
          <h4 className="text-xl font-bold text-emerald-500">
            🔬 RESOLUÇÃO COMENTADA PELO PROF. MOISÉS MEDEIROS
          </h4>
        </div>
      </div>

      {/* ========== INTRO (ANÁLISE) ========== */}
      {introSection && (
        <SectionBlock section={introSection} />
      )}

      {/* ========== ALTERNATIVAS / AFIRMAÇÕES — BLOCO ÚNICO ========== */}
      {alternativasSections.length > 0 && (
        <div className="rounded-xl border border-border/50 overflow-hidden bg-muted/10">
          {/* Header do bloco de alternativas */}
          <div className="px-4 py-3 bg-muted/30 border-b border-border/30 flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <h4 className="font-bold text-sm text-primary uppercase tracking-wide">
              📋 Análise das Alternativas
            </h4>
          </div>
          
          {/* Alternativas como tópicos dentro do bloco */}
          <div className="divide-y divide-border/30">
            {alternativasSections.map((section, index) => (
              <AlternativaItem key={`alt-${section.type}-${index}`} section={section} />
            ))}
          </div>
        </div>
      )}

      {/* ========== OUTRAS SEÇÕES ========== */}
      {otherSections.length > 0 && (
        <div className="space-y-3">
          {otherSections.map((section, index) => (
            <SectionBlock key={`sec-${section.type}-${index}`} section={section} />
          ))}
        </div>
      )}

      {/* ========== RESUMO FINAL — BLOCO ÚNICO ========== */}
      {resumoSections.length > 0 && (
        <div className="rounded-xl border border-cyan-500/30 overflow-hidden bg-cyan-500/5 border-l-4 border-l-cyan-500">
          {/* Header */}
          <div className="px-4 py-3 bg-cyan-500/20 border-b border-cyan-500/20 flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-cyan-500" />
            <h4 className="font-bold text-sm text-cyan-500 uppercase tracking-wide">
              📋 RESUMO FINAL
            </h4>
          </div>
          {/* Conteúdos agrupados */}
          <div className="divide-y divide-cyan-500/20">
            {resumoSections.map((section, index) => (
              <div key={`resumo-${index}`} className="px-4 py-3">
                <p className="text-justify leading-relaxed text-sm text-foreground/90">
                  {formatContent(section.content)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========== CONCLUSÃO E GABARITO — BLOCO ÚNICO ========== */}
      {conclusaoSections.length > 0 && (
        <div className="rounded-xl border border-emerald-500/30 overflow-hidden bg-emerald-500/10 border-l-4 border-l-emerald-500">
          {/* Header */}
          <div className="px-4 py-3 bg-emerald-500/20 border-b border-emerald-500/20 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <h4 className="font-bold text-sm text-emerald-500 uppercase tracking-wide">
              ✅ CONCLUSÃO E GABARITO
            </h4>
          </div>
          {/* Conteúdos agrupados */}
          <div className="divide-y divide-emerald-500/20">
            {conclusaoSections.map((section, index) => (
              <div key={`conclusao-${index}`} className="px-4 py-3">
                <p className="text-justify leading-relaxed text-sm text-foreground/90">
                  {formatContent(section.content)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========== COMPETÊNCIA E HABILIDADE - ENEM ========== */}
      {competenciaSections.length > 0 && (
        <div className="space-y-3">
          {competenciaSections.map((section, index) => (
            <SectionBlock key={`competencia-${index}`} section={section} />
          ))}
        </div>
      )}

      {/* ========== COMPETÊNCIA ENEM (se não no texto, usar props) ========== */}
      {showEnemBlock && competenciaSections.length === 0 && (
        <div className="rounded-xl overflow-hidden border-l-4 border-l-purple-500 border-t border-r border-b border-purple-500/30 bg-purple-500/5">
          <div className="px-4 py-3 flex items-center gap-3 bg-purple-500/20">
            <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-lg bg-background/60 text-purple-500">
              <Target className="h-4 w-4" />
            </div>
            <h4 className="font-bold text-sm text-purple-500">
              🎯 COMPETÊNCIA E HABILIDADE - ENEM
            </h4>
          </div>
          <div className="px-5 py-4 space-y-2 text-sm">
            {competenciaEnem && (
              <p>
                <span className="font-medium text-purple-400">◆ Competência:</span>{' '}
                <span className="text-muted-foreground">{competenciaEnem}</span>
              </p>
            )}
            {habilidadeEnem && (
              <p>
                <span className="font-medium text-purple-400">◆ Habilidade:</span>{' '}
                <span className="text-muted-foreground">{habilidadeEnem}</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* ========== DIRECIONAMENTO / ESTRATÉGIA ========== */}
      {estrategiaSections.length > 0 && (
        <div className="space-y-3">
          {estrategiaSections.map((section, index) => (
            <SectionBlock key={`estrategia-${index}`} section={section} />
          ))}
        </div>
      )}

      {/* ========== PEGADINHAS COMUNS ========== */}
      {pegadinhasSections.length > 0 && (
        <div className="space-y-3">
          {pegadinhasSections.map((section, index) => (
            <SectionBlock key={`pegadinhas-${index}`} section={section} />
          ))}
        </div>
      )}

      {/* ========== DICA DE OURO ========== */}
      {dicaSections.length > 0 && (
        <div className="space-y-3">
          {dicaSections.map((section, index) => (
            <SectionBlock key={`dica-${index}`} section={section} />
          ))}
        </div>
      )}
    </div>
  );
});

export default QuestionResolution;

// ============================================
// REGRAS OBRIGATÓRIAS v2.0:
// 1. Parser detecta ALTERNATIVAS (A-E) e AFIRMAÇÕES (I-V)
// 2. CADA alternativa em bloco visual SEPARADO
// 3. Bordas laterais coloridas para indicar correto/errado
// 4. Agrupamento inteligente por categoria
// 5. NÃO modifica conteúdo, apenas organiza visualmente
// ============================================
