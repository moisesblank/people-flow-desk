// ============================================
// 📥 IMPORTADOR DE QUESTÕES - Sistema Completo
// CONTRATO v3.0 - State Machine + Inferência Rastreável
// Visual Futurístico Ano 2300
// ============================================

import { memo, useState, useCallback, useMemo, useEffect } from 'react';
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
  Wand2,
  ShieldCheck,
  Clock,
  AlertOctagon,
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

// ============================================
// STATE MACHINE - 5 ESTADOS CONTROLADOS
// ============================================

type ImportFlowState = 
  | 'arquivo_carregado'
  | 'inferencia_em_execucao'
  | 'inferencia_concluida'
  | 'validacao_humana_obrigatoria'
  | 'autorizacao_explicita';

interface ParsedQuestion {
  id: string;
  question_text: string;
  options: { id: string; text: string }[];
  correct_answer: string;
  explanation?: string;
  difficulty?: 'facil' | 'medio' | 'dificil';
  // Origem e Identidade
  banca?: string;
  ano?: number;
  origem?: OrigemQuestao;
  // Classificação Hierárquica
  macro?: string;
  micro?: string;
  tema?: string;
  subtema?: string;
  tags?: string[];
  // Metadados Pedagógicos
  competencia_enem?: string;
  habilidade_enem?: string;
  nivel_cognitivo?: NivelCognitivo;
  tempo_medio_segundos?: number;
  multidisciplinar?: boolean;
  // Mídia
  imagens_enunciado?: string[];
  imagens_alternativas?: Record<string, string>;
  tipo_imagem?: 'ilustrativa' | 'essencial' | 'decorativa';
  // Controle Editorial
  is_active: false;
  status_revisao: 'rascunho';
  // RASTREABILIDADE
  campos_inferidos: string[];
  campos_null: string[];
  // Status de Validação
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
  camposInferidos: number;
  camposNull: number;
}

interface QuestionImportDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// ============================================
// MAPEAMENTOS INTELIGENTES
// ============================================

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
  competencia_enem: ['competencia', 'competência', 'competencia_enem'],
  habilidade_enem: ['habilidade', 'habilidade_enem', 'h'],
};

const DIFFICULTY_MAPPING: Record<string, 'facil' | 'medio' | 'dificil'> = {
  'facil': 'facil', 'fácil': 'facil', 'easy': 'facil', 'baixa': 'facil', 'low': 'facil', '1': 'facil', 'f': 'facil',
  'medio': 'medio', 'médio': 'medio', 'medium': 'medio', 'média': 'medio', 'normal': 'medio', '2': 'medio', 'm': 'medio',
  'dificil': 'dificil', 'difícil': 'dificil', 'hard': 'dificil', 'alta': 'dificil', 'high': 'dificil', '3': 'dificil', 'd': 'dificil',
};

const ANSWER_MAPPING: Record<string, string> = {
  'a': 'a', '1': 'a', 'i': 'a',
  'b': 'b', '2': 'b', 'ii': 'b',
  'c': 'c', '3': 'c', 'iii': 'c',
  'd': 'd', '4': 'd', 'iv': 'd',
  'e': 'e', '5': 'e', 'v': 'e',
};

// Verbos para inferência de nível cognitivo (Taxonomia de Bloom)
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

function parseDifficulty(value: any): 'facil' | 'medio' | 'dificil' | undefined {
  if (!value) return undefined;
  const normalized = String(value).toLowerCase().trim();
  return DIFFICULTY_MAPPING[normalized] || undefined;
}

function parseCorrectAnswer(value: any): string {
  if (!value) return 'a';
  const normalized = String(value).toLowerCase().trim();
  return ANSWER_MAPPING[normalized] || 'a';
}

// ============================================
// INFERÊNCIA POR CAMPO (CONTRATO PARTE 3)
// ============================================

interface InferenceResult<T> {
  value: T | undefined;
  inferido: boolean;
  metodo: string;
}

function inferBanca(text: string, fromColumn?: string): InferenceResult<string> {
  // Método: analise_textual_por_questao
  if (fromColumn) {
    const detected = detectBanca(fromColumn);
    if (detected) return { value: detected, inferido: false, metodo: 'coluna_explicita' };
    // Se tem valor na coluna mas não é reconhecido, usar como está
    const trimmed = fromColumn.trim();
    if (trimmed) return { value: trimmed.toLowerCase(), inferido: false, metodo: 'coluna_explicita' };
  }
  
  // Tentar inferir do texto
  const detected = detectBanca(text);
  if (detected) return { value: detected, inferido: true, metodo: 'analise_textual_por_questao' };
  
  // Fallback: autoral_prof_moises (NÃO forçar, apenas marcar como inferido)
  return { value: 'autoral_prof_moises', inferido: true, metodo: 'fallback_autoral' };
}

