// ============================================
// 📥 IMPORTADOR DE QUESTÕES - Sistema Completo
// Parser inteligente com classificação automática
// Visual Futurístico Ano 2300
// ============================================

import { memo, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff,
  Filter,
  Download,
  Sparkles,
  Brain,
  Target,
  Zap,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Check,
  XCircle,
  Info,
  HelpCircle,
  FileQuestion,
  Trash2,
  Edit3,
  Save,
  ArrowRight,
  Wand2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { BANCAS, BANCAS_POR_CATEGORIA, CATEGORIA_LABELS, findBancaByValue } from '@/constants/bancas';
import { useTaxonomyForSelects } from '@/hooks/useQuestionTaxonomy';

// ============================================
// TIPOS
// ============================================

type NivelCognitivo = 'memorizar' | 'compreender' | 'aplicar' | 'analisar' | 'avaliar';
type OrigemQuestao = 'oficial' | 'adaptada' | 'autoral_prof_moises';
type StatusRevisao = 'rascunho' | 'revisado' | 'publicado';

interface ParsedQuestion {
  id: string;
  question_text: string;
  options: { id: string; text: string }[];
  correct_answer: string;
  explanation?: string;
  difficulty: 'facil' | 'medio' | 'dificil';
  banca?: string;
  ano?: number;
  macro?: string;
  micro?: string;
  tema?: string;
  subtema?: string;
  tags?: string[];
  // Novos campos pedagógicos
  tempo_medio_segundos: number;
  nivel_cognitivo: NivelCognitivo;
  origem: OrigemQuestao;
  // Metadados de importação
  campos_inferidos: string[];
  // Status de importação
  status: 'pending' | 'valid' | 'warning' | 'error';
  errors: string[];
  warnings: string[];
  selected: boolean;
  // Original data
  rawData?: Record<string, any>;
}

interface ImportStats {
  total: number;
  valid: number;
  warnings: number;
  errors: number;
  selected: number;
}

interface QuestionImportDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// ============================================
// MAPEAMENTOS INTELIGENTES
// ============================================

// Mapeamento de colunas do Excel para campos
const COLUMN_MAPPINGS: Record<string, string[]> = {
  question_text: ['pergunta', 'enunciado', 'questao', 'questão', 'question', 'texto', 'statement'],
  option_a: ['a', 'alternativa_a', 'opcao_a', 'opção_a', 'option_a', 'alt_a'],
  option_b: ['b', 'alternativa_b', 'opcao_b', 'opção_b', 'option_b', 'alt_b'],
  option_c: ['c', 'alternativa_c', 'opcao_c', 'opção_c', 'option_c', 'alt_c'],
  option_d: ['d', 'alternativa_d', 'opcao_d', 'opção_d', 'option_d', 'alt_d'],
  option_e: ['e', 'alternativa_e', 'opcao_e', 'opção_e', 'option_e', 'alt_e'],
  correct_answer: ['resposta', 'gabarito', 'correta', 'correct', 'answer', 'resp'],
  explanation: ['explicacao', 'explicação', 'resolucao', 'resolução', 'explanation', 'justificativa'],
  difficulty: ['dificuldade', 'nivel', 'nível', 'difficulty', 'level'],
  banca: ['banca', 'organizadora', 'board', 'institution'],
  ano: ['ano', 'year', 'data', 'date'],
  macro: ['macro', 'area', 'área', 'grande_area', 'macroArea'],
  micro: ['micro', 'disciplina', 'subject', 'microArea'],
  tema: ['tema', 'topic', 'assunto', 'conteudo', 'conteúdo'],
  subtema: ['subtema', 'subtopic', 'subassunto'],
  tags: ['tags', 'etiquetas', 'labels', 'keywords', 'palavras_chave'],
};

// Mapeamento de dificuldade
const DIFFICULTY_MAPPING: Record<string, 'facil' | 'medio' | 'dificil'> = {
  'facil': 'facil',
  'fácil': 'facil',
  'easy': 'facil',
  'baixa': 'facil',
  'low': 'facil',
  '1': 'facil',
  'f': 'facil',
  'medio': 'medio',
  'médio': 'medio',
  'medium': 'medio',
  'média': 'medio',
  'normal': 'medio',
  '2': 'medio',
  'm': 'medio',
  'dificil': 'dificil',
  'difícil': 'dificil',
  'hard': 'dificil',
  'alta': 'dificil',
  'high': 'dificil',
  '3': 'dificil',
  'd': 'dificil',
};

// Mapeamento de gabarito
const ANSWER_MAPPING: Record<string, string> = {
  'a': 'a', '1': 'a', 'i': 'a',
  'b': 'b', '2': 'b', 'ii': 'b',
  'c': 'c', '3': 'c', 'iii': 'c',
  'd': 'd', '4': 'd', 'iv': 'd',
  'e': 'e', '5': 'e', 'v': 'e',
};

// Mapeamento de Nível Cognitivo (Taxonomia de Bloom)
const NIVEL_COGNITIVO_MAPPING: Record<string, NivelCognitivo> = {
  'memorizar': 'memorizar', 'lembrar': 'memorizar', 'definir': 'memorizar', 'citar': 'memorizar', 'listar': 'memorizar',
  'compreender': 'compreender', 'explicar': 'compreender', 'descrever': 'compreender', 'interpretar': 'compreender',
  'aplicar': 'aplicar', 'calcular': 'aplicar', 'resolver': 'aplicar', 'determinar': 'aplicar', 'usar': 'aplicar',
  'analisar': 'analisar', 'comparar': 'analisar', 'relacionar': 'analisar', 'diferenciar': 'analisar',
  'avaliar': 'avaliar', 'julgar': 'avaliar', 'criticar': 'avaliar', 'justificar': 'avaliar',
};

// Verbos para inferência de nível cognitivo
const VERBOS_COGNITIVOS: Record<NivelCognitivo, string[]> = {
  'memorizar': ['defina', 'cite', 'liste', 'nomeie', 'identifique', 'reproduza', 'descreva', 'enumere'],
  'compreender': ['explique', 'resuma', 'interprete', 'classifique', 'exemplifique', 'traduza'],
  'aplicar': ['calcule', 'determine', 'resolva', 'aplique', 'demonstre', 'use', 'execute', 'construa'],
  'analisar': ['compare', 'relacione', 'diferencie', 'analise', 'distinga', 'examine', 'investigue'],
  'avaliar': ['julgue', 'avalie', 'critique', 'justifique', 'argumente', 'defenda', 'recomende'],
};

// ============================================
// FUNÇÕES DE PARSE
// ============================================

function normalizeColumnName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

function findColumnMapping(columnName: string): string | null {
  const normalized = normalizeColumnName(columnName);
  
  for (const [field, aliases] of Object.entries(COLUMN_MAPPINGS)) {
    if (aliases.some(alias => normalizeColumnName(alias) === normalized || normalized.includes(normalizeColumnName(alias)))) {
      return field;
    }
  }
  
  return null;
}

function detectBanca(text: string): string | null {
  const lower = text.toLowerCase();
  
  // Procurar por bancas conhecidas
  for (const banca of BANCAS) {
    if (lower.includes(banca.value.toLowerCase()) || lower.includes(banca.label.toLowerCase())) {
      return banca.value;
    }
  }
  
  return null;
}

function detectYear(text: string): number | null {
  const yearMatch = text.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    const year = parseInt(yearMatch[0]);
    if (year >= 1990 && year <= new Date().getFullYear() + 1) {
      return year;
    }
  }
  return null;
}

