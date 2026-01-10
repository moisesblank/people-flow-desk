// ============================================
// 📄 WORD QUESTION PARSER
// Extrai questões de arquivos .docx usando mammoth.js
// CUSTO: ZERO (processamento 100% local no browser)
// ============================================

import mammoth from 'mammoth';

// ============================================
// TIPOS
// ============================================

interface ParsedQuestionFromWord {
  question_text: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  option_e?: string;
  correct_answer?: string;
  explanation?: string;
  // Imagens extraídas do documento
  images?: string[]; // Base64 data URLs
  // Raw HTML para debugging
  rawHtml?: string;
}

interface WordParseResult {
  data: Record<string, any>[];
  headers: string[];
  extractedImages: Map<string, string>; // ID → Base64 URL
  warnings: string[];
}

// ============================================
// CONSTANTES DE DETECÇÃO
// ============================================

// Padrões para detectar separadores de questões
const QUESTION_SEPARATORS = [
  /^-{3,}$/m,                           // --- (3+ hífens)
  /^={3,}$/m,                           // === (3+ igual)
  /^_{3,}$/m,                           // ___ (3+ underscore)
  /^questão\s*\d+/im,                   // Questão 1, Questão 2...
  /^question\s*\d+/im,                  // Question 1, Question 2...
  /^\d+\s*[.)]\s*\(/im,                 // 1) ( ou 1. (
  /^q\s*\d+/im,                         // Q1, Q 1...
];

// Padrões para detectar alternativas
const ALTERNATIVE_PATTERNS = [
  /^\s*\(?([A-Ea-e])\)?[.)\-:]\s*/,     // (A) ou A) ou A. ou A- ou A:
  /^\s*\[([A-Ea-e])\]\s*/,              // [A]
];

// Padrões para detectar gabarito
const ANSWER_PATTERNS = [
  /gabarito\s*:?\s*\(?([A-Ea-e])\)?/i,        // Gabarito: A ou Gabarito (A)
  /resposta\s*:?\s*\(?([A-Ea-e])\)?/i,        // Resposta: A
  /correta?\s*:?\s*\(?([A-Ea-e])\)?/i,        // Correta: A
  /answer\s*:?\s*\(?([A-Ea-e])\)?/i,          // Answer: A
];

// Padrões para detectar resolução/explicação
const EXPLANATION_PATTERNS = [
  /^(resolução|explicação|justificativa|comentário|solução)\s*:?\s*/im,
];

// ============================================
// FUNÇÕES DE PARSING
// ============================================

/**
 * Extrai o texto limpo removendo tags HTML
 */
function stripHtml(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

/**
 * Detecta se um texto é um marcador de alternativa e retorna a letra
 */
function detectAlternative(text: string): { letter: string; text: string } | null {
  const trimmed = text.trim();
  
  for (const pattern of ALTERNATIVE_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      const letter = match[1].toLowerCase();
      const remainingText = trimmed.replace(pattern, '').trim();
      return { letter, text: remainingText };
    }
  }
  
  return null;
}

/**
 * Detecta gabarito no texto
 */
function detectAnswer(text: string): string | null {
  for (const pattern of ANSWER_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      return match[1].toLowerCase();
    }
  }
  return null;
}

/**
 * Verifica se um texto indica início de resolução
 */
function isExplanationStart(text: string): boolean {
  return EXPLANATION_PATTERNS.some(p => p.test(text));
}

/**
 * Divide o HTML em blocos de questões
 */