function inferAno(text: string, fromColumn?: string): InferenceResult<number> {
  // Método: coluna_ano_ou_texto
  if (fromColumn) {
    const parsed = parseInt(String(fromColumn).trim(), 10);
    if (Number.isFinite(parsed) && parsed >= 1990 && parsed <= new Date().getFullYear() + 1) {
      return { value: parsed, inferido: false, metodo: 'coluna_explicita' };
    }
  }
  
  // Tentar inferir do texto
  const detected = detectYear(text);
  if (detected) return { value: detected, inferido: true, metodo: 'analise_textual_por_questao' };
  
  // Fallback: null (NÃO forçar)
  return { value: undefined, inferido: false, metodo: 'nao_identificado' };
}

function inferNivelCognitivo(text: string): InferenceResult<NivelCognitivo> {
  // Método: analise_de_verbo_e_estrutura
  const lower = text.toLowerCase();
  
  for (const nivel of ['avaliar', 'analisar', 'aplicar', 'compreender', 'memorizar'] as NivelCognitivo[]) {
    for (const verbo of VERBOS_COGNITIVOS[nivel]) {
      if (lower.includes(verbo)) {
        return { value: nivel, inferido: true, metodo: 'analise_de_verbo_e_estrutura' };
      }
    }
  }
  
  // Fallback: null
  return { value: undefined, inferido: false, metodo: 'nao_identificado' };
}

function inferTempoMedio(difficulty?: 'facil' | 'medio' | 'dificil'): InferenceResult<number> {
  // Método: inferir_por_dificuldade
  if (!difficulty) {
    // Fallback: 120 segundos
    return { value: 120, inferido: true, metodo: 'fallback_padrao' };
  }
  
  switch (difficulty) {
    case 'facil': return { value: 60, inferido: true, metodo: 'inferir_por_dificuldade' };
    case 'medio': return { value: 120, inferido: true, metodo: 'inferir_por_dificuldade' };
    case 'dificil': return { value: 180, inferido: true, metodo: 'inferir_por_dificuldade' };
  }
}

function inferOrigem(banca?: string): InferenceResult<OrigemQuestao> {
  if (!banca) return { value: 'autoral_prof_moises', inferido: true, metodo: 'sem_banca' };
  
  const bancaEncontrada = BANCAS.find(b => 
    b.value.toLowerCase() === banca.toLowerCase() || 
    b.label.toLowerCase() === banca.toLowerCase()
  );
  
  if (bancaEncontrada) return { value: 'oficial', inferido: true, metodo: 'banca_conhecida' };
  if (banca === 'autoral_prof_moises') return { value: 'autoral_prof_moises', inferido: false, metodo: 'explicito' };
  return { value: 'adaptada', inferido: true, metodo: 'banca_desconhecida' };
}