function parseDifficulty(value: any): 'facil' | 'medio' | 'dificil' {
  if (!value) return 'medio';
  const normalized = String(value).toLowerCase().trim();
  return DIFFICULTY_MAPPING[normalized] || 'medio';
}

function parseCorrectAnswer(value: any): string {
  if (!value) return 'a';
  const normalized = String(value).toLowerCase().trim();
  return ANSWER_MAPPING[normalized] || 'a';
}

// Inferir nível cognitivo baseado em verbos do enunciado
function inferNivelCognitivo(text: string): { nivel: NivelCognitivo; inferido: boolean } {
  const lower = text.toLowerCase();
  
  // Verificar verbos de cada nível (do mais específico ao mais geral)
  for (const nivel of ['avaliar', 'analisar', 'aplicar', 'compreender', 'memorizar'] as NivelCognitivo[]) {
    for (const verbo of VERBOS_COGNITIVOS[nivel]) {
      if (lower.includes(verbo)) {
        return { nivel, inferido: true };
      }
    }
  }
  
  return { nivel: 'aplicar', inferido: true }; // Default
}

// Inferir tempo médio baseado na dificuldade
function inferTempoMedio(difficulty: 'facil' | 'medio' | 'dificil'): number {
  switch (difficulty) {
    case 'facil': return 60;
    case 'medio': return 120;
    case 'dificil': return 180;
    default: return 120;
  }
}

// Inferir origem baseado na banca
function inferOrigem(banca?: string): OrigemQuestao {
  if (!banca) return 'autoral_prof_moises';
  
  // Se tem banca conhecida, é oficial
  const bancaEncontrada = BANCAS.find(b => 
    b.value.toLowerCase() === banca.toLowerCase() || 
    b.label.toLowerCase() === banca.toLowerCase()
  );
  
  return bancaEncontrada ? 'oficial' : 'adaptada';
}

function extractTextFromHtml(html: string): string {
  if (!html) return '';
  // Remover tags HTML
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  // Decodificar entidades HTML
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

function parseAlternativesFromHtml(html: string): { options: { id: string; text: string }[]; correctAnswer: string } {
  const options: { id: string; text: string }[] = [];
  let correctAnswer = 'a';
  
  // Padrões comuns de alternativas em HTML
  const patterns = [
    // Formato: (A) texto ou A) texto ou A. texto
    /\(?([A-Ea-e])\)?\s*[\.\)\-]?\s*([^(A-E][^\n]+?)(?=\(?[A-Ea-e]\)|$)/gi,
    // Formato com lista
    /<li[^>]*>\s*\(?([A-Ea-e])\)?\s*[\.\)\-]?\s*(.*?)<\/li>/gi,
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const letter = match[1].toLowerCase();
      const text = extractTextFromHtml(match[2]);
      if (text.trim()) {
        options.push({ id: letter, text: text.trim() });
      }
    }
    if (options.length >= 2) break;
  }
  
  // Detectar resposta correta (pode estar marcada com ✓, [X], (correto), etc)
  const correctPatterns = [
    /\(?([A-Ea-e])\)?\s*[\.\)\-]?\s*✓/i,
    /\(?([A-Ea-e])\)?\s*[\.\)\-]?\s*\[x\]/i,
    /resposta[:\s]+\(?([A-Ea-e])\)?/i,
    /gabarito[:\s]+\(?([A-Ea-e])\)?/i,
    /correta[:\s]+\(?([A-Ea-e])\)?/i,
  ];
  
  for (const pattern of correctPatterns) {
    const match = html.match(pattern);
    if (match) {
      correctAnswer = match[1].toLowerCase();
      break;
    }
  }
  
  return { options, correctAnswer };
}

