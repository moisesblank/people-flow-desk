// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║ 📝 QUESTION TEXT FIELD — COMPONENTE UNIVERSAL E PERMANENTE                   ║
// ║ Plain Text Rendering + Chemical Notation (LEI v2.4)                           ║
// ╠══════════════════════════════════════════════════════════════════════════════╣
// ║                                                                               ║
// ║ 🔒 LEI PERMANENTE — CONSTITUIÇÃO DO QUESTION DOMAIN                          ║
// ║                                                                               ║
// ║ Este componente é a ÚNICA fonte de verdade para renderização de texto        ║
// ║ em TODOS os campos de questão (enunciado, alternativas, resolução, obs).     ║
// ║                                                                               ║
// ║ ═══════════════════════════════════════════════════════════════════════════  ║
// ║ 🚨 REGRA IMUTÁVEL: PLAIN TEXT RENDERING + CHEMICAL FORMATTING                ║
// ║ ═══════════════════════════════════════════════════════════════════════════  ║
// ║                                                                               ║
// ║ ✅ O QUE ESTE COMPONENTE FAZ:                                                ║
// ║    1. Renderiza texto como PLAIN TEXT (whitespace-pre-wrap)                  ║
// ║    2. Formata notação química (H2O → H₂O, Na+ → Na⁺) — LEI v2.4              ║
// ║    3. Formata estados físicos (g), (s), (l), (aq) → subscrito                ║
// ║    4. Garante coerção segura de texto (nunca renderiza objetos)              ║
// ║    5. Preserva quebras de linha originais                                    ║
// ║                                                                               ║
// ║ ❌ O QUE ESTE COMPONENTE NÃO FAZ:                                            ║
// ║    1. NÃO usa markdown parsers (react-markdown, marked, remark)              ║
// ║    2. NÃO interpreta tabelas | ou separadores ---                            ║
// ║    3. NÃO altera significado do texto                                        ║
// ║                                                                               ║
// ║ JAMAIS MODIFICAR ESTAS REGRAS SEM AUTORIZAÇÃO DO OWNER.                       ║
// ║                                                                               ║
// ╚══════════════════════════════════════════════════════════════════════════════╝

import { memo } from 'react';
import { cn } from '@/lib/utils';
import { formatChemicalFormulas } from '@/lib/chemicalFormatter';
import { renderChemicalText } from '@/lib/renderChemicalText';

/**
 * Campos da Entidade Questão que usam este componente
 */
export type QuestionFieldType = 
  | 'enunciado'
  | 'alternativa'
  | 'resolucao'
  | 'observacoes'
  | 'explanation'
  | 'generic';

interface QuestionTextFieldProps {
  /** Conteúdo do texto (pode ser string, objeto com .text, ou qualquer tipo) */
  content: unknown;
  /** Tipo do campo para aplicar regras específicas */
  fieldType?: QuestionFieldType;
  /** Classes CSS adicionais */
  className?: string;
  /** Aplicar formatação química (default: true) */
  applyChemicalFormatting?: boolean;
  /** Texto de fallback se vazio */
  emptyText?: string;
  /** Mostrar texto de fallback como itálico */
  emptyAsItalic?: boolean;
  /** Modo compacto (line-clamp) */
  compact?: boolean;
  /** Número de linhas para line-clamp */
  lineClamp?: number;
  /** Justificar texto */
  justify?: boolean;
  /** Tamanho do texto */
  textSize?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
  /** Renderizar como span ao invés de div */
  inline?: boolean;
}

/**
 * Extrai texto seguro de qualquer input (string, objeto, null, etc.)
 * Garante que NUNCA retorna objeto React
 */
export function extractSafeText(input: unknown): string {
  // Caso 1: Já é string
  if (typeof input === 'string') {
    return input;
  }
  
  // Caso 2: É null/undefined
  if (input == null) {
    return '';
  }
  
  // Caso 3: É objeto com propriedade .text (aninhamento)
  if (typeof input === 'object' && 'text' in input) {
    const nestedText = (input as { text: unknown }).text;
    // Recursão para tratar aninhamento duplo
    return extractSafeText(nestedText);
  }
  
  // Caso 4: Qualquer outro tipo - coerção segura
  return String(input);
}

/**
 * COMPONENTE UNIVERSAL para renderização de texto de questões
 * 
 * @example
 * // Renderizar alternativa
 * <QuestionTextField content={option.text} fieldType="alternativa" />
 * 
 * // Renderizar enunciado compacto
 * <QuestionTextField content={question.question_text} fieldType="enunciado" compact lineClamp={3} />
 * 
 * // Renderizar inline
 * <QuestionTextField content={text} inline />
 */
const QuestionTextField = memo(function QuestionTextField({
  content,
  fieldType = 'generic',
  className,
  applyChemicalFormatting = true,
  emptyText,
  emptyAsItalic = true,
  compact = false,
  lineClamp = 3,
  justify = false,
  textSize = 'base',
  inline = false,
}: QuestionTextFieldProps) {
  // 1. Extrair texto seguro (nunca objeto)
  const rawText = extractSafeText(content);
  
  // 2. Verificar se está vazio
  if (!rawText || rawText.trim() === '') {
    if (emptyText) {
      return inline ? (
        <span className={cn(emptyAsItalic && "italic text-muted-foreground", className)}>
          {emptyText}
        </span>
      ) : (
        <div className={cn(emptyAsItalic && "italic text-muted-foreground", className)}>
          {emptyText}
        </div>
      );
    }
    return null;
  }
  
  // 3. Aplicar formatação química se habilitado
  const formattedText = applyChemicalFormatting 
    ? formatChemicalFormulas(rawText)
    : rawText;
  
  // 4. Renderizar como React nodes (com estados físicos em subscrito)
  const renderedContent = applyChemicalFormatting
    ? renderChemicalText(formattedText)
    : formattedText;
  
  // 5. Definir classes de tamanho
  const textSizeClass = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  }[textSize];
  
  // 6. Definir classes base
  const baseClasses = cn(
    // Estilos base de plain text
    'whitespace-pre-wrap',
    'break-words',
    'font-inherit',
    // Tamanho
    textSizeClass,
    // Justificação
    justify && 'text-justify',
    // Line clamp
    compact && `line-clamp-${lineClamp}`,
    // Classes customizadas
    className
  );
  
  // 7. Renderizar como inline (span) ou block (div)
  if (inline) {
    return <span className={baseClasses}>{renderedContent}</span>;
  }
  
  return <div className={baseClasses}>{renderedContent}</div>;
});

export default QuestionTextField;

// ╔══════════════════════════════════════════════════════════════════════════════╗
// ║ REGRAS DE USO OBRIGATÓRIAS:                                                  ║
// ║                                                                               ║
// ║ 1. TODA alternativa DEVE usar: <QuestionTextField content={opt.text} />      ║
// ║ 2. TODA resolução DEVE usar este componente                                  ║
// ║ 3. NUNCA usar react-markdown, marked, ou parsers markdown                    ║
// ║ 4. Formatação química é AUTOMÁTICA e PERMANENTE                              ║
// ║ 5. Tabelas markdown (|) aparecem como TEXTO LITERAL                          ║
// ╚══════════════════════════════════════════════════════════════════════════════╝