function splitIntoQuestions(html: string): string[] {
  // Primeiro, tenta encontrar separadores explícitos
  const lines = html.split(/(<p[^>]*>.*?<\/p>|<h[1-6][^>]*>.*?<\/h[1-6]>)/gi).filter(Boolean);
  
  const questions: string[] = [];
  let currentQuestion = '';
  
  for (const line of lines) {
    const textContent = stripHtml(line).trim();
    
    // Verifica se é um separador
    const isSeparator = QUESTION_SEPARATORS.some(pattern => pattern.test(textContent));
    
    if (isSeparator && currentQuestion.trim()) {
      questions.push(currentQuestion.trim());
      currentQuestion = '';
    } else {
      currentQuestion += line;
    }
  }
  
  // Adiciona a última questão
  if (currentQuestion.trim()) {
    questions.push(currentQuestion.trim());
  }
  
  // Se não encontrou separadores, tenta dividir por padrão "Questão X"
  if (questions.length <= 1) {
    const byQuestionNumber = html.split(/(?=<p[^>]*>\s*(?:questão|question|q)\s*\d+)/gi);
    if (byQuestionNumber.length > 1) {
      return byQuestionNumber.filter(q => q.trim());
    }
  }
  
  return questions.length > 0 ? questions : [html];
}

/**
 * Processa um bloco de HTML de uma questão individual
 */
function parseQuestionBlock(html: string, images: Map<string, string>): ParsedQuestionFromWord {
  const result: ParsedQuestionFromWord = {
    question_text: '',
    images: [],
  };
  
  // Extrai parágrafos
  const paragraphRegex = /<p[^>]*>(.*?)<\/p>/gis;
  const paragraphs: string[] = [];
  let match;
  
  while ((match = paragraphRegex.exec(html)) !== null) {
    paragraphs.push(match[1]);
  }
  
  // Se não encontrou parágrafos, usa o HTML inteiro
  if (paragraphs.length === 0) {
    paragraphs.push(html);
  }
  
  let enunciadoLines: string[] = [];
  let explanationLines: string[] = [];
  let inExplanation = false;
  const alternatives: Record<string, string> = {};
  
  for (const para of paragraphs) {
    const text = stripHtml(para).trim();
    if (!text) continue;
    
    // Extrai imagens do parágrafo
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let imgMatch;
    while ((imgMatch = imgRegex.exec(para)) !== null) {
      const src = imgMatch[1];
      if (src.startsWith('data:')) {
        result.images?.push(src);
      } else if (images.has(src)) {
        result.images?.push(images.get(src)!);
      }
    }
    
    // Detecta gabarito
    const answer = detectAnswer(text);
    if (answer && !result.correct_answer) {
      result.correct_answer = answer;
      continue; // Não adiciona a linha do gabarito ao enunciado
    }
    
    // Detecta início de resolução
    if (isExplanationStart(text)) {
      inExplanation = true;
      const cleanText = text.replace(EXPLANATION_PATTERNS[0], '').trim();
      if (cleanText) {
        explanationLines.push(cleanText);
      }
      continue;
    }
    
    // Se está na seção de explicação
    if (inExplanation) {
      explanationLines.push(text);
      continue;
    }
    
    // Detecta alternativa
    const alt = detectAlternative(text);
    if (alt) {
      alternatives[alt.letter] = alt.text;
      
      // Detecta se está marcada como correta (negrito, sublinhado, cor)
      if (/<strong>|<b>|<u>|style=["'][^"']*color/i.test(para) && !result.correct_answer) {
        result.correct_answer = alt.letter;
      }
      continue;
    }
    
    // É parte do enunciado
    enunciadoLines.push(text);
  }
  
  // Monta o resultado
  result.question_text = enunciadoLines.join('\n').trim();
  
  if (Object.keys(alternatives).length > 0) {
    result.option_a = alternatives['a'];
    result.option_b = alternatives['b'];
    result.option_c = alternatives['c'];
    result.option_d = alternatives['d'];
    result.option_e = alternatives['e'];
  }
  
  if (explanationLines.length > 0) {
    result.explanation = explanationLines.join('\n').trim();
  }
  
  result.rawHtml = html;
  
  return result;
}

/**
 * Converte ArrayBuffer de imagem para Base64 Data URL
 */
function arrayBufferToBase64(buffer: ArrayBuffer, contentType: string): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `data:${contentType};base64,${btoa(binary)}`;
}

// ============================================
// FUNÇÃO PRINCIPAL DE PARSE
// ============================================

/**
 * Processa um arquivo Word (.docx) e extrai questões
 * @param file Arquivo Word para processar
 * @returns Dados no mesmo formato do parseExcelFile
 */
