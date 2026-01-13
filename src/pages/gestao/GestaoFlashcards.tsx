// ============================================
// 🧠 GESTÃO DE FLASHCARDS
// CRUD + Importação Inteligente
// Portal Aluno: /alunos/materiais (coleção Flash Cards)
// Estrutura: src/types/flashcards.ts (FONTE DA VERDADE)
// ============================================

import { memo, useState, useCallback, useMemo } from 'react';
import { 
  Brain, 
  Plus, 
  Upload, 
  Edit, 
  Trash2,
  Loader2,
  Search,
  Filter,
  MoreVertical,
  FileUp,
  RefreshCw,
  CheckCircle,
  Clock,
  Users,
  TrendingUp,
  Download,
  Copy,
  Eye,
  FileText,
  Sparkles,
  Target,
  BarChart3,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDropzone } from 'react-dropzone';
import JSZip from 'jszip';
import initSqlJs from 'sql.js';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Flashcard, 
  FlashcardState, 
  FlashcardDifficulty,
  FSRS_PARAMS,
  numberToDifficulty 
} from '@/types/flashcards';

// ============================================
// TIPOS LOCAIS
// ============================================

interface FlashcardAdmin extends Flashcard {
  profiles?: {
    nome: string | null;
    email: string | null;
  } | null;
}

interface ImportedCard {
  question: string;
  answer: string;
  tags?: string[];
  media?: string[]; // Arquivos de mídia referenciados (ex: [img:filename.jpg])
}

interface ApkgParseResult {
  cards: ImportedCard[];
  mediaMap: Map<string, Uint8Array>; // namespace/filename → blob
  deckName: string;
}

interface StatsData {
  total: number;
  byState: Record<FlashcardState, number>;
  bySource: Record<string, number>;
  totalUsers: number;
  avgDifficulty: number;
  avgReps: number;
}

// ============================================
// CONSTANTES
// ============================================

const STATE_BADGES: Record<FlashcardState, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  new: { label: 'Novo', variant: 'outline' },
  learning: { label: 'Aprendendo', variant: 'secondary' },
  review: { label: 'Revisão', variant: 'default' },
  relearning: { label: 'Reaprendendo', variant: 'destructive' },
};

const SOURCE_OPTIONS = [
  { value: 'manual', label: '✍️ Manual' },
  { value: 'import', label: '📥 Importado' },
  { value: 'ai', label: '🤖 IA' },
  { value: 'lesson', label: '📚 Aula' },
];

// ============================================
// PARSER APKG (ANKI) - FRONTEND
// ============================================

let sqlInitPromise: ReturnType<typeof initSqlJs> | null = null;

function getSql() {
  if (!sqlInitPromise) {
    sqlInitPromise = initSqlJs({
      // Evita problemas de bundler (Vite) com assets do sql.js
      locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
    });
  }
  return sqlInitPromise;
}

/**
 * Converte referências de imagem do Anki para token padronizado [img:namespace/filename]
 * Suporta: <img src="..."> e referências de Image Occlusion (BASE + MASK)
 * 
 * Image Occlusion no Anki Enhanced:
 * - BASE: imagem original (ex: image-occlusion-xxxxx.png)
 * - MASK: overlay SVG que esconde partes (ex: image-occlusion-xxxxx-Q.svg para pergunta)
 * - Na resposta: remove máscara ou mostra MASK-A
 */
function normalizeAnkiMedia(html: string, namespace = 'default'): { text: string; media: string[] } {
  const media: string[] = [];
  let text = html;
  
  // Extrai imagens: <img src="filename.jpg"> → [img:namespace/filename.jpg]
  text = text.replace(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi, (_, src) => {
    // Extrai apenas o nome do arquivo (sem path)
    const filename = src.split('/').pop() || src;
    const namespacedFile = `${namespace}/${filename}`;
    media.push(namespacedFile);
    return `[img:${namespacedFile}]`;
  });
  
  // Suporte a Image Occlusion Enhanced: detecta BASE e MASKs
  // Formato típico: {{c1::image-occlusion-xxx.svg}} ou referência direta
  // Marca com tipo: [img:namespace/filename|type=mask-q] para pergunta
  text = text.replace(/\{\{c(\d+)::([^}]*image-occlusion[^}]*)\}\}/gi, (_, clozeNum, mask) => {
    const namespacedFile = `${namespace}/${mask}`;
    media.push(namespacedFile);
    // Marcar como máscara de pergunta (cloze)
    return `[img:${namespacedFile}|type=mask-q|cloze=${clozeNum}]`;
  });
  
  return { text, media };
}

function stripHtml(html: string, namespace = 'default'): string {
  // Primeiro normaliza mídia
  const { text: withMedia } = normalizeAnkiMedia(html, namespace);
  
  return withMedia
    .replace(/<br\s*\/?>(?=\s|$)/gi, '\n')
    .replace(/<div[^>]*>/gi, '\n')
    .replace(/<\/div>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n+/g, '\n')
    .trim();
}

function sqlValueToString(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (value instanceof Uint8Array) return new TextDecoder().decode(value);
  return String(value);
}

/**
 * Parse campos do Anki COM suporte a mídia namespacada
 * Retorna front, back e lista de mídia
 */