function generateQuestionId(): string {
  return `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export const QuestionImportDialog = memo(function QuestionImportDialog({
  open,
  onClose,
  onSuccess,
}: QuestionImportDialogProps) {
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'importing'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [rawData, setRawData] = useState<Record<string, any>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'valid' | 'warning' | 'error'>('all');
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  
  // Defaults globais para aplicar a todas as questões (opcional)
  const [globalDefaults, setGlobalDefaults] = useState({
    banca: '' as string,
    ano: '' as '' | number,
    difficulty: 'medio' as 'facil' | 'medio' | 'dificil',
    macro: '',
    micro: '',
    tema: '',
    subtema: '',
  });
  
  // Hook de taxonomia
  const { macros, getMicrosForSelect, getTemasForSelect, getSubtemasForSelect, isLoading: taxonomyLoading } = useTaxonomyForSelects();

  // ============================================
  // ESTATÍSTICAS
  // ============================================
  
  const stats: ImportStats = useMemo(() => {
    const valid = parsedQuestions.filter(q => q.status === 'valid').length;
    const warnings = parsedQuestions.filter(q => q.status === 'warning').length;
    const errors = parsedQuestions.filter(q => q.status === 'error').length;
    const selected = parsedQuestions.filter(q => q.selected).length;
    
    return {
      total: parsedQuestions.length,
      valid,
      warnings,
      errors,
      selected,
    };
  }, [parsedQuestions]);

  // Questões filtradas
  const filteredQuestions = useMemo(() => {
    if (filterStatus === 'all') return parsedQuestions;
    return parsedQuestions.filter(q => q.status === filterStatus);
  }, [parsedQuestions, filterStatus]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsProcessing(true);

    try {
      const isExcel = selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls');
      const isCsv = selectedFile.name.endsWith('.csv');
      const isTxt = selectedFile.name.endsWith('.txt');

      let data: Record<string, any>[] = [];
      let detectedHeaders: string[] = [];

      if (isExcel || isCsv) {
        const buffer = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[];
        
        // Primeira linha como headers
        if (data.length > 0) {
          detectedHeaders = (data[0] as any[]).map(h => String(h || '').trim());
          data = data.slice(1).map(row => {
            const obj: Record<string, any> = {};
            detectedHeaders.forEach((header, i) => {
              obj[header] = (row as any[])[i];
            });
            return obj;
          }).filter(row => Object.values(row).some(v => v));
        }
      } else if (isTxt) {
        const text = await selectedFile.text();
        // Tentar detectar se é delimitado por tab ou vírgula
        const lines = text.split('\n').filter(l => l.trim());
        if (lines.length > 0) {
          const delimiter = lines[0].includes('\t') ? '\t' : ',';
          detectedHeaders = lines[0].split(delimiter).map(h => h.trim());
          data = lines.slice(1).map(line => {
            const values = line.split(delimiter);
            const obj: Record<string, any> = {};
            detectedHeaders.forEach((header, i) => {
              obj[header] = values[i]?.trim() || '';
            });
            return obj;
          });
        }
      }

      setRawData(data);
      setHeaders(detectedHeaders);
      
      // Auto-detectar mapeamento de colunas
      const autoMapping: Record<string, string> = {};
      detectedHeaders.forEach(header => {
        const mapped = findColumnMapping(header);
        if (mapped) {
          autoMapping[header] = mapped;
        }
      });
      setColumnMapping(autoMapping);
      
      if (data.length > 0) {
        setStep('mapping');
        toast.success(`${data.length} linhas detectadas no arquivo`);
      } else {
        toast.error('Nenhum dado encontrado no arquivo');
      }
    } catch (err) {
      console.error('Erro ao processar arquivo:', err);
      toast.error('Erro ao processar arquivo');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      // Simular input change
      const input = document.getElementById('file-import-input') as HTMLInputElement;
      if (input) {
        const dt = new DataTransfer();
        dt.items.add(droppedFile);
        input.files = dt.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  }, []);

  const processQuestions = useCallback(() => {
    setIsProcessing(true);
    
    try {
      const questions: ParsedQuestion[] = rawData.map((row, index) => {
        const camposInferidos: string[] = [];
        
        const question: ParsedQuestion = {
          id: generateQuestionId(),
          question_text: '',
          options: [],
          correct_answer: 'a',
          difficulty: globalDefaults.difficulty,
          banca: undefined,
          ano: undefined,
          macro: globalDefaults.macro || undefined,
          micro: globalDefaults.micro || undefined,
          tema: globalDefaults.tema || undefined,
          subtema: globalDefaults.subtema || undefined,
          // Novos campos pedagógicos (serão inferidos após parse)
          tempo_medio_segundos: 120,
          nivel_cognitivo: 'aplicar',
          origem: 'oficial',
          campos_inferidos: [],
          // Status
          status: 'pending',
          errors: [],
          warnings: [],
          selected: true,
          rawData: row,
        };

        // Mapear campos com base no mapeamento de colunas
        for (const [header, field] of Object.entries(columnMapping)) {
          const value = row[header];
          if (!value) continue;

          switch (field) {
            case 'question_text':
              question.question_text = extractTextFromHtml(String(value));
              // Tentar extrair alternativas do HTML se estiverem embutidas
              if (String(value).includes('<')) {
                const { options, correctAnswer } = parseAlternativesFromHtml(String(value));
                if (options.length >= 2) {
                  question.options = options;
                  question.correct_answer = correctAnswer;
                }
              }
              break;
            case 'option_a':
            case 'option_b':
            case 'option_c':
            case 'option_d':
            case 'option_e':
              const optionId = field.replace('option_', '');
              const existing = question.options.find(o => o.id === optionId);
              if (existing) {
                existing.text = extractTextFromHtml(String(value));
              } else {
                question.options.push({ id: optionId, text: extractTextFromHtml(String(value)) });
              }
              break;
            case 'correct_answer':
              question.correct_answer = parseCorrectAnswer(value);
              break;
            case 'explanation':
              question.explanation = extractTextFromHtml(String(value));
              break;
            case 'difficulty':
              question.difficulty = parseDifficulty(value);
              break;
            case 'banca': {
              const raw = String(value).trim();
              const detectedBanca = detectBanca(raw);
              question.banca = detectedBanca || (raw ? raw.toLowerCase() : undefined);
              break;
            }
            case 'ano': {
              const raw = String(value).trim();
              const detectedYear = detectYear(raw);
              const parsed = Number.isFinite(Number(raw)) ? parseInt(raw, 10) : NaN;
              question.ano = detectedYear || (Number.isFinite(parsed) ? parsed : undefined);
              break;
            }
            case 'macro':
              question.macro = String(value).trim();
              break;
            case 'micro':
              question.micro = String(value).trim();
              break;
            case 'tema':
              question.tema = String(value).trim();
              break;
            case 'subtema':
              question.subtema = String(value).trim();
              break;
            case 'tags':
              question.tags = String(value).split(/[,;]/).map(t => t.trim()).filter(t => t);
              break;
          }
        }

        // Inferir banca/ano a partir do enunciado (se não veio em coluna)
        if (question.question_text) {
          if (!question.banca) {
            const inferredBanca = detectBanca(question.question_text);
            if (inferredBanca) {
              question.banca = inferredBanca;
              camposInferidos.push('banca');
            }
          }

          if (!question.ano) {
            const inferredYear = detectYear(question.question_text);
            if (inferredYear) {
              question.ano = inferredYear;
              camposInferidos.push('ano');
            }
          }
        }

        // Aplicar defaults SOMENTE se o usuário setou explicitamente
        if (!question.banca && globalDefaults.banca) question.banca = globalDefaults.banca;
        if (!question.ano && typeof globalDefaults.ano === 'number') question.ano = globalDefaults.ano;

        // Ordenar e preencher alternativas faltantes
        const existingIds = question.options.map(o => o.id);
        const allIds = ['a', 'b', 'c', 'd', 'e'];
        for (const id of allIds) {
          if (!existingIds.includes(id)) {
            question.options.push({ id, text: '' });
          }
        }
        question.options.sort((a, b) => a.id.localeCompare(b.id));

        // ============================================
        // INFERÊNCIA DE CAMPOS PEDAGÓGICOS
        // ============================================
        
        // Inferir nível cognitivo baseado no enunciado
        if (question.question_text) {
          const { nivel, inferido } = inferNivelCognitivo(question.question_text);
          question.nivel_cognitivo = nivel;
          if (inferido) camposInferidos.push('nivel_cognitivo');
        }
        
        // Inferir tempo médio baseado na dificuldade
        question.tempo_medio_segundos = inferTempoMedio(question.difficulty);
        camposInferidos.push('tempo_medio_segundos');
        
        // Inferir origem baseado na banca
        question.origem = inferOrigem(question.banca);
        camposInferidos.push('origem');
        
        // Registrar campos inferidos
        question.campos_inferidos = camposInferidos;

        // ============================================
        // VALIDAÇÃO
        // ============================================
        
        if (!question.question_text.trim()) {
          question.errors.push('Enunciado vazio');
        }
        
        const filledOptions = question.options.filter(o => o.text.trim());
        if (filledOptions.length < 2) {
          question.errors.push('Menos de 2 alternativas preenchidas');
        }

        const correctOption = question.options.find(o => o.id === question.correct_answer);
        if (!correctOption?.text.trim()) {
          question.errors.push('Alternativa correta não tem texto');
        }

        if (!question.banca) {
          question.warnings.push('Banca não identificada');
        }

        if (!question.ano) {
          question.warnings.push('Ano não identificado');
        }

        // Definir status
        if (question.errors.length > 0) {
          question.status = 'error';
          question.selected = false; // Não selecionar questões com erro
        } else if (question.warnings.length > 0) {
          question.status = 'warning';
        } else {
          question.status = 'valid';
        }

        return question;
      });

      setParsedQuestions(questions);
      setStep('preview');
      
      const validCount = questions.filter(q => q.status !== 'error').length;
      toast.success(`${validCount} questões prontas para importar`);
    } catch (err) {
      console.error('Erro ao processar questões:', err);
      toast.error('Erro ao processar questões');
    } finally {
      setIsProcessing(false);
    }
  }, [rawData, columnMapping, globalDefaults]);

  const toggleSelectAll = useCallback((selected: boolean) => {
    setParsedQuestions(prev => prev.map(q => ({
      ...q,
      selected: q.status !== 'error' ? selected : false,
    })));
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setParsedQuestions(prev => prev.map(q => 
      q.id === id && q.status !== 'error' 
        ? { ...q, selected: !q.selected } 
        : q
    ));
  }, []);

  const updateQuestion = useCallback((id: string, updates: Partial<ParsedQuestion>) => {
    setParsedQuestions(prev => prev.map(q => {
      if (q.id !== id) return q;
      
      const updated = { ...q, ...updates };
      
      // Revalidar
      updated.errors = [];
      updated.warnings = [];
      
      if (!updated.question_text.trim()) {
        updated.errors.push('Enunciado vazio');
      }
      
      const filledOptions = updated.options.filter(o => o.text.trim());
      if (filledOptions.length < 2) {
        updated.errors.push('Menos de 2 alternativas preenchidas');
      }

      const correctOption = updated.options.find(o => o.id === updated.correct_answer);
      if (!correctOption?.text.trim()) {
        updated.errors.push('Alternativa correta não tem texto');
      }

      if (!updated.banca) {
        updated.warnings.push('Banca não identificada');
      }

      if (!updated.ano) {
        updated.warnings.push('Ano não identificado');
      }

      if (updated.errors.length > 0) {
        updated.status = 'error';
        updated.selected = false;
      } else if (updated.warnings.length > 0) {
        updated.status = 'warning';
      } else {
        updated.status = 'valid';
      }
      
      return updated;
    }));
  }, []);

  const applyGlobalDefaults = useCallback(() => {
    setParsedQuestions(prev => prev.map(q => {
      const updated = { ...q };
      
      if (globalDefaults.banca && !q.banca) updated.banca = globalDefaults.banca;
      if (globalDefaults.ano && !q.ano) updated.ano = globalDefaults.ano;
      if (globalDefaults.macro && !q.macro) updated.macro = globalDefaults.macro;
      if (globalDefaults.micro && !q.micro) updated.micro = globalDefaults.micro;
      if (globalDefaults.tema && !q.tema) updated.tema = globalDefaults.tema;
      if (globalDefaults.subtema && !q.subtema) updated.subtema = globalDefaults.subtema;
      if (globalDefaults.difficulty) updated.difficulty = globalDefaults.difficulty;
      
      // Revalidar warnings
      updated.warnings = [];
      if (!updated.banca) updated.warnings.push('Banca não identificada');
      if (!updated.ano) updated.warnings.push('Ano não identificado');
      
      if (updated.errors.length > 0) {
        updated.status = 'error';
      } else if (updated.warnings.length > 0) {
        updated.status = 'warning';
      } else {
        updated.status = 'valid';
      }
      
      return updated;
    }));
    
    toast.success('Valores padrão aplicados!');
  }, [globalDefaults]);

  const handleImport = useCallback(async () => {
    const toImport = parsedQuestions.filter(q => q.selected && q.status !== 'error');
    
    if (toImport.length === 0) {
      toast.error('Nenhuma questão selecionada para importar');
      return;
    }

    setStep('importing');
    setImportProgress(0);

    let imported = 0;
    let failed = 0;

    for (let i = 0; i < toImport.length; i++) {
      const q = toImport[i];
      
      try {
        // IMPORTAÇÃO SEMPRE COMO RASCUNHO (is_active = false, status_revisao = 'rascunho')
        const payload = {
          question_text: q.question_text,
          question_type: 'multiple_choice',
          options: q.options.filter(o => o.text.trim()).map(o => ({ id: o.id, text: o.text })),
          correct_answer: q.correct_answer,
          explanation: q.explanation || null,
          difficulty: q.difficulty,
          banca: q.banca || null,
          ano: q.ano || null,
          macro: q.macro || null,
          micro: q.micro || null,
          tema: q.tema || null,
          subtema: q.subtema || null,
          tags: q.tags || [],
          points: 10,
          // REGRA: Importação sempre como inativo/rascunho para revisão
          is_active: false,
          status_revisao: 'rascunho',
          // Novos campos pedagógicos
          tempo_medio_segundos: q.tempo_medio_segundos,
          nivel_cognitivo: q.nivel_cognitivo,
          origem: q.origem,
          // Metadado de campos inferidos
          campos_inferidos: q.campos_inferidos,
        };

        const { error } = await supabase
          .from('quiz_questions')
          .insert([payload as any]);

        if (error) throw error;
        imported++;
      } catch (err) {
        console.error('Erro ao importar questão:', err);
        failed++;
      }

      setImportProgress(Math.round(((i + 1) / toImport.length) * 100));
    }

    if (failed === 0) {
      toast.success(`${imported} questões importadas com sucesso!`);
    } else {
      toast.warning(`${imported} importadas, ${failed} falharam`);
    }

    onSuccess();
    onClose();
  }, [parsedQuestions, onSuccess, onClose]);

  const reset = useCallback(() => {
    setStep('upload');
    setFile(null);
    setRawData([]);
    setHeaders([]);
    setColumnMapping({});
    setParsedQuestions([]);
    setImportProgress(0);
    setExpandedQuestion(null);
    setEditingQuestion(null);
    setFilterStatus('all');
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  // ============================================
  // RENDER
  // ============================================

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-[min(98vw,90rem)] max-w-none max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 border border-primary/30">
              <Upload className="h-5 w-5 text-primary" />
            </div>
            <span>Importar Questões</span>
            <Badge variant="outline" className="ml-2">
              {step === 'upload' && 'Upload'}
              {step === 'mapping' && 'Mapeamento'}
              {step === 'preview' && 'Preview'}
              {step === 'importing' && 'Importando...'}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Importe questões de arquivos Excel, CSV ou TXT com classificação automática
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {/* STEP 1: UPLOAD */}
            {step === 'upload' && (
              <motion.div
                key="upload"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex flex-col items-center justify-center p-8"
              >
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="w-full max-w-lg p-12 border-2 border-dashed border-primary/30 rounded-xl bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-all cursor-pointer"
                  onClick={() => document.getElementById('file-import-input')?.click()}
                >
                  <input
                    id="file-import-input"
                    type="file"
                    accept=".xlsx,.xls,.csv,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  <div className="flex flex-col items-center gap-4 text-center">
                    {isProcessing ? (
                      <Loader2 className="h-16 w-16 text-primary animate-spin" />
                    ) : (
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20">
                        <FileSpreadsheet className="h-12 w-12 text-primary" />
                      </div>
                    )}
                    
                    <div>
                      <h3 className="text-lg font-semibold">
                        {isProcessing ? 'Processando...' : 'Arraste o arquivo aqui'}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        ou clique para selecionar
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline">.xlsx</Badge>
                      <Badge variant="outline">.xls</Badge>
                      <Badge variant="outline">.csv</Badge>
                      <Badge variant="outline">.txt</Badge>
                    </div>
                  </div>
                </div>

                {/* Template download */}
                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Não tem um arquivo? Baixe nosso template:
                  </p>
                  <Button variant="outline" size="sm" onClick={() => {
                    const template = [
                      ['Pergunta', 'A', 'B', 'C', 'D', 'E', 'Resposta', 'Explicação', 'Dificuldade', 'Banca', 'Ano', 'Macro', 'Micro', 'Tema'],
                      ['Qual é o símbolo do elemento Ouro?', 'Au', 'Ag', 'Fe', 'Cu', 'Zn', 'A', 'O símbolo Au vem do latim Aurum', 'Fácil', 'ENEM', '2023', 'Química Geral', 'Tabela Periódica', 'Elementos'],
                    ];
                    const ws = XLSX.utils.aoa_to_sheet(template);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, 'Questões');
                    XLSX.writeFile(wb, 'template_questoes.xlsx');
                    toast.success('Template baixado!');
                  }}>
                    <Download className="h-4 w-4 mr-2" />
                    Baixar Template Excel
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: MAPPING */}
            {step === 'mapping' && (
              <motion.div
                key="mapping"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex flex-col overflow-hidden"
              >
                <div className="flex items-center justify-between p-4 border-b">
                  <div>
                    <h3 className="font-semibold">Mapeamento de Colunas</h3>
                    <p className="text-sm text-muted-foreground">
                      {rawData.length} linhas • {headers.length} colunas detectadas
                    </p>
                  </div>
                  <Badge variant="outline" className="gap-1">
                    <Sparkles className="h-3 w-3" />
                    {Object.keys(columnMapping).length} auto-detectadas
                  </Badge>
                </div>

                <div className="flex-1 overflow-auto p-4">
                  <div className="min-w-[1100px]">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {headers.map(header => (
                        <div key={header} className="space-y-2">
                          <Label className="text-xs font-medium flex items-center gap-2">
                            {header}
                            {columnMapping[header] && (
                              <CheckCircle className="h-3 w-3 text-green-500" />
                            )}
                          </Label>
                          <Select
                            value={columnMapping[header] || '_skip'}
                            onValueChange={(v) => {
                              if (v === '_skip') {
                                const { [header]: _, ...rest } = columnMapping;
                                setColumnMapping(rest);
                              } else {
                                setColumnMapping(prev => ({ ...prev, [header]: v }));
                              }
                            }}
                          >
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="Pular" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="_skip">— Pular —</SelectItem>
                              <SelectItem value="question_text">📝 Enunciado</SelectItem>
                              <SelectItem value="option_a">🅰️ Alternativa A</SelectItem>
                              <SelectItem value="option_b">🅱️ Alternativa B</SelectItem>
                              <SelectItem value="option_c">©️ Alternativa C</SelectItem>
                              <SelectItem value="option_d">🅳 Alternativa D</SelectItem>
                              <SelectItem value="option_e">🅴 Alternativa E</SelectItem>
                              <SelectItem value="correct_answer">✅ Resposta Correta</SelectItem>
                              <SelectItem value="explanation">💡 Explicação</SelectItem>
                              <SelectItem value="difficulty">📊 Dificuldade</SelectItem>
                              <SelectItem value="banca">🏛️ Banca</SelectItem>
                              <SelectItem value="ano">📅 Ano</SelectItem>
                              <SelectItem value="macro">🎯 Macro</SelectItem>
                              <SelectItem value="micro">📚 Micro</SelectItem>
                              <SelectItem value="tema">📖 Tema</SelectItem>
                              <SelectItem value="subtema">📑 Subtema</SelectItem>
                              <SelectItem value="tags">🏷️ Tags</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>

                  {/* Valores Padrão Globais */}
                  <div className="mt-8 p-4 rounded-lg border border-primary/20 bg-primary/5">
                    <div className="flex items-center gap-2 mb-4">
                      <Wand2 className="h-4 w-4 text-primary" />
                      <h4 className="font-semibold text-primary">Valores Padrão (aplicar a todas)</h4>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Banca */}
                      <div className="space-y-2">
                        <Label className="text-xs">Banca</Label>
                        <Select
                          value={globalDefaults.banca || '_none'}
                          onValueChange={(v) => setGlobalDefaults(prev => ({ ...prev, banca: v === '_none' ? '' : v }))}
                        >
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px]">
                            <SelectItem value="_none">— Sem banca —</SelectItem>
                            {Object.entries(BANCAS_POR_CATEGORIA).map(([categoria, bancas]) => (
                              <div key={categoria}>
                                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">
                                  {CATEGORIA_LABELS[categoria as keyof typeof CATEGORIA_LABELS]}
                                </div>
                                {bancas.map(b => (
                                  <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                                ))}
                              </div>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Ano */}
                      <div className="space-y-2">
                        <Label className="text-xs">Ano</Label>
                        <Input
                          type="number"
                          min={1990}
                          max={new Date().getFullYear() + 1}
                          value={globalDefaults.ano}
                          placeholder="(vazio)"
                          onChange={(e) => {
                            const raw = e.target.value;
                            if (!raw) {
                              setGlobalDefaults(prev => ({ ...prev, ano: '' }));
                              return;
                            }
                            const parsed = parseInt(raw, 10);
                            setGlobalDefaults(prev => ({ ...prev, ano: Number.isFinite(parsed) ? parsed : '' }));
                          }}
                          className="h-9 text-xs"
                        />
                      </div>

                      {/* Dificuldade */}
                      <div className="space-y-2">
                        <Label className="text-xs">Dificuldade</Label>
                        <Select
                          value={globalDefaults.difficulty}
                          onValueChange={(v) => setGlobalDefaults(prev => ({ ...prev, difficulty: v as any }))}
                        >
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="facil">🟢 Fácil</SelectItem>
                            <SelectItem value="medio">🟡 Médio</SelectItem>
                            <SelectItem value="dificil">🔴 Difícil</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Macro */}
                      <div className="space-y-2">
                        <Label className="text-xs">Macro</Label>
                        <Select
                          value={globalDefaults.macro}
                          onValueChange={(v) => setGlobalDefaults(prev => ({ ...prev, macro: v, micro: '', tema: '', subtema: '' }))}
                          disabled={taxonomyLoading}
                        >
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            {macros.map(m => (
                              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Preview dos dados */}
                  <div className="mt-6">
                    <h4 className="font-semibold mb-2 text-sm">Preview dos dados (primeiras 3 linhas)</h4>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {headers.map(h => (
                              <TableHead key={h} className="text-xs whitespace-nowrap">
                                {h}
                                {columnMapping[h] && (
                                  <span className="ml-1 text-primary">→ {columnMapping[h]}</span>
                                )}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rawData.slice(0, 3).map((row, i) => (
                            <TableRow key={i}>
                              {headers.map(h => (
                                <TableCell key={h} className="text-xs max-w-[200px] truncate">
                                  {String(row[h] || '').slice(0, 50)}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="p-4 border-t relative z-50 bg-background">
                  <Button variant="outline" onClick={reset}>
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button
                    onClick={processQuestions}
                    disabled={!Object.values(columnMapping).includes('question_text') || isProcessing}
                    className="bg-gradient-to-r from-primary to-purple-600"
                  >
                    {isProcessing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <ArrowRight className="h-4 w-4 mr-2" />
                    )}
                    Processar Questões
                  </Button>
                </DialogFooter>
              </motion.div>
            )}

            {/* STEP 3: PREVIEW */}
            {step === 'preview' && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex flex-col overflow-hidden"
              >
                {/* Stats bar */}
                <div className="flex items-center justify-between p-4 border-b gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="gap-1">
                      <FileQuestion className="h-3 w-3" />
                      {stats.total} total
                    </Badge>
                    <Badge className="bg-green-500/20 text-green-500 border-green-500/30 gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {stats.valid} válidas
                    </Badge>
                    {stats.warnings > 0 && (
                      <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30 gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {stats.warnings} avisos
                      </Badge>
                    )}
                    {stats.errors > 0 && (
                      <Badge className="bg-red-500/20 text-red-500 border-red-500/30 gap-1">
                        <XCircle className="h-3 w-3" />
                        {stats.errors} erros
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
                      <SelectTrigger className="w-[130px] h-8 text-xs">
                        <Filter className="h-3 w-3 mr-1" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="valid">Válidas</SelectItem>
                        <SelectItem value="warning">Com Aviso</SelectItem>
                        <SelectItem value="error">Com Erro</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Button variant="outline" size="sm" onClick={applyGlobalDefaults}>
                      <Wand2 className="h-3 w-3 mr-1" />
                      Aplicar Padrões
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleSelectAll(stats.selected !== stats.valid + stats.warnings)}
                    >
                      {stats.selected === stats.valid + stats.warnings ? (
                        <>
                          <XCircle className="h-3 w-3 mr-1" />
                          Desmarcar
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Selecionar
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Questions list */}
                <div className="flex-1 overflow-auto">
                  <div className="p-4 space-y-2 min-w-[980px]">
                    {filteredQuestions.map((q, index) => (
                      <Card
                        key={q.id}
                        className={cn(
                          "transition-all",
                          q.status === 'valid' && "border-green-500/30",
                          q.status === 'warning' && "border-yellow-500/30",
                          q.status === 'error' && "border-red-500/30 opacity-60",
                          q.selected && "ring-2 ring-primary/50"
                        )}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={q.selected}
                              onCheckedChange={() => toggleSelect(q.id)}
                              disabled={q.status === 'error'}
                              className="mt-1"
                            />
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-mono text-muted-foreground">
                                  #{index + 1}
                                </span>
                                
                                {q.status === 'valid' && (
                                  <Badge className="bg-green-500/20 text-green-500 text-[10px] h-5">
                                    <CheckCircle className="h-2.5 w-2.5 mr-1" />
                                    Válida
                                  </Badge>
                                )}
                                {q.status === 'warning' && (
                                  <Badge className="bg-yellow-500/20 text-yellow-500 text-[10px] h-5">
                                    <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                                    Aviso
                                  </Badge>
                                )}
                                {q.status === 'error' && (
                                  <Badge className="bg-red-500/20 text-red-500 text-[10px] h-5">
                                    <XCircle className="h-2.5 w-2.5 mr-1" />
                                    Erro
                                  </Badge>
                                )}
                                
                                {q.banca && (
                                  <Badge variant="outline" className="text-[10px] h-5">
                                    {findBancaByValue(q.banca)?.label || q.banca}
                                  </Badge>
                                )}
                                {q.ano && (
                                  <Badge variant="outline" className="text-[10px] h-5">
                                    {q.ano}
                                  </Badge>
                                )}
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-[10px] h-5",
                                    q.difficulty === 'facil' && "text-green-500 border-green-500/30",
                                    q.difficulty === 'medio' && "text-yellow-500 border-yellow-500/30",
                                    q.difficulty === 'dificil' && "text-red-500 border-red-500/30",
                                  )}
                                >
                                  {q.difficulty === 'facil' ? '🟢 Fácil' : q.difficulty === 'medio' ? '🟡 Médio' : '🔴 Difícil'}
                                </Badge>
                              </div>

                              <p className="text-sm line-clamp-2">
                                {q.question_text || <span className="text-muted-foreground italic">Sem enunciado</span>}
                              </p>

                              {/* Errors/Warnings */}
                              {(q.errors.length > 0 || q.warnings.length > 0) && (
                                <div className="mt-2 space-y-1">
                                  {q.errors.map((e, i) => (
                                    <p key={i} className="text-xs text-red-500 flex items-center gap-1">
                                      <XCircle className="h-3 w-3" />
                                      {e}
                                    </p>
                                  ))}
                                  {q.warnings.map((w, i) => (
                                    <p key={i} className="text-xs text-yellow-500 flex items-center gap-1">
                                      <AlertTriangle className="h-3 w-3" />
                                      {w}
                                    </p>
                                  ))}
                                </div>
                              )}

                              {/* Expandido */}
                              {expandedQuestion === q.id && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="mt-3 pt-3 border-t space-y-3"
                                >
                                  {/* Alternativas */}
                                  <div className="space-y-1">
                                    {q.options.filter(o => o.text).map(opt => (
                                      <div
                                        key={opt.id}
                                        className={cn(
                                          "flex items-center gap-2 text-xs p-2 rounded",
                                          opt.id === q.correct_answer && "bg-green-500/10 border border-green-500/30"
                                        )}
                                      >
                                        <span className="font-mono font-bold uppercase">{opt.id})</span>
                                        <span>{opt.text}</span>
                                        {opt.id === q.correct_answer && (
                                          <CheckCircle className="h-3 w-3 text-green-500 ml-auto" />
                                        )}
                                      </div>
                                    ))}
                                  </div>

                                  {/* Explicação */}
                                  {q.explanation && (
                                    <div className="p-2 rounded bg-muted/50">
                                      <p className="text-xs font-medium mb-1">Explicação:</p>
                                      <p className="text-xs text-muted-foreground">{q.explanation}</p>
                                    </div>
                                  )}

                                  {/* Classificação */}
                                  {(q.macro || q.micro || q.tema) && (
                                    <div className="flex flex-wrap gap-1">
                                      {q.macro && <Badge variant="outline" className="text-[10px]">Macro: {q.macro}</Badge>}
                                      {q.micro && <Badge variant="outline" className="text-[10px]">Micro: {q.micro}</Badge>}
                                      {q.tema && <Badge variant="outline" className="text-[10px]">Tema: {q.tema}</Badge>}
                                    </div>
                                  )}
                                </motion.div>
                              )}
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setExpandedQuestion(expandedQuestion === q.id ? null : q.id)}
                            >
                              {expandedQuestion === q.id ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                <DialogFooter className="p-4 border-t">
                  <div className="flex items-center gap-2 mr-auto">
                    <Badge className="bg-primary/20 text-primary">
                      {stats.selected} selecionadas para importar
                    </Badge>
                  </div>
                  <Button variant="outline" onClick={() => setStep('mapping')}>
                    Voltar
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={stats.selected === 0}
                    className="bg-gradient-to-r from-primary to-purple-600"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Importar {stats.selected} Questões
                  </Button>
                </DialogFooter>
              </motion.div>
            )}

            {/* STEP 4: IMPORTING */}
            {step === 'importing' && (
              <motion.div
                key="importing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full flex flex-col items-center justify-center p-12"
              >
                <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 mb-6">
                  <Loader2 className="h-16 w-16 text-primary animate-spin" />
                </div>
                
                <h3 className="text-xl font-bold mb-2">Importando questões...</h3>
                <p className="text-muted-foreground mb-6">
                  {Math.round(importProgress)}% concluído
                </p>
                
                <div className="w-full max-w-md">
                  <Progress value={importProgress} className="h-3" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
});

export default QuestionImportDialog;