function extractTextFromHtml(html: string): string {
  if (!html) return '';
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

function parseAlternativesFromHtml(html: string): { options: { id: string; text: string }[]; correctAnswer: string } {
  const options: { id: string; text: string }[] = [];
  let correctAnswer = 'a';
  
  const patterns = [
    /\(?([A-Ea-e])\)?\s*[\.\)\-]?\s*([^(A-E][^\n]+?)(?=\(?[A-Ea-e]\)|$)/gi,
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
  // UI Step (upload | mapping | preview | importing)
  const [uiStep, setUiStep] = useState<'upload' | 'mapping' | 'preview' | 'importing'>('upload');
  
  // STATE MACHINE - Fluxo Controlado
  const [flowState, setFlowState] = useState<ImportFlowState | null>(null);
  
  // Dados
  const [file, setFile] = useState<File | null>(null);
  const [rawData, setRawData] = useState<Record<string, any>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  
  // Processing
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  
  // UI state
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'valid' | 'warning' | 'error'>('all');
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  
  // AUTORIZAÇÃO EXPLÍCITA (checkbox obrigatório)
  const [humanAuthorization, setHumanAuthorization] = useState(false);
  
  // Defaults globais OPCIONAIS (não forçados automaticamente)
  const [globalDefaults, setGlobalDefaults] = useState({
    banca: '' as string,
    ano: '' as '' | number,
    difficulty: '' as '' | 'facil' | 'medio' | 'dificil',
    macro: '',
    micro: '',
    tema: '',
    subtema: '',
  });
  
  const { macros, getMicrosForSelect, getTemasForSelect, getSubtemasForSelect, isLoading: taxonomyLoading } = useTaxonomyForSelects();

  // ============================================
  // ESTATÍSTICAS
  // ============================================
  
  const stats: ImportStats = useMemo(() => {
    const valid = parsedQuestions.filter(q => q.status === 'valid').length;
    const warnings = parsedQuestions.filter(q => q.status === 'warning').length;
    const errors = parsedQuestions.filter(q => q.status === 'error').length;
    const selected = parsedQuestions.filter(q => q.selected).length;
    const camposInferidos = parsedQuestions.reduce((acc, q) => acc + q.campos_inferidos.length, 0);
    const camposNull = parsedQuestions.reduce((acc, q) => acc + q.campos_null.length, 0);
    
    return { total: parsedQuestions.length, valid, warnings, errors, selected, camposInferidos, camposNull };
  }, [parsedQuestions]);

  const filteredQuestions = useMemo(() => {
    if (filterStatus === 'all') return parsedQuestions;
    return parsedQuestions.filter(q => q.status === filterStatus);
  }, [parsedQuestions, filterStatus]);

  // ============================================
  // VALIDAÇÃO DE ESTADO PARA BOTÃO PROCESSAR
  // ============================================
  
  const canProcess = useMemo(() => {
    // Condição única: estado === autorizacao_explicita
    return (
      flowState === 'autorizacao_explicita' &&
      humanAuthorization === true &&
      parsedQuestions.length > 0 &&
      stats.selected > 0
    );
  }, [flowState, humanAuthorization, parsedQuestions.length, stats.selected]);

  // Reset autorização quando questões mudam
  useEffect(() => {
    setHumanAuthorization(false);
  }, [parsedQuestions]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsProcessing(true);
    setFlowState('arquivo_carregado');

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
      
      // Auto-detectar mapeamento
      const autoMapping: Record<string, string> = {};
      detectedHeaders.forEach(header => {
        const mapped = findColumnMapping(header);
        if (mapped) autoMapping[header] = mapped;
      });
      setColumnMapping(autoMapping);
      
      if (data.length > 0) {
        setUiStep('mapping');
        toast.success(`${data.length} linhas detectadas no arquivo`);
      } else {
        toast.error('Nenhum dado encontrado no arquivo');
        setFlowState(null);
      }
    } catch (err) {
      console.error('Erro ao processar arquivo:', err);
      toast.error('Erro ao processar arquivo');
      setFlowState(null);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      const input = document.getElementById('file-import-input') as HTMLInputElement;
      if (input) {
        const dt = new DataTransfer();
        dt.items.add(droppedFile);
        input.files = dt.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  }, []);

  // ============================================
  // PROCESSAMENTO COM INFERÊNCIA RASTREÁVEL
  // ============================================

  const processQuestions = useCallback(() => {
    if (!Object.values(columnMapping).includes('question_text')) {
      toast.error('Mapeie a coluna "Enunciado" para continuar');
      return;
    }

    setIsProcessing(true);
    setFlowState('inferencia_em_execucao');
    
    // Simular delay para mostrar estado
    setTimeout(() => {
      try {
        const questions: ParsedQuestion[] = rawData.map((row, index) => {
          const camposInferidos: string[] = [];
          const camposNull: string[] = [];
          
          // Inicializar questão com TUDO undefined/null
          const question: ParsedQuestion = {
            id: generateQuestionId(),
            question_text: '',
            options: [],
            correct_answer: 'a',
            explanation: undefined,
            difficulty: undefined,
            banca: undefined,
            ano: undefined,
            origem: undefined,
            macro: undefined,
            micro: undefined,
            tema: undefined,
            subtema: undefined,
            tags: undefined,
            competencia_enem: undefined,
            habilidade_enem: undefined,
            nivel_cognitivo: undefined,
            tempo_medio_segundos: undefined,
            multidisciplinar: undefined,
            imagens_enunciado: undefined,
            imagens_alternativas: undefined,
            tipo_imagem: undefined,
            // Controle Editorial - SEMPRE
            is_active: false,
            status_revisao: 'rascunho',
            // Rastreabilidade
            campos_inferidos: [],
            campos_null: [],
            // Status
            status: 'pending',
            errors: [],
            warnings: [],
            selected: true,
            rawData: row,
          };

          // ============================================
          // MAPEAR CAMPOS EXPLÍCITOS DAS COLUNAS
          // ============================================
          
          for (const [header, field] of Object.entries(columnMapping)) {
            const value = row[header];
            if (value === undefined || value === null || String(value).trim() === '') continue;

            switch (field) {
              case 'question_text':
                question.question_text = extractTextFromHtml(String(value));
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
              case 'banca':
                question.banca = String(value).trim().toLowerCase() || undefined;
                break;
              case 'ano':
                const anoVal = parseInt(String(value).trim(), 10);
                question.ano = Number.isFinite(anoVal) ? anoVal : undefined;
                break;
              case 'macro':
                question.macro = String(value).trim() || undefined;
                break;
              case 'micro':
                question.micro = String(value).trim() || undefined;
                break;
              case 'tema':
                question.tema = String(value).trim() || undefined;
                break;
              case 'subtema':
                question.subtema = String(value).trim() || undefined;
                break;
              case 'tags':
                question.tags = String(value).split(/[,;]/).map(t => t.trim()).filter(t => t);
                break;
              case 'competencia_enem':
                question.competencia_enem = String(value).trim() || undefined;
                break;
              case 'habilidade_enem':
                question.habilidade_enem = String(value).trim() || undefined;
                break;
            }
          }

          // ============================================
          // INFERÊNCIA POR CAMPO (CONTRATO PARTE 3)
          // ============================================
          
          const enunciado = question.question_text || '';

          // BANCA: analise_textual_por_questao, fallback = autoral_prof_moises
          if (!question.banca) {
            const bancaResult = inferBanca(enunciado);
            if (bancaResult.value) {
              question.banca = bancaResult.value;
              if (bancaResult.inferido) camposInferidos.push(`banca:${bancaResult.metodo}`);
            }
          }

          // ANO: coluna_ano_ou_texto, fallback = null
          if (!question.ano) {
            const anoResult = inferAno(enunciado);
            if (anoResult.value) {
              question.ano = anoResult.value;
              if (anoResult.inferido) camposInferidos.push(`ano:${anoResult.metodo}`);
            } else {
              camposNull.push('ano');
            }
          }

          // NIVEL_COGNITIVO: analise_de_verbo_e_estrutura, fallback = null
          if (!question.nivel_cognitivo) {
            const nivelResult = inferNivelCognitivo(enunciado);
            if (nivelResult.value) {
              question.nivel_cognitivo = nivelResult.value;
              camposInferidos.push(`nivel_cognitivo:${nivelResult.metodo}`);
            } else {
              camposNull.push('nivel_cognitivo');
            }
          }

          // TEMPO_MEDIO: inferir_por_dificuldade, fallback = 120
          if (!question.tempo_medio_segundos) {
            const tempoResult = inferTempoMedio(question.difficulty);
            question.tempo_medio_segundos = tempoResult.value;
            camposInferidos.push(`tempo_medio_segundos:${tempoResult.metodo}`);
          }

          // ORIGEM: baseado na banca
          if (!question.origem) {
            const origemResult = inferOrigem(question.banca);
            question.origem = origemResult.value;
            if (origemResult.inferido) camposInferidos.push(`origem:${origemResult.metodo}`);
          }

          // TIPO_IMAGEM: fallback = ilustrativa (se houver imagens)
          // Por enquanto, sem imagens detectadas
          
          // COMPETENCIA/HABILIDADE: só se existir coluna (já mapeado acima)
          if (!question.competencia_enem) camposNull.push('competencia_enem');
          if (!question.habilidade_enem) camposNull.push('habilidade_enem');
          
          // Classificação hierárquica
          if (!question.macro) camposNull.push('macro');
          if (!question.micro) camposNull.push('micro');
          if (!question.tema) camposNull.push('tema');
          if (!question.subtema) camposNull.push('subtema');
          if (!question.difficulty) camposNull.push('difficulty');

          // Ordenar alternativas
          const existingIds = question.options.map(o => o.id);
          const allIds = ['a', 'b', 'c', 'd', 'e'];
          for (const id of allIds) {
            if (!existingIds.includes(id)) {
              question.options.push({ id, text: '' });
            }
          }
          question.options.sort((a, b) => a.id.localeCompare(b.id));

          // Registrar rastreabilidade
          question.campos_inferidos = camposInferidos;
          question.campos_null = camposNull;

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

          // Warnings para campos null importantes
          if (!question.banca || question.banca === 'autoral_prof_moises') {
            question.warnings.push('Banca não identificada (será "Autoral Prof. Moisés")');
          }
          if (!question.ano) {
            question.warnings.push('Ano não identificado');
          }

          // Definir status
          if (question.errors.length > 0) {
            question.status = 'error';
            question.selected = false;
          } else if (question.warnings.length > 0) {
            question.status = 'warning';
          } else {
            question.status = 'valid';
          }

          return question;
        });

        setParsedQuestions(questions);
        setFlowState('inferencia_concluida');
        setUiStep('preview');
        
        // Avançar para validação humana
        setTimeout(() => {
          setFlowState('validacao_humana_obrigatoria');
        }, 100);
        
        const validCount = questions.filter(q => q.status !== 'error').length;
        toast.success(`Inferência concluída: ${validCount} questões prontas para revisão`);
      } catch (err) {
        console.error('Erro ao processar questões:', err);
        toast.error('Erro ao processar questões');
        setFlowState('arquivo_carregado');
      } finally {
        setIsProcessing(false);
      }
    }, 500);
  }, [rawData, columnMapping]);

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

      if (!updated.banca || updated.banca === 'autoral_prof_moises') {
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
    if (!globalDefaults.banca && !globalDefaults.ano && !globalDefaults.macro && !globalDefaults.difficulty) {
      toast.info('Nenhum valor padrão definido para aplicar');
      return;
    }

    setParsedQuestions(prev => prev.map(q => {
      const updated = { ...q };
      const newInferidos = [...q.campos_inferidos];
      const newNull = [...q.campos_null];
      
      if (globalDefaults.banca && !q.banca) {
        updated.banca = globalDefaults.banca;
        newInferidos.push('banca:aplicado_manual');
        const idx = newNull.indexOf('banca');
        if (idx > -1) newNull.splice(idx, 1);
      }
      if (typeof globalDefaults.ano === 'number' && !q.ano) {
        updated.ano = globalDefaults.ano;
        newInferidos.push('ano:aplicado_manual');
        const idx = newNull.indexOf('ano');
        if (idx > -1) newNull.splice(idx, 1);
      }
      if (globalDefaults.macro && !q.macro) {
        updated.macro = globalDefaults.macro;
        newInferidos.push('macro:aplicado_manual');
        const idx = newNull.indexOf('macro');
        if (idx > -1) newNull.splice(idx, 1);
      }
      if (globalDefaults.difficulty && !q.difficulty) {
        updated.difficulty = globalDefaults.difficulty;
        newInferidos.push('difficulty:aplicado_manual');
        const idx = newNull.indexOf('difficulty');
        if (idx > -1) newNull.splice(idx, 1);
      }
      
      updated.campos_inferidos = newInferidos;
      updated.campos_null = newNull;
      
      // Revalidar warnings
      updated.warnings = [];
      if (!updated.banca || updated.banca === 'autoral_prof_moises') {
        updated.warnings.push('Banca não identificada');
      }
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
    
    toast.success('Valores padrão aplicados às questões com campos vazios!');
  }, [globalDefaults]);

  // ============================================
  // IMPORTAÇÃO FINAL
  // ============================================

  const handleImport = useCallback(async () => {
    if (!canProcess) {
      toast.error('Autorização explícita necessária para importar');
      return;
    }

    const toImport = parsedQuestions.filter(q => q.selected && q.status !== 'error');
    
    if (toImport.length === 0) {
      toast.error('Nenhuma questão selecionada para importar');
      return;
    }

    setUiStep('importing');
    setImportProgress(0);

    let imported = 0;
    let failed = 0;

    for (let i = 0; i < toImport.length; i++) {
      const q = toImport[i];
      
      try {
        // RESULTADO FINAL OBRIGATÓRIO DO CONTRATO
        const payload = {
          question_text: q.question_text,
          question_type: 'multiple_choice',
          options: q.options.filter(o => o.text.trim()).map(o => ({ id: o.id, text: o.text })),
          correct_answer: q.correct_answer,
          explanation: q.explanation || null,
          difficulty: q.difficulty || null,
          banca: q.banca || null,
          ano: q.ano || null,
          macro: q.macro || null,
          micro: q.micro || null,
          tema: q.tema || null,
          subtema: q.subtema || null,
          tags: q.tags || [],
          points: 10,
          // CONTROLE EDITORIAL (CONTRATO)
          is_active: false,
          status_revisao: 'rascunho',
          // Metadados pedagógicos
          tempo_medio_segundos: q.tempo_medio_segundos || 120,
          nivel_cognitivo: q.nivel_cognitivo || null,
          origem: q.origem || 'autoral_prof_moises',
          competencia_enem: q.competencia_enem || null,
          habilidade_enem: q.habilidade_enem || null,
          // Rastreabilidade
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
      toast.success(`${imported} questões importadas como RASCUNHO!`);
    } else {
      toast.warning(`${imported} importadas, ${failed} falharam`);
    }

    onSuccess();
    onClose();
  }, [canProcess, parsedQuestions, onSuccess, onClose]);

  const reset = useCallback(() => {
    setUiStep('upload');
    setFlowState(null);
    setFile(null);
    setRawData([]);
    setHeaders([]);
    setColumnMapping({});
    setParsedQuestions([]);
    setImportProgress(0);
    setExpandedQuestion(null);
    setEditingQuestion(null);
    setFilterStatus('all');
    setHumanAuthorization(false);
    setGlobalDefaults({
      banca: '',
      ano: '',
      difficulty: '',
      macro: '',
      micro: '',
      tema: '',
      subtema: '',
    });
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
              {uiStep === 'upload' && 'Upload'}
              {uiStep === 'mapping' && 'Mapeamento'}
              {uiStep === 'preview' && 'Validação Humana'}
              {uiStep === 'importing' && 'Importando...'}
            </Badge>
            {flowState && (
              <Badge variant="secondary" className="ml-1 text-[10px]">
                {flowState.replace(/_/g, ' ')}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Importe questões com inferência rastreável. Campos não identificados permanecerão vazios.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            {/* STEP 1: UPLOAD */}
            {uiStep === 'upload' && (
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
                    
                    <div className="flex flex-wrap gap-2 justify-center">
                      <Badge variant="outline" className="gap-1">
                        <FileSpreadsheet className="h-3 w-3" />
                        Excel
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <FileText className="h-3 w-3" />
                        CSV
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <FileText className="h-3 w-3" />
                        TXT
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {/* Regras do contrato */}
                <div className="mt-6 p-4 rounded-lg border border-yellow-500/30 bg-yellow-500/5 max-w-lg">
                  <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-semibold text-sm">Regras de Importação</span>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Campos não identificáveis permanecerão <strong>NULL</strong></li>
                    <li>• Nenhum valor padrão será forçado automaticamente</li>
                    <li>• Questões serão importadas como <strong>RASCUNHO</strong> (inativas)</li>
                    <li>• Autorização explícita será exigida antes da importação</li>
                  </ul>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Não tem um arquivo? Baixe nosso template:
                  </p>
                  <Button variant="outline" size="sm" onClick={() => {
                    const template = [
                      ['Pergunta', 'A', 'B', 'C', 'D', 'E', 'Resposta', 'Explicação', 'Dificuldade', 'Banca', 'Ano', 'Macro', 'Micro', 'Tema'],
                      ['Qual é o símbolo do elemento Ouro?', 'Au', 'Ag', 'Fe', 'Cu', 'Zn', 'A', 'O símbolo Au vem do latim Aurum', 'Fácil', 'ENEM', '2023', 'Ciências da Natureza', 'Química', 'Tabela Periódica'],
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
            {uiStep === 'mapping' && (
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
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="gap-1">
                      <Sparkles className="h-3 w-3" />
                      {Object.keys(columnMapping).length} auto-detectadas
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                      <Clock className="h-3 w-3" />
                      {flowState}
                    </Badge>
                  </div>
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
                            <SelectContent className="z-[9999]">
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
                              <SelectItem value="competencia_enem">🎓 Competência ENEM</SelectItem>
                              <SelectItem value="habilidade_enem">📐 Habilidade ENEM</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>

                    {/* Valores Padrão (OPCIONAIS) */}
                    <div className="mt-8 p-4 rounded-lg border border-blue-500/20 bg-blue-500/5">
                      <div className="flex items-center gap-2 mb-4">
                        <Wand2 className="h-4 w-4 text-blue-500" />
                        <h4 className="font-semibold text-blue-600 dark:text-blue-400">Valores Padrão (opcionais - aplicar manualmente depois)</h4>
                      </div>
                      <p className="text-xs text-muted-foreground mb-4">
                        Estes valores <strong>NÃO serão aplicados automaticamente</strong>. Use "Aplicar Padrões" na próxima tela.
                      </p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Banca</Label>
                          <Select
                            value={globalDefaults.banca || '_none'}
                            onValueChange={(v) => setGlobalDefaults(prev => ({ ...prev, banca: v === '_none' ? '' : v }))}
                          >
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="— Não definir —" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px] z-[9999]">
                              <SelectItem value="_none">— Não definir —</SelectItem>
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

                        <div className="space-y-2">
                          <Label className="text-xs">Ano</Label>
                          <Input
                            type="number"
                            min={1990}
                            max={new Date().getFullYear() + 1}
                            value={globalDefaults.ano}
                            placeholder="(não definir)"
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

                        <div className="space-y-2">
                          <Label className="text-xs">Dificuldade</Label>
                          <Select
                            value={globalDefaults.difficulty || '_none'}
                            onValueChange={(v) => setGlobalDefaults(prev => ({ ...prev, difficulty: v === '_none' ? '' : v as any }))}
                          >
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="— Não definir —" />
                            </SelectTrigger>
                            <SelectContent className="z-[9999]">
                              <SelectItem value="_none">— Não definir —</SelectItem>
                              <SelectItem value="facil">🟢 Fácil</SelectItem>
                              <SelectItem value="medio">🟡 Médio</SelectItem>
                              <SelectItem value="dificil">🔴 Difícil</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Macro</Label>
                          <Select
                            value={globalDefaults.macro || '_none'}
                            onValueChange={(v) => setGlobalDefaults(prev => ({ ...prev, macro: v === '_none' ? '' : v, micro: '', tema: '', subtema: '' }))}
                            disabled={taxonomyLoading}
                          >
                            <SelectTrigger className="h-9 text-xs">
                              <SelectValue placeholder="— Não definir —" />
                            </SelectTrigger>
                            <SelectContent className="z-[9999]">
                              <SelectItem value="_none">— Não definir —</SelectItem>
                              {macros.map(m => (
                                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {/* Preview */}
                    <div className="mt-6">
                      <h4 className="font-semibold mb-2 text-sm">Preview dos dados (primeiras 3 linhas)</h4>
                      <div className="overflow-x-auto rounded border">
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

                <DialogFooter className="p-4 border-t bg-background">
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
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Executando Inferência...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4 mr-2" />
                        Executar Inferência
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </motion.div>
            )}

            {/* STEP 3: PREVIEW (VALIDAÇÃO HUMANA) */}
            {uiStep === 'preview' && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="h-full flex flex-col overflow-hidden"
              >
                {/* Stats bar */}
                <div className="flex items-center justify-between p-4 border-b gap-4 flex-wrap">
                  <div className="flex items-center gap-3 flex-wrap">
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
                    <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/30 gap-1">
                      <Sparkles className="h-3 w-3" />
                      {stats.camposInferidos} inferidos
                    </Badge>
                    <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30 gap-1">
                      <AlertOctagon className="h-3 w-3" />
                      {stats.camposNull} null
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
                      <SelectTrigger className="w-[130px] h-8 text-xs">
                        <Filter className="h-3 w-3 mr-1" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-[9999]">
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
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
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
                                
                                {/* Campos Inferidos */}
                                {q.campos_inferidos.length > 0 && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Badge className="bg-blue-500/20 text-blue-500 text-[10px] h-5 cursor-help">
                                          <Sparkles className="h-2.5 w-2.5 mr-1" />
                                          {q.campos_inferidos.length} inferidos
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <div className="text-xs space-y-1">
                                          {q.campos_inferidos.map((c, i) => (
                                            <div key={i} className="text-blue-400">• {c}</div>
                                          ))}
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                                
                                {/* Campos NULL */}
                                {q.campos_null.length > 0 && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger>
                                        <Badge className="bg-orange-500/20 text-orange-500 text-[10px] h-5 cursor-help">
                                          <AlertOctagon className="h-2.5 w-2.5 mr-1" />
                                          {q.campos_null.length} null
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <div className="text-xs space-y-1">
                                          {q.campos_null.map((c, i) => (
                                            <div key={i} className="text-orange-400">• {c}</div>
                                          ))}
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                                
                                {/* Metadados */}
                                {q.banca && (
                                  <Badge variant="outline" className={cn(
                                    "text-[10px] h-5",
                                    q.campos_inferidos.some(c => c.startsWith('banca:')) && "border-blue-500/50 bg-blue-500/10"
                                  )}>
                                    🏛️ {q.banca}
                                  </Badge>
                                )}
                                {q.ano && (
                                  <Badge variant="outline" className={cn(
                                    "text-[10px] h-5",
                                    q.campos_inferidos.some(c => c.startsWith('ano:')) && "border-blue-500/50 bg-blue-500/10"
                                  )}>
                                    📅 {q.ano}
                                  </Badge>
                                )}
                                {q.difficulty && (
                                  <Badge variant="outline" className="text-[10px] h-5">
                                    {q.difficulty === 'facil' && '🟢'}
                                    {q.difficulty === 'medio' && '🟡'}
                                    {q.difficulty === 'dificil' && '🔴'}
                                    {' '}{q.difficulty}
                                  </Badge>
                                )}
                              </div>
                              
                              <p className="text-sm line-clamp-2">
                                {q.question_text || <span className="text-red-500 italic">Enunciado vazio</span>}
                              </p>
                              
                              {/* Erros/Warnings */}
                              {(q.errors.length > 0 || q.warnings.length > 0) && (
                                <div className="mt-2 space-y-1">
                                  {q.errors.map((e, i) => (
                                    <div key={i} className="text-xs text-red-500 flex items-center gap-1">
                                      <XCircle className="h-3 w-3" />
                                      {e}
                                    </div>
                                  ))}
                                  {q.warnings.map((w, i) => (
                                    <div key={i} className="text-xs text-yellow-500 flex items-center gap-1">
                                      <AlertTriangle className="h-3 w-3" />
                                      {w}
                                    </div>
                                  ))}
                                </div>
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
                          
                          {/* Expanded view */}
                          {expandedQuestion === q.id && (
                            <div className="mt-4 pt-4 border-t space-y-3">
                              <div className="grid grid-cols-5 gap-2">
                                {q.options.map(opt => (
                                  <div
                                    key={opt.id}
                                    className={cn(
                                      "p-2 rounded text-xs",
                                      opt.id === q.correct_answer
                                        ? "bg-green-500/20 border border-green-500/30"
                                        : "bg-muted/50"
                                    )}
                                  >
                                    <span className="font-bold uppercase">{opt.id})</span>{' '}
                                    {opt.text || <span className="text-muted-foreground italic">vazio</span>}
                                  </div>
                                ))}
                              </div>
                              
                              {q.explanation && (
                                <div className="p-2 rounded bg-blue-500/10 text-xs">
                                  <strong>Explicação:</strong> {q.explanation}
                                </div>
                              )}
                              
                              <div className="flex flex-wrap gap-2 text-[10px]">
                                {q.nivel_cognitivo && (
                                  <Badge variant="secondary">🧠 {q.nivel_cognitivo}</Badge>
                                )}
                                {q.tempo_medio_segundos && (
                                  <Badge variant="secondary">⏱️ {q.tempo_medio_segundos}s</Badge>
                                )}
                                {q.origem && (
                                  <Badge variant="secondary">📌 {q.origem}</Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Footer com autorização */}
                <div className="p-4 border-t bg-background space-y-4">
                  {/* Checkbox de autorização explícita */}
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-primary/30 bg-primary/5">
                    <Checkbox
                      id="human-auth"
                      checked={humanAuthorization}
                      onCheckedChange={(checked) => {
                        setHumanAuthorization(checked === true);
                        if (checked) {
                          setFlowState('autorizacao_explicita');
                        } else {
                          setFlowState('validacao_humana_obrigatoria');
                        }
                      }}
                    />
                    <Label htmlFor="human-auth" className="text-sm cursor-pointer flex-1">
                      <span className="font-semibold text-primary">Autorizo a importação</span>
                      <span className="text-muted-foreground ml-1">
                        — Revisei as {stats.selected} questões selecionadas. Campos null permanecerão vazios. 
                        Questões serão importadas como <strong>RASCUNHO</strong> (inativas).
                      </span>
                    </Label>
                    <ShieldCheck className={cn(
                      "h-5 w-5 transition-colors",
                      humanAuthorization ? "text-green-500" : "text-muted-foreground"
                    )} />
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => { setUiStep('mapping'); setFlowState('arquivo_carregado'); }}>
                      <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
                      Voltar
                    </Button>
                    <Button
                      onClick={handleImport}
                      disabled={!canProcess}
                      className={cn(
                        "bg-gradient-to-r",
                        canProcess ? "from-green-600 to-emerald-600" : "from-gray-500 to-gray-600"
                      )}
                    >
                      {canProcess ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Importar {stats.selected} Questões como Rascunho
                        </>
                      ) : (
                        <>
                          <AlertOctagon className="h-4 w-4 mr-2" />
                          Autorização Necessária
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </div>
              </motion.div>
            )}

            {/* STEP 4: IMPORTING */}
            {uiStep === 'importing' && (
              <motion.div
                key="importing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center p-8"
              >
                <div className="w-full max-w-md text-center space-y-6">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 inline-block">
                    <Loader2 className="h-12 w-12 text-primary animate-spin" />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Importando Questões...</h3>
                    <p className="text-sm text-muted-foreground">
                      {stats.selected} questões sendo importadas como <strong>RASCUNHO</strong>
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Progress value={importProgress} className="h-2" />
                    <p className="text-sm font-mono">{importProgress}%</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
});