function parseAnkiFieldsWithMedia(
  flds: string, 
  namespace: string, 
  cardOrd = 0
): { front: string; back: string; media: string[] } {
  const allMedia: string[] = [];
  
  // Anki separa campos por Unit Separator (\x1f)
  const rawParts = flds.split("\x1f");
  
  // Para Image Occlusion Enhanced, estrutura típica:
  // Campo 0: Imagem base com máscaras como cloze
  // Campo 1: (opcional) resposta adicional
  
  const processedParts = rawParts.map((p) => {
    const { text, media } = normalizeAnkiMedia(p || '', namespace);
    allMedia.push(...media);
    return text
      .replace(/<br\s*\/?>(?=\s|$)/gi, '\n')
      .replace(/<div[^>]*>/gi, '\n')
      .replace(/<\/div>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n+/g, '\n')
      .trim();
  }).filter(Boolean);

  const front = processedParts[0] || "";
  const back = processedParts[1] || "";

  return { front, back, media: allMedia };
}

// Mantém versão simples para compatibilidade
function parseAnkiFields(flds: string): { front: string; back: string } {
  const { front, back } = parseAnkiFieldsWithMedia(flds, 'default', 0);
  return { front, back };
}

async function parseApkgToCards(file: File): Promise<ApkgParseResult> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  // Procurar banco de dados - Anki pode usar diferentes nomes
  // Preferir collection.anki21 (formato mais novo) quando existir
  let dbObj = zip.file('collection.anki21') || zip.file('collection.anki2');
  // Fallback para qualquer arquivo .anki2 ou .anki21
  if (!dbObj) {
    dbObj = Object.values(zip.files).find((f) => 
      !f.dir && (f.name.endsWith('.anki2') || f.name.endsWith('.anki21'))
    ) || null;
  }

  if (!dbObj) {
    const files = Object.keys(zip.files).join(', ');
    console.error('[APKG] Arquivos no ZIP:', files);
    throw new Error(`Formato de arquivo não reconhecido. Arquivos encontrados: ${files}`);
  }

  console.log('[APKG] Usando banco:', dbObj.name);
  const dbData = await dbObj.async('uint8array');
  const SQL = await getSql();
  const db = new SQL.Database(dbData);

  const cards: ImportedCard[] = [];
  const seenCardKeys = new Set<string>();
  const mediaMap = new Map<string, Uint8Array>();
  
  // =============================================
  // EXTRAIR NAMESPACE DO DECK (para organizar mídia)
  // =============================================
  let deckName = 'default';
  try {
    const colResult = db.exec(`SELECT decks FROM col LIMIT 1`);
    if (colResult.length > 0 && colResult[0].values.length > 0) {
      const decksJson = sqlValueToString(colResult[0].values[0][0]);
      const decks = JSON.parse(decksJson);
      const firstDeck = Object.values(decks).find((d: any) => d.name && d.name !== 'Default') as any;
      if (firstDeck?.name) {
        deckName = firstDeck.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '')
          .slice(0, 50) || 'default';
      }
    }
  } catch (e) {
    console.warn('[APKG] Não foi possível extrair nome do deck:', e);
  }
  
  console.log('[APKG] Namespace de mídia:', deckName);

  // =============================================
  // EXTRAIR MAPA DE MÍDIA DO APKG
  // O arquivo "media" mapeia IDs numéricos para nomes reais
  // Ex: {"0": "image1.png", "1": "audio.mp3"}
  // =============================================
  let ankiMediaMapping: Record<string, string> = {};
  try {
    const mediaFile = zip.file('media');
    if (mediaFile) {
      const mediaJson = await mediaFile.async('string');
      ankiMediaMapping = JSON.parse(mediaJson);
      console.log(`[APKG] Mapa de mídia encontrado: ${Object.keys(ankiMediaMapping).length} arquivos`);
    }
  } catch (e) {
    console.warn('[APKG] Não foi possível ler mapa de mídia:', e);
  }

  // =============================================
  // EXTRAIR BLOBS DE MÍDIA
  // Arquivos na raiz do ZIP com nomes numéricos (0, 1, 2...)
  // =============================================
  const referencedMedia = new Set<string>();
  
  try {
    // =============================================
    // CRÍTICO: FSRS opera por CARD, não por NOTE
    // Uma note pode gerar múltiplos cards (cloze c1, c2, c3...)
    // A query DEVE expandir por card, SEM GROUP BY
    // =============================================
    
    const queries = [
      // Query principal: expande por CARD (cada card = 1 flashcard FSRS)
      // ord = índice do card dentro da note (para cloze: c1=0, c2=1, etc)
      `SELECT c.id as card_id, c.ord, n.flds, n.tags 
       FROM cards c 
       JOIN notes n ON n.id = c.nid 
       ORDER BY c.id 
       LIMIT 50000`,
      // Fallback: notes direto (decks simples sem múltiplos cards por note)
      `SELECT flds, tags FROM notes ORDER BY id LIMIT 25000`,
      // Fallback alternativo
      `SELECT sfld, tags FROM notes ORDER BY id LIMIT 25000`,
    ];

    for (const q of queries) {
      try {
        const result = db.exec(q);
        if (result.length === 0) continue;

        const hasCardInfo = q.includes('card_id');
        console.log(`[APKG] Query ${hasCardInfo ? 'CARDS' : 'NOTES'} retornou ${result[0].values.length} linhas`);

        for (const row of result[0].values) {
          let flds: string, tags: string, cardOrd = 0;
          
          if (hasCardInfo) {
            // card_id, ord, flds, tags
            cardOrd = Number(row[1]) || 0;
            flds = sqlValueToString(row[2]);
            tags = sqlValueToString(row[3]).trim();
          } else {
            flds = sqlValueToString(row[0]);
            tags = sqlValueToString(row[1]).trim();
          }
          
          const { front, back, media } = parseAnkiFieldsWithMedia(flds, deckName, cardOrd);
          
          // Registra mídia referenciada
          media.forEach(m => referencedMedia.add(m));
          
          // Chave única: combina pergunta + ordinal do card (para cloze diferentes)
          const cardKey = `${front.toLowerCase().slice(0, 200)}::${cardOrd}`;
          
          if (front && !seenCardKeys.has(cardKey)) {
            seenCardKeys.add(cardKey);
            cards.push({
              question: front.slice(0, 2000),
              answer: (back || front).slice(0, 5000),
              tags: tags ? tags.split(' ').filter(Boolean) : undefined,
              media: media.length > 0 ? media : undefined,
            });
          }
        }

        if (cards.length > 0) {
          console.log(`[APKG] ✅ Total de ${cards.length} CARDS únicos extraídos (FSRS-ready)`);
          break;
        }
      } catch (queryError) {
        console.warn('[APKG] Query falhou:', q.slice(0, 40), queryError);
      }
    }
  } finally {
    db.close();
  }

  // =============================================
  // EXTRAIR BLOBS APENAS DE MÍDIA REFERENCIADA
  // =============================================
  const neededFilenames = new Set<string>();
  referencedMedia.forEach(ref => {
    // ref = "deckname/filename.jpg" → extrair filename.jpg
    const filename = ref.split('/').pop();
    if (filename) neededFilenames.add(filename);
  });

  console.log(`[APKG] Mídia referenciada: ${neededFilenames.size} arquivos únicos`);

  // Mapear nome → ID para busca reversa
  const filenameToId: Record<string, string> = {};
  Object.entries(ankiMediaMapping).forEach(([id, filename]) => {
    filenameToId[filename] = id;
  });

  // Extrair blobs necessários
  for (const filename of neededFilenames) {
    const mediaId = filenameToId[filename];
    if (!mediaId) {
      console.warn(`[APKG] Mídia não encontrada no mapa: ${filename}`);
      continue;
    }

    const mediaFile = zip.file(mediaId);
    if (mediaFile) {
      try {
        const blob = await mediaFile.async('uint8array');
        const namespacedPath = `${deckName}/${filename}`;
        mediaMap.set(namespacedPath, blob);
      } catch (e) {
        console.warn(`[APKG] Erro ao extrair mídia ${filename}:`, e);
      }
    }
  }

  console.log(`[APKG] ✅ ${mediaMap.size} arquivos de mídia extraídos para upload`);

  if (cards.length === 0) {
    throw new Error('Nenhum flashcard encontrado. Verifique se o arquivo APKG está correto.');
  }

  const firstQ = (cards[0]?.question || '').toLowerCase();
  if (cards.length === 1 && firstQ.includes('atualize para a versão mais recente')) {
    throw new Error(
      'Esse APKG foi exportado no formato novo do Anki e vira um "placeholder".\n\nNo Anki, ao exportar, marque: "Suporta versões antigas do Anki (lento/arquivos grandes)".\nDepois exporte novamente como .apkg (com "Incluir mídia").'
    );
  }

  return { cards, mediaMap, deckName };
}