export async function parseWordFile(file: File): Promise<WordParseResult> {
  console.log('[WORD_PARSER] Iniciando processamento:', file.name);
  
  const warnings: string[] = [];
  const extractedImages = new Map<string, string>();
  
  try {
    const arrayBuffer = await file.arrayBuffer();
    
    // Configuração do mammoth para extrair imagens usando imgElement (API correta v1.11.0)
    const options = {
      convertImage: mammoth.images.imgElement(function(image: any) {
        return image.readAsBase64String().then(function(imageBuffer: string) {
          const contentType = image.contentType || 'image/png';
          const dataUrl = `data:${contentType};base64,${imageBuffer}`;
          const id = `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          extractedImages.set(id, dataUrl);
          return { src: dataUrl };
        }).catch(function(err: any) {
          console.warn('[WORD_PARSER] Erro ao extrair imagem:', err);
          warnings.push('Erro ao extrair uma imagem do documento');
          return { src: '' };
        });
      }),
    };
    
    // Converte para HTML
    const result = await mammoth.convertToHtml({ arrayBuffer }, options);
    
    if (result.messages.length > 0) {
      result.messages.forEach((msg: any) => {
        if (msg.type === 'warning') {
          warnings.push(msg.message);
        }
      });
    }
    
    console.log('[WORD_PARSER] HTML extraído, tamanho:', result.value.length);
    console.log('[WORD_PARSER] Imagens extraídas:', extractedImages.size);
    
    // Divide em questões
    const questionBlocks = splitIntoQuestions(result.value);
    console.log('[WORD_PARSER] Blocos de questões encontrados:', questionBlocks.length);
    
    // Processa cada bloco
    const parsedQuestions = questionBlocks.map((block, index) => {
      const parsed = parseQuestionBlock(block, extractedImages);
      
      // Valida se tem conteúdo mínimo
      if (!parsed.question_text || parsed.question_text.length < 10) {
        console.log(`[WORD_PARSER] Bloco ${index + 1} ignorado: enunciado muito curto`);
        return null;
      }
      
      return parsed;
    }).filter((q): q is ParsedQuestionFromWord => q !== null);
    
    console.log('[WORD_PARSER] Questões válidas extraídas:', parsedQuestions.length);
    
    if (parsedQuestions.length === 0) {
      warnings.push('Nenhuma questão foi detectada no documento. Verifique o formato.');
    }
    
    // Converte para o formato esperado pelo sistema (compatível com Excel)
    const headers = [
      'question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'option_e',
      'correct_answer', 'explanation', 'images'
    ];
    
    const data: Record<string, any>[] = parsedQuestions.map((q, idx) => ({
      question_text: q.question_text,
      option_a: q.option_a || '',
      option_b: q.option_b || '',
      option_c: q.option_c || '',
      option_d: q.option_d || '',
      option_e: q.option_e || '',
      correct_answer: q.correct_answer || '',
      explanation: q.explanation || '',
      // Imagens como URLs base64 separadas por ponto-e-vírgula
      images: q.images?.join(';') || '',
      // Metadata para debugging
      _source: 'word',
      _block_index: idx,
    }));
    
    return {
      data,
      headers,
      extractedImages,
      warnings,
    };
    
  } catch (error) {
    console.error('[WORD_PARSER] Erro fatal:', error);
    throw new Error(`Falha ao processar arquivo Word: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Verifica se um arquivo é Word (.docx)
 */
export function isWordFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith('.docx') || name.endsWith('.doc');
}

/**
 * Retorna os formatos suportados para exibição na UI
 */
export function getSupportedFormats(): { extension: string; label: string; icon: string }[] {
  return [
    { extension: '.xlsx', label: 'Excel', icon: 'FileSpreadsheet' },
    { extension: '.xls', label: 'Excel 97-2003', icon: 'FileSpreadsheet' },
    { extension: '.csv', label: 'CSV', icon: 'FileText' },
    { extension: '.txt', label: 'Texto', icon: 'FileText' },
    { extension: '.docx', label: 'Word', icon: 'FileText' },
  ];
}