// ============================================
// HOOKS DE DADOS
// ============================================


// Hook para buscar aulas disponíveis
function useLessonsForSelect() {
  return useQuery({
    queryKey: ['lessons-for-flashcards'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          id,
          title,
          area_id,
          areas:area_id (
            id,
            name
          )
        `)
        .order('title');
      
      if (error) throw error;
      return data as { id: string; title: string; area_id: string | null; areas: { id: string; name: string } | null }[];
    },
    staleTime: 60_000,
  });
}

function useFlashcardsAdmin() {
  return useQuery({
    queryKey: ['flashcards-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('study_flashcards')
        .select(`
          *,
          profiles:user_id (
            nome,
            email
          ),
          lessons:lesson_id (
            id,
            title
          )
        `)
        .order('created_at', { ascending: false })
        .limit(500);
      
      if (error) throw error;
      return data as (FlashcardAdmin & { lessons?: { id: string; title: string } | null })[];
    },
    staleTime: 30_000,
  });
}

function useFlashcardsStats() {
  return useQuery({
    queryKey: ['flashcards-stats-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('study_flashcards')
        .select('state, source, difficulty, reps, user_id');
      
      if (error) throw error;
      
      const stats: StatsData = {
        total: data.length,
        byState: { new: 0, learning: 0, review: 0, relearning: 0 },
        bySource: {},
        totalUsers: new Set(data.map(d => d.user_id)).size,
        avgDifficulty: 0,
        avgReps: 0,
      };

      let totalDiff = 0;
      let totalReps = 0;

      data.forEach(card => {
        const state = (card.state || 'new') as FlashcardState;
        stats.byState[state] = (stats.byState[state] || 0) + 1;
        
        const source = card.source || 'manual';
        stats.bySource[source] = (stats.bySource[source] || 0) + 1;
        
        totalDiff += card.difficulty || 0.5;
        totalReps += card.reps || 0;
      });

      if (data.length > 0) {
        stats.avgDifficulty = totalDiff / data.length;
        stats.avgReps = totalReps / data.length;
      }

      return stats;
    },
    staleTime: 60_000,
  });
}

// ============================================
// COMPONENTE: MODAL DE CRIAÇÃO/EDIÇÃO
// ============================================

interface FlashcardFormProps {
  open: boolean;
  onClose: () => void;
  flashcard?: FlashcardAdmin | null;
  onSuccess: () => void;
}

const FlashcardFormDialog = memo(function FlashcardFormDialog({ 
  open, 
  onClose, 
  flashcard, 
  onSuccess 
}: FlashcardFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: lessons = [] } = useLessonsForSelect();
  const [form, setForm] = useState({
    question: flashcard?.question || '',
    answer: flashcard?.answer || '',
    source: flashcard?.source || 'manual',
    tags: flashcard?.tags?.join(', ') || '',
    lesson_id: flashcard?.lesson_id || '',
    area_id: flashcard?.area_id || '',
  });

  const isEditing = !!flashcard;

  // Agrupa aulas por área para melhor navegação
  const lessonsByArea = useMemo(() => {
    const grouped: Record<string, { areaName: string; lessons: typeof lessons }> = {};
    
    lessons.forEach(lesson => {
      const areaId = lesson.areas?.id || 'sem-area';
      const areaName = lesson.areas?.name || 'Sem Área';
      
      if (!grouped[areaId]) {
        grouped[areaId] = { areaName, lessons: [] };
      }
      grouped[areaId].lessons.push(lesson);
    });
    
    return grouped;
  }, [lessons]);

  const handleSubmit = async () => {
    if (!form.question.trim() || !form.answer.trim()) {
      toast.error('Preencha pergunta e resposta');
      return;
    }

    setIsSubmitting(true);
    try {
      const tagsArray = form.tags
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      // Encontra a área da aula selecionada
      const selectedLesson = lessons.find(l => l.id === form.lesson_id);
      const areaId = selectedLesson?.area_id || form.area_id || null;

      if (isEditing) {
        const { error } = await supabase
          .from('study_flashcards')
          .update({
            question: form.question,
            answer: form.answer,
            source: form.source,
            tags: tagsArray.length > 0 ? tagsArray : null,
            lesson_id: form.lesson_id || null,
            area_id: areaId,
          })
          .eq('id', flashcard.id);
        
        if (error) throw error;
        toast.success('Flashcard atualizado!');
      } else {
        // Criar para o owner (será visível para todos no modo global)
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Não autenticado');

        const { error } = await supabase
          .from('study_flashcards')
          .insert({
            user_id: user.id,
            question: form.question,
            answer: form.answer,
            source: form.source,
            tags: tagsArray.length > 0 ? tagsArray : null,
            lesson_id: form.lesson_id || null,
            area_id: areaId,
            due_date: new Date().toISOString().split('T')[0],
            stability: FSRS_PARAMS.initialStability[0],
            difficulty: 0.5,
            state: 'new',
            reps: 0,
            lapses: 0,
            elapsed_days: 0,
            scheduled_days: 0,
          });
        
        if (error) throw error;
        toast.success('Flashcard criado!');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            {isEditing ? 'Editar Flashcard' : 'Novo Flashcard'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Atualize o conteúdo do flashcard'
              : 'Crie um novo flashcard para os alunos estudarem'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="question">Pergunta (Frente)</Label>
            <Textarea
              id="question"
              placeholder="Digite a pergunta..."
              value={form.question}
              onChange={(e) => setForm(f => ({ ...f, question: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="answer">Resposta (Verso)</Label>
            <Textarea
              id="answer"
              placeholder="Digite a resposta..."
              value={form.answer}
              onChange={(e) => setForm(f => ({ ...f, answer: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Seletor de Aula */}
          <div className="space-y-2">
            <Label>Vincular a Aula (opcional)</Label>
            <Select 
              value={form.lesson_id} 
              onValueChange={(v) => setForm(f => ({ ...f, lesson_id: v === 'none' ? '' : v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma aula..." />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="none">📌 Sem vínculo</SelectItem>
                {Object.entries(lessonsByArea).map(([areaId, { areaName, lessons: areaLessons }]) => (
                  <div key={areaId}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                      📚 {areaName}
                    </div>
                    {areaLessons.map(lesson => (
                      <SelectItem key={lesson.id} value={lesson.id}>
                        {lesson.title}
                      </SelectItem>
                    ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Vincule o flashcard a uma aula específica para organização
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Origem</Label>
              <Select 
                value={form.source} 
                onValueChange={(v) => setForm(f => ({ ...f, source: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
              <Input
                id="tags"
                placeholder="química, orgânica, ..."
                value={form.tags}
                onChange={(e) => setForm(f => ({ ...f, tags: e.target.value }))}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEditing ? 'Salvar' : 'Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

// ============================================
// COMPONENTE: MODAL DE IMPORTAÇÃO
// ============================================

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ImportDialog = memo(function ImportDialog({ open, onClose, onSuccess }: ImportDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedCards, setParsedCards] = useState<ImportedCard[]>([]);
  const [rawText, setRawText] = useState('');
  const [step, setStep] = useState<'upload' | 'preview' | 'importing'>('upload');
  const [importProgress, setImportProgress] = useState(0);
  const [selectedLessonId, setSelectedLessonId] = useState<string>('none');
  const [processingApkg, setProcessingApkg] = useState(false);
  const [apkgMediaMap, setApkgMediaMap] = useState<Map<string, Uint8Array>>(new Map());
  const [apkgDeckName, setApkgDeckName] = useState<string>('');
  const { data: lessons = [] } = useLessonsForSelect();

  // Processa arquivo APKG localmente (frontend)
  const processApkgFile = useCallback(async (file: File) => {
    setProcessingApkg(true);
    toast.info('Processando arquivo Anki... Isso pode levar alguns segundos.');

    try {
      const result = await parseApkgToCards(file);

      if (result.cards.length > 0) {
        setParsedCards(result.cards);
        setApkgMediaMap(result.mediaMap);
        setApkgDeckName(result.deckName);
        setStep('preview');
        const mediaCount = result.mediaMap.size;
        toast.success(`${result.cards.length} flashcards extraídos do Anki!${mediaCount > 0 ? ` (${mediaCount} mídias)` : ''}`);
      } else {
        toast.error('Nenhum flashcard encontrado no arquivo');
      }
    } catch (error: any) {
      console.error('Erro ao processar APKG:', error);
      toast.error(error?.message || 'Erro ao processar arquivo Anki');
    } finally {
      setProcessingApkg(false);
    }
  }, []);


  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
      'application/json': ['.json'],
      'application/octet-stream': ['.apkg'],
      'application/zip': ['.apkg'],
    },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024, // 100MB para APKG
    onDrop: async (files) => {
      if (files[0]) {
        const file = files[0];
        const isApkg = file.name.toLowerCase().endsWith('.apkg');
        
        if (isApkg) {
          await processApkgFile(file);
        } else {
          const text = await file.text();
          processText(text);
        }
      }
    },
  });

  const processText = useCallback((text: string) => {
    setRawText(text);
    const cards: ImportedCard[] = [];

    // Tenta detectar formato
    const lines = text.trim().split('\n');
    
    // Formato JSON
    if (text.trim().startsWith('[') || text.trim().startsWith('{')) {
      try {
        const json = JSON.parse(text);
        const items = Array.isArray(json) ? json : [json];
        items.forEach((item: any) => {
          if (item.question && item.answer) {
            cards.push({
              question: item.question,
              answer: item.answer,
              tags: item.tags,
            });
          } else if (item.front && item.back) {
            cards.push({
              question: item.front,
              answer: item.back,
              tags: item.tags,
            });
          }
        });
      } catch {
        toast.error('JSON inválido');
      }
    }
    // Formato CSV (pergunta;resposta ou pergunta,resposta)
    else if (lines[0].includes(';') || lines[0].includes(',')) {
      const separator = lines[0].includes(';') ? ';' : ',';
      lines.forEach(line => {
        const parts = line.split(separator).map(p => p.trim().replace(/^"|"$/g, ''));
        if (parts.length >= 2 && parts[0] && parts[1]) {
          cards.push({
            question: parts[0],
            answer: parts[1],
            tags: parts[2]?.split(',').map(t => t.trim()).filter(Boolean),
          });
        }
      });
    }
    // Formato Q&A (Q: ... A: ...)
    else if (text.toLowerCase().includes('q:') || text.toLowerCase().includes('pergunta:')) {
      const blocks = text.split(/(?=q:|pergunta:)/gi);
      blocks.forEach(block => {
        const qMatch = block.match(/(?:q:|pergunta:)\s*(.+?)(?=a:|resposta:|$)/is);
        const aMatch = block.match(/(?:a:|resposta:)\s*(.+)/is);
        if (qMatch && aMatch) {
          cards.push({
            question: qMatch[1].trim(),
            answer: aMatch[1].trim(),
          });
        }
      });
    }
    // Formato linha dupla (pergunta na linha 1, resposta na linha 2, linha em branco)
    else {
      for (let i = 0; i < lines.length; i += 3) {
        if (lines[i]?.trim() && lines[i + 1]?.trim()) {
          cards.push({
            question: lines[i].trim(),
            answer: lines[i + 1].trim(),
          });
        }
      }
    }

    if (cards.length === 0) {
      toast.error('Nenhum flashcard detectado. Use formato: Q: pergunta A: resposta');
      return;
    }

    setParsedCards(cards);
    setStep('preview');
    toast.success(`${cards.length} flashcards detectados!`);
  }, []);

  const handleImport = async () => {
    if (parsedCards.length === 0) return;

    setStep('importing');
    setIsProcessing(true);
    setImportProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const totalOps = (apkgMediaMap.size || 0) + parsedCards.length;
      let doneOps = 0;

      // =============================================
      // UPLOAD DE MÍDIA PARA O BUCKET 'materiais'
      // Faz upload de todas as imagens extraídas do APKG
      // =============================================
      if (apkgMediaMap.size > 0) {
        console.log(`[APKG] Iniciando upload de ${apkgMediaMap.size} arquivos de mídia...`);
        let mediaUploaded = 0;
        const mediaTotal = apkgMediaMap.size;

        for (const [path, blob] of apkgMediaMap) {
          try {
            // Determinar MIME type
            const ext = path.split('.').pop()?.toLowerCase() || '';
            const mimeTypes: Record<string, string> = {
              jpg: 'image/jpeg',
              jpeg: 'image/jpeg',
              png: 'image/png',
              gif: 'image/gif',
              webp: 'image/webp',
              svg: 'image/svg+xml',
              mp3: 'audio/mpeg',
              wav: 'audio/wav',
              ogg: 'audio/ogg',
            };
            const contentType = mimeTypes[ext] || 'application/octet-stream';

            // Upload para bucket 'materiais' com path: flashcards/deckname/filename
            const storagePath = `flashcards/${path}`;

            const { error: uploadError } = await supabase.storage
              .from('materiais')
              .upload(storagePath, blob, {
                contentType,
                upsert: true, // Substitui se já existir
              });

            if (uploadError) {
              console.warn(`[APKG] Erro ao fazer upload de ${path}:`, uploadError.message);
            } else {
              mediaUploaded++;
            }
          } catch (e) {
            console.warn(`[APKG] Falha ao processar ${path}:`, e);
          } finally {
            doneOps++;
            setImportProgress(Math.max(1, Math.round((doneOps / totalOps) * 100)));
          }
        }

        console.log(`[APKG] ✅ Upload concluído: ${mediaUploaded}/${mediaTotal} arquivos`);
        if (mediaUploaded > 0) {
          toast.info(`${mediaUploaded} mídias enviadas para o storage`);
        }
      }

      const batchSize = 50;
      let imported = 0;

      for (let i = 0; i < parsedCards.length; i += batchSize) {
        const selectedLesson = lessons.find(l => l.id === selectedLessonId);
        const areaId = selectedLesson?.area_id || null;

        const batch = parsedCards.slice(i, i + batchSize).map(card => ({
          user_id: user.id,
          question: card.question,
          answer: card.answer,
          source: 'import',
          tags: card.tags || null,
          lesson_id: selectedLessonId === 'none' ? null : selectedLessonId,
          area_id: areaId,
          due_date: new Date().toISOString().split('T')[0],
          stability: FSRS_PARAMS.initialStability[0],
          difficulty: 0.5,
          state: 'new',
          reps: 0,
          lapses: 0,
          elapsed_days: 0,
          scheduled_days: 0,
        }));

        const { error } = await supabase
          .from('study_flashcards')
          .insert(batch);

        if (error) throw error;

        imported += batch.length;
        doneOps += batch.length;
        setImportProgress(Math.round((doneOps / totalOps) * 100));
      }

      toast.success(`${parsedCards.length} flashcards importados com sucesso!`);
      onSuccess();
      handleReset();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Erro na importação');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setParsedCards([]);
    setRawText('');
    setStep('upload');
    setImportProgress(0);
    setApkgMediaMap(new Map());
    setApkgDeckName('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Importar Flashcards
          </DialogTitle>
          <DialogDescription>
            Importe flashcards de arquivos <strong>APKG (Anki)</strong>, TXT, CSV ou JSON
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4 py-4">
            {processingApkg && (
              <div className="p-6 bg-primary/5 rounded-lg text-center">
                <Loader2 className="w-10 h-10 mx-auto text-primary animate-spin mb-3" />
                <p className="text-lg font-medium">Processando arquivo Anki...</p>
                <p className="text-sm text-muted-foreground">Extraindo flashcards do banco de dados</p>
              </div>
            )}
            
            {!processingApkg && (
              <>
                <div
                  {...getRootProps()}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                    isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
                  )}
                >
                  <input {...getInputProps()} />
                  <FileUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">
                    {isDragActive ? 'Solte o arquivo aqui' : 'Arraste um arquivo ou clique'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Suporta: <strong>APKG (Anki)</strong>, TXT, CSV, JSON
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Máximo: 100MB
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">ou cole o texto</span>
                  </div>
                </div>

                <Textarea
                  placeholder="Cole aqui o conteúdo...&#10;&#10;Formatos aceitos:&#10;• Q: pergunta A: resposta&#10;• pergunta;resposta&#10;• JSON: [{question, answer}]&#10;• Linha dupla (pergunta, resposta, linha em branco)"
                  rows={6}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                />

                <Button 
                  onClick={() => processText(rawText)} 
                  disabled={!rawText.trim()}
                  className="w-full"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Processar Texto
                </Button>
              </>
            )}
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="text-base px-3 py-1">
                {parsedCards.length} flashcards detectados
              </Badge>
              <Button variant="ghost" size="sm" onClick={handleReset}>
                <RefreshCw className="w-4 h-4 mr-1" />
                Recomeçar
              </Button>
            </div>

            {/* Seletor de Aula (opcional) */}
            <div className="p-3 bg-muted/50 rounded-lg border">
              <Label className="text-sm font-medium mb-2 block">
                📚 Vincular a uma Aula (opcional)
              </Label>
              <Select value={selectedLessonId} onValueChange={setSelectedLessonId}>
                <SelectTrigger>
                  <SelectValue placeholder="Nenhuma aula selecionada" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="none">Nenhuma (flashcards avulsos)</SelectItem>
                  {lessons.map(lesson => (
                    <SelectItem key={lesson.id} value={lesson.id}>
                      {lesson.areas?.name ? `[${lesson.areas.name}] ` : ''}
                      {lesson.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Ao vincular a uma aula, o aluno verá esses flashcards na aba de estudos da aula
              </p>
            </div>

            <div className="max-h-52 overflow-y-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Pergunta</TableHead>
                    <TableHead>Resposta</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedCards.slice(0, 20).map((card, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{card.question}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{card.answer}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {parsedCards.length > 20 && (
                <p className="text-center text-sm text-muted-foreground py-2">
                  ... e mais {parsedCards.length - 20} flashcards
                </p>
              )}
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="py-8 space-y-4">
            <div className="text-center">
              <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin mb-4" />
              <p className="text-lg font-medium">Importando flashcards...</p>
              <p className="text-sm text-muted-foreground">{importProgress}%</p>
            </div>
            <Progress value={importProgress} className="h-2" />
          </div>
        )}

        <DialogFooter>
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={handleReset}>
                Voltar
              </Button>
              <Button onClick={handleImport}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Importar {parsedCards.length} Flashcards
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

// ============================================
// COMPONENTE: PREVIEW DE FLASHCARD
// ============================================

interface PreviewDialogProps {
  open: boolean;
  onClose: () => void;
  flashcard: FlashcardAdmin | null;
}

const PreviewDialog = memo(function PreviewDialog({ open, onClose, flashcard }: PreviewDialogProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  if (!flashcard) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            Visualizar Flashcard
          </DialogTitle>
        </DialogHeader>

        <div 
          className="min-h-[200px] p-6 bg-gradient-to-br from-card to-muted rounded-xl border cursor-pointer flex flex-col items-center justify-center text-center"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
            {isFlipped ? 'Resposta' : 'Pergunta'}
          </p>
          <p className="text-lg font-medium">
            {isFlipped ? flashcard.answer : flashcard.question}
          </p>
          <p className="text-xs text-muted-foreground mt-4">
            👆 Clique para virar
          </p>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Estado: <Badge variant={STATE_BADGES[flashcard.state as FlashcardState]?.variant || 'outline'}>
            {STATE_BADGES[flashcard.state as FlashcardState]?.label || flashcard.state}
          </Badge></span>
          <span>Reps: {flashcard.reps}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
});

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const GestaoFlashcards = memo(function GestaoFlashcards() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterState, setFilterState] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [filterLesson, setFilterLesson] = useState<string>('all');
  
  // Modais
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<FlashcardAdmin | null>(null);
  const [previewCard, setPreviewCard] = useState<FlashcardAdmin | null>(null);
  const [deletingCard, setDeletingCard] = useState<FlashcardAdmin | null>(null);
  const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  // Dados
  const { data: flashcards, isLoading, refetch } = useFlashcardsAdmin();
  const { data: stats } = useFlashcardsStats();
  const { data: lessons = [] } = useLessonsForSelect();

  // Filtrar flashcards
  const filteredCards = useMemo(() => {
    if (!flashcards) return [];
    
    return flashcards.filter(card => {
      // Busca
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!card.question.toLowerCase().includes(query) && 
            !card.answer.toLowerCase().includes(query)) {
          return false;
        }
      }
      
      // Estado
      if (filterState !== 'all' && card.state !== filterState) {
        return false;
      }
      
      // Origem
      if (filterSource !== 'all' && card.source !== filterSource) {
        return false;
      }

      // Aula
      if (filterLesson !== 'all') {
        if (filterLesson === 'no-lesson' && card.lesson_id) return false;
        if (filterLesson !== 'no-lesson' && card.lesson_id !== filterLesson) return false;
      }
      
      return true;
    });
  }, [flashcards, searchQuery, filterState, filterSource, filterLesson]);

  // Deletar flashcard
  const handleDelete = async () => {
    if (!deletingCard) return;

    try {
      const { error } = await supabase
        .from('study_flashcards')
        .delete()
        .eq('id', deletingCard.id);

      if (error) throw error;

      toast.success('Flashcard excluído');
      setDeletingCard(null);
      refetch();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir');
    }
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['flashcards-admin'] });
    queryClient.invalidateQueries({ queryKey: ['flashcards-stats-admin'] });
    toast.success('Dados atualizados!');
  };

  // =============================================
  // EXCLUIR TODOS OS FLASHCARDS (NUCLEAR)
  // =============================================
  const handleDeleteAll = async () => {
    setIsDeletingAll(true);
    
    try {
      // 1. Excluir todos da tabela study_flashcards
      const { error: flashcardsError } = await supabase
        .from('study_flashcards')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Deleta tudo (workaround para delete all)
      
      if (flashcardsError) throw flashcardsError;

      // 2. Invalidar caches relacionados
      queryClient.invalidateQueries({ queryKey: ['flashcards-admin'] });
      queryClient.invalidateQueries({ queryKey: ['flashcards-stats-admin'] });
      queryClient.invalidateQueries({ queryKey: ['flashcards'] });
      queryClient.invalidateQueries({ queryKey: ['flashcard-analytics'] });
      queryClient.invalidateQueries({ queryKey: ['study-flashcards'] });
      
      toast.success(`✅ Todos os flashcards foram excluídos com sucesso!`);
      setIsDeleteAllOpen(false);
      refetch();
    } catch (error: any) {
      console.error('Erro ao excluir flashcards:', error);
      toast.error(error.message || 'Erro ao excluir flashcards');
    } finally {
      setIsDeletingAll(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <Brain className="w-8 h-8 text-primary" />
              Gestão de Flashcards
            </h1>
            <p className="text-muted-foreground mt-1">
              CRUD + Importação → Portal Aluno: /alunos/materiais (Flash Cards)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => setIsDeleteAllOpen(true)}
              disabled={isDeletingAll}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir Todos
            </Button>
            <Button variant="outline" onClick={() => setIsImportOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Importar
            </Button>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Flashcard
            </Button>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Brain className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.total || 0}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.byState.review || 0}</p>
                  <p className="text-xs text-muted-foreground">Em Revisão</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Sparkles className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.byState.new || 0}</p>
                  <p className="text-xs text-muted-foreground">Novos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Users className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
                  <p className="text-xs text-muted-foreground">Alunos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Target className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.avgReps.toFixed(1) || '0'}</p>
                  <p className="text-xs text-muted-foreground">Média Reps</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar pergunta ou resposta..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={filterState} onValueChange={setFilterState}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos estados</SelectItem>
                  <SelectItem value="new">Novo</SelectItem>
                  <SelectItem value="learning">Aprendendo</SelectItem>
                  <SelectItem value="review">Revisão</SelectItem>
                  <SelectItem value="relearning">Reaprendendo</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterSource} onValueChange={setFilterSource}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Origem" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas origens</SelectItem>
                  {SOURCE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterLesson} onValueChange={setFilterLesson}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Aula" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="all">Todas aulas</SelectItem>
                  <SelectItem value="no-lesson">📌 Sem vínculo</SelectItem>
                  {lessons.map(lesson => (
                    <SelectItem key={lesson.id} value={lesson.id}>
                      {lesson.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabela */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" />
                <p className="text-muted-foreground mt-2">Carregando flashcards...</p>
              </div>
            ) : filteredCards.length === 0 ? (
              <div className="p-8 text-center">
                <Brain className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium">Nenhum flashcard encontrado</p>
                <p className="text-muted-foreground">Crie ou importe flashcards para começar</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[35%]">Pergunta</TableHead>
                    <TableHead className="w-[20%]">Resposta</TableHead>
                    <TableHead>Aula</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Reps</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCards.map((card) => (
                    <TableRow key={card.id}>
                      <TableCell className="max-w-[280px]">
                        <p className="truncate font-medium">{card.question}</p>
                        {card.tags && card.tags.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {card.tags.slice(0, 2).map((tag, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[180px]">
                        <p className="truncate text-muted-foreground">{card.answer}</p>
                      </TableCell>
                      <TableCell>
                        {(card as any).lessons?.title ? (
                          <span className="text-sm text-primary truncate max-w-[120px] block">
                            📚 {(card as any).lessons.title}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATE_BADGES[card.state as FlashcardState]?.variant || 'outline'}>
                          {STATE_BADGES[card.state as FlashcardState]?.label || card.state}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {SOURCE_OPTIONS.find(s => s.value === card.source)?.label || card.source}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{card.reps}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setPreviewCard(card)}>
                              <Eye className="w-4 h-4 mr-2" />
                              Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setEditingCard(card)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => setDeletingCard(card)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Rodapé com contagem */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Exibindo {filteredCards.length} de {flashcards?.length || 0} flashcards</span>
          <span>Portal Aluno: /alunos/materiais → Flash Cards</span>
        </div>
      </div>

      {/* Modais */}
      <FlashcardFormDialog
        open={isCreateOpen || !!editingCard}
        onClose={() => { setIsCreateOpen(false); setEditingCard(null); }}
        flashcard={editingCard}
        onSuccess={refetch}
      />

      <ImportDialog
        open={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={refetch}
      />

      <PreviewDialog
        open={!!previewCard}
        onClose={() => setPreviewCard(null)}
        flashcard={previewCard}
      />

      {/* Dialog de confirmação de exclusão individual */}
      <Dialog open={!!deletingCard} onOpenChange={() => setDeletingCard(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Flashcard?</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. O flashcard será removido permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingCard(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de exclusão TOTAL */}
      <Dialog open={isDeleteAllOpen} onOpenChange={setIsDeleteAllOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              EXCLUIR TODOS OS FLASHCARDS?
            </DialogTitle>
            <DialogDescription className="space-y-2">
              <p className="font-semibold text-destructive">
                ⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL!
              </p>
              <p>
                Serão excluídos <strong>{stats?.total || 0} flashcards</strong> de todos os usuários, 
                incluindo todo o histórico de revisões FSRS.
              </p>
              <p>
                Dados que serão perdidos:
              </p>
              <ul className="list-disc list-inside text-sm text-muted-foreground">
                <li>Todos os flashcards da tabela study_flashcards</li>
                <li>Histórico de repetição espaçada (FSRS)</li>
                <li>Progresso de todos os alunos</li>
                <li>Estatísticas de revisão</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDeleteAllOpen(false)} disabled={isDeletingAll}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteAll} disabled={isDeletingAll}>
              {isDeletingAll ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  SIM, EXCLUIR TODOS
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

export default GestaoFlashcards;
