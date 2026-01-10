// ============================================
// 📚 LIVROS DO MOISA - Gestão de Livros Web
// Área do Owner para gerenciar livros
// ============================================

import { memo, useState, useCallback, useEffect, useMemo } from 'react';
import { 
  BookOpen, 
  Plus, 
  Upload, 
  Edit, 
  Archive, 
  Eye, 
  Trash2,
  Loader2,
  Search,
  Filter,
  MoreVertical,
  FileUp,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  Tag
} from 'lucide-react';

// DnD Kit para arrastar e reordenar
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

// Componentes de edição inline e linha arrastável
import { SortableBookRow, PDFReplacementUploader } from '@/components/gestao/livros-web';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { TagInput } from '@/components/ui/tag-input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDropzone } from 'react-dropzone';
import { useCacheManager } from '@/hooks/useCacheManager';
import { WebBookViewer } from '@/components/books';

// ============================================
// TIPOS
// ============================================

interface WebBookAdmin {
  id: string;
  title: string;
  subtitle?: string;
  category: string;
  status: string;
  total_pages: number;
  created_at: string;
  updated_at: string;
  view_count: number;
  unique_readers: number;
  cover_url?: string | null;
  cover_path?: string | null;
  description?: string;
  tags?: string[];
  original_filename?: string;
}

// ============================================
// CATEGORIAS
// ============================================

const CATEGORIES = [
  { value: 'quimica_geral', label: '⚗️ Química Geral' },
  { value: 'quimica_organica', label: '🧪 Química Orgânica' },
  { value: 'fisico_quimica', label: '📊 Físico-Química' },
  { value: 'revisao_ciclica', label: '🔄 Revisão Cíclica' },
  { value: 'previsao_final', label: '🎯 Previsão Final' },
  { value: 'exercicios', label: '✏️ Exercícios' },
  { value: 'simulados', label: '📝 Simulados' },
  { value: 'resumos', label: '📋 Resumos' },
  { value: 'mapas_mentais', label: '🧠 Mapas Mentais' },
  { value: 'outros', label: '📚 Outros' },
];

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: 'Rascunho', color: 'bg-muted', icon: Edit },
  queued: { label: 'Na fila', color: 'bg-amber-500', icon: Clock },
  processing: { label: 'Processando', color: 'bg-blue-500', icon: Loader2 },
  ready: { label: 'Publicado', color: 'bg-green-500', icon: CheckCircle },
  error: { label: 'Erro', color: 'bg-red-500', icon: AlertCircle },
  archived: { label: 'Arquivado', color: 'bg-gray-500', icon: Archive },
};

// ============================================
// UPLOAD DIALOG
// ============================================

interface UploadDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const UploadDialog = memo(function UploadDialog({ open, onClose, onSuccess }: UploadDialogProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    category: 'quimica_geral',
    description: '',
    tags: [] as string[],
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    onDrop: (files) => {
      if (files[0]) {
        setSelectedFile(files[0]);
        // Auto-preencher título com nome do arquivo
        if (!form.title) {
          setForm(f => ({ ...f, title: files[0].name.replace('.pdf', '') }));
        }
      }
    }
  });

  const handleSubmit = async () => {
    if (!selectedFile || !form.title) {
      toast.error('Preencha o título e selecione um arquivo');
      return;
    }

    setIsUploading(true);
    setUploadProgress(5);

    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData?.session?.access_token) {
        throw new Error('Não autenticado');
      }

      const authHeaders = {
        'Authorization': `Bearer ${sessionData.session.access_token}`,
        'Content-Type': 'application/json',
      };

      // ============================================
      // FASE 1: INIT - Obter Signed URL para upload
      // ============================================
      setUploadProgress(10);
      
      const initPayload = {
        phase: 'init',
        title: form.title.trim(),
        subtitle: form.subtitle?.trim() || undefined,
        description: form.description?.trim() || undefined,
        category: form.category,
        tags: form.tags.length > 0 ? form.tags : undefined,
        isPublished: true,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        mimeType: selectedFile.type || 'application/pdf',
      };

      const initResponse = await fetch(`${supabaseUrl}/functions/v1/genesis-book-upload`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(initPayload),
      });

      const initResult = await initResponse.json();

      if (!initResponse.ok || !initResult.success) {
        throw new Error(initResult.error || 'Erro ao iniciar upload');
      }

      const { bookId, uploadUrl } = initResult;
      
      if (!uploadUrl || !bookId) {
        throw new Error('URL de upload não gerada');
      }

      console.log('[UploadDialog] Fase 1 OK - Signed URL recebida');
      setUploadProgress(25);

      // ============================================
      // FASE 2: UPLOAD DIRETO - Enviar arquivo para Storage
      // ============================================
      toast.info('Enviando arquivo...', { id: 'upload-progress' });

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': selectedFile.type || 'application/pdf',
        },
        body: selectedFile,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Falha no upload: ${uploadResponse.status}`);
      }

      console.log('[UploadDialog] Fase 2 OK - Arquivo enviado ao Storage');
      setUploadProgress(70);

      // ============================================
      // FASE 3: COMPLETE - Confirmar e criar job
      // ============================================
      const completePayload = {
        phase: 'complete',
        bookId,
      };

      const completeResponse = await fetch(`${supabaseUrl}/functions/v1/genesis-book-upload`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(completePayload),
      });

      const completeResult = await completeResponse.json();

      if (!completeResponse.ok || !completeResult.success) {
        throw new Error(completeResult.error || 'Erro ao finalizar upload');
      }

      console.log('[UploadDialog] Fase 3 OK - Job criado:', completeResult.jobId);
      setUploadProgress(100);

      toast.dismiss('upload-progress');
      toast.success('Livro enviado para processamento!', {
        description: `O livro "${form.title}" está na fila de conversão.`,
      });

      onSuccess();
      onClose();

      // Resetar form
      setForm({ title: '', subtitle: '', category: 'quimica_geral', description: '', tags: [] });
      setSelectedFile(null);

    } catch (err) {
      console.error('[UploadDialog] Erro:', err);
      toast.dismiss('upload-progress');
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar livro');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Importar PDF → Livro Web
          </DialogTitle>
          <DialogDescription>
            Faça upload de um PDF para converter em livro interativo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
              selectedFile && "border-green-500 bg-green-500/5"
            )}
          >
            <input {...getInputProps()} />
            {selectedFile ? (
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="font-medium">{selectedFile.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <>
                <FileUp className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {isDragActive ? 'Solte o arquivo aqui' : 'Arraste um PDF ou clique para selecionar'}
                </p>
              </>
            )}
          </div>

          {/* Campos */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Nome do livro"
              />
            </div>

            <div>
              <Label htmlFor="subtitle">Subtítulo</Label>
              <Input
                id="subtitle"
                value={form.subtitle}
                onChange={(e) => setForm(f => ({ ...f, subtitle: e.target.value }))}
                placeholder="Subtítulo opcional"
              />
            </div>

            <div>
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm(f => ({ ...f, category: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Descrição do livro"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="tags">Tags</Label>
              <TagInput
                value={form.tags}
                onChange={(tags) => setForm(f => ({ ...f, tags }))}
                placeholder="Digite e pressione Enter..."
                disabled={isUploading}
              />
            </div>
          </div>

          {/* Progresso */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Enviando...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isUploading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isUploading || !selectedFile}>
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Importar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const GestaoLivrosWeb = memo(function GestaoLivrosWeb() {
  const [books, setBooks] = useState<WebBookAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  // Preview (sem mudar de URL) — evita abrir nova aba e cair no /auth
  const [previewBookId, setPreviewBookId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Edição de livro
  const [editingBook, setEditingBook] = useState<WebBookAdmin | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    subtitle: '',
    category: 'quimica_geral',
    description: '',
    tags: [] as string[],
  });
  const [isSaving, setIsSaving] = useState(false);

  // Aniquilar livro
  const [annihilateBook, setAnnihilateBook] = useState<WebBookAdmin | null>(null);
  const [annihilateConfirm, setAnnihilateConfirm] = useState('');
  const [isAnnihilating, setIsAnnihilating] = useState(false);

  const { clearAllCache } = useCacheManager();

  // Carregar livros
  const loadBooks = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('web_books')
        .select('*')
        .order('position', { ascending: true })
        .order('created_at', { ascending: false });

      if (statusFilter) {
        query = query.eq('status', statusFilter as "archived" | "draft" | "error" | "processing" | "queued" | "ready");
      }
      if (categoryFilter) {
        query = query.eq('category', categoryFilter as "exercicios" | "fisico_quimica" | "mapas_mentais" | "outros" | "previsao_final" | "quimica_geral" | "quimica_organica" | "resumos" | "revisao_ciclica" | "simulados");
      }

      const { data, error } = await query;

      if (error) throw error;
      setBooks((data || []) as WebBookAdmin[]);
    } catch (err) {
      console.error('[GestaoLivrosWeb] Erro:', err);
      toast.error('Erro ao carregar livros');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, categoryFilter]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  // Calcular mapeamento de capa modelo (baseado em position ASC)
  // Os 5 primeiros livros por position recebem as capas 01-05
  // SINCRONIZADO com fn_list_books_for_category que usa ORDER BY position ASC
  const coverIndexMap = new Map<string, number>();
  const sortedByPosition = [...books].sort(
    (a, b) => ((a as any).position || 999) - ((b as any).position || 999)
  );
  sortedByPosition.slice(0, 5).forEach((book, index) => {
    coverIndexMap.set(book.id, index + 1); // 1, 2, 3, 4, 5
  });

  // Filtrar por busca
  const filteredBooks = books.filter(book =>
    !searchQuery ||
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Arquivar livro
  const handleArchive = async (bookId: string) => {
    try {
      const { error } = await supabase
        .from('web_books')
        .update({ status: 'archived' })
        .eq('id', bookId);

      if (error) throw error;
      toast.success('Livro arquivado');
      loadBooks();
    } catch (err) {
      toast.error('Erro ao arquivar');
    }
  };

  // Publicar livro (força status = ready para aparecer para alunos)
  const handlePublish = async (bookId: string) => {
    try {
      const { error } = await supabase
        .from('web_books')
        .update({ 
          status: 'ready',
          is_published: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookId);

      if (error) throw error;
      toast.success('Livro publicado! Agora está visível para alunos.');
      loadBooks();
    } catch (err) {
      toast.error('Erro ao publicar');
    }
  };

  // Aniquilar livro (exclusão permanente)
  const handleAnnihilate = async () => {
    if (!annihilateBook || annihilateConfirm !== 'EXCLUIR') return;
    
    setIsAnnihilating(true);
    try {
      const bookId = annihilateBook.id;
      const bookTitle = annihilateBook.title;

      // 1. Deletar anotações do usuário
      await supabase.from('book_user_annotations').delete().eq('book_id', bookId);
      
      // 2. Deletar bookmarks
      await supabase.from('book_user_bookmarks').delete().eq('book_id', bookId);
      
      // 3. Deletar overlays de página
      await supabase.from('book_user_page_overlays').delete().eq('book_id', bookId);
      
      // 4. Deletar mensagens de chat
      await supabase.from('book_chat_messages').delete().eq('book_id', bookId);
      
      // 5. Deletar threads de chat
      await supabase.from('book_chat_threads').delete().eq('book_id', bookId);
      
      // 6. Deletar sessões de leitura
      await supabase.from('book_reading_sessions').delete().eq('book_id', bookId);
      
      // 7. Deletar logs de acesso
      await supabase.from('book_access_logs').delete().eq('book_id', bookId);
      
      // 8. Deletar ratings
      await supabase.from('book_ratings').delete().eq('book_id', bookId);
      
      // 9. Deletar jobs de import
      await supabase.from('book_import_jobs').delete().eq('book_id', bookId);
      
      // 10. Deletar o livro (cascata para web_book_pages via FK)
      const { error } = await supabase
        .from('web_books')
        .delete()
        .eq('id', bookId);

      if (error) throw error;

      // 11. Limpar cache
      clearAllCache();

      toast.success(`📕 Livro "${bookTitle}" aniquilado permanentemente`);
      setAnnihilateBook(null);
      setAnnihilateConfirm('');
      loadBooks();
    } catch (err) {
      console.error('[Aniquilar] Erro:', err);
      toast.error('Erro ao aniquilar livro');
    } finally {
      setIsAnnihilating(false);
    }
  };

  // ============================================
  // DND SENSORS — Configuração de arrasto
  // ============================================
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Distância mínima para iniciar arrasto
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handler para debug quando arrasto inicia
  const handleDragStart = useCallback((event: DragStartEvent) => {
    console.log('[DnD] 🚀 Arrasto INICIADO:', event.active.id);
  }, []);

  // ============================================
  // DND HANDLER — Ao soltar, recalcula posições
  // ============================================
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    
    console.log('[DnD] handleDragEnd chamado:', { activeId: active?.id, overId: over?.id });
    
    if (!over || active.id === over.id) {
      console.log('[DnD] Ignorando: sem destino ou mesmo item');
      return;
    }

    const oldIndex = filteredBooks.findIndex(b => b.id === active.id);
    const newIndex = filteredBooks.findIndex(b => b.id === over.id);

    console.log('[DnD] Índices:', { oldIndex, newIndex, totalBooks: filteredBooks.length });

    if (oldIndex === -1 || newIndex === -1) {
      console.log('[DnD] Índice não encontrado');
      return;
    }

    // Reordenar localmente para feedback imediato
    const reordered = arrayMove(filteredBooks, oldIndex, newIndex);

    // Atualizar posições: cada livro recebe position = index
    const updates = reordered.map((book, idx) => ({
      id: book.id,
      position: idx,
    }));

    console.log('[DnD] Updates a persistir:', updates);

    // Atualizar estado local imediatamente
    setBooks(prev => {
      const bookMap = new Map(prev.map(b => [b.id, b]));
      updates.forEach(u => {
        const book = bookMap.get(u.id);
        if (book) {
          (book as any).position = u.position;
        }
      });
      return [...prev].sort((a, b) => ((a as any).position || 999) - ((b as any).position || 999));
    });

    // Persistir no banco - batch para eficiência
    try {
      const updatePromises = updates.map(update => 
        supabase
          .from('web_books')
          .update({ position: update.position, updated_at: new Date().toISOString() })
          .eq('id', update.id)
      );
      
      const results = await Promise.all(updatePromises);
      const hasError = results.some(r => r.error);
      
      if (hasError) {
        console.error('[DnD] Erros no batch:', results.filter(r => r.error));
        throw new Error('Erro ao salvar algumas posições');
      }
      
      console.log('[DnD] ✅ Ordem salva com sucesso!');
      toast.success('Ordem dos livros atualizada!');
      clearAllCache();
    } catch (err) {
      console.error('[DnD] Erro ao salvar ordem:', err);
      toast.error('Erro ao salvar ordem');
      loadBooks(); // Recarregar para reverter
    }
  }, [filteredBooks, clearAllCache, loadBooks]);

  // ============================================
  // ATUALIZAÇÃO INLINE — Fonte da Verdade Absoluta
  // Salva campo individual no banco e recarrega lista
  // ============================================
  const handleInlineUpdate = useCallback(async (
    bookId: string, 
    field: string, 
    value: string | number
  ) => {
    try {
      const updateData: Record<string, unknown> = {
        [field]: value,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('web_books')
        .update(updateData)
        .eq('id', bookId);

      if (error) throw error;
      
      toast.success(`${field === 'title' ? 'Título' : field === 'subtitle' ? 'Subtítulo' : field === 'category' ? 'Categoria' : field === 'position' ? 'Posição' : field === 'status' ? 'Status' : 'Campo'} atualizado!`);
      
      // Recarregar para sincronizar
      loadBooks();
      
      // Limpar cache para garantir sincronização com portal do aluno
      clearAllCache();
    } catch (err) {
      console.error('[InlineUpdate] Erro:', err);
      toast.error('Erro ao atualizar');
      throw err; // Re-throw para o componente inline reverter
    }
  }, [loadBooks, clearAllCache]);

  // ============================================
  // CAPA DO LIVRO — Upload por livro (reflete no /alunos/livros-web)
  // Bucket público: book-category-assets
  // ============================================
  const handleUploadCover = useCallback(async (bookId: string, file: File) => {
    try {
      if (!file.type.startsWith('image/')) {
        toast.error('Selecione uma imagem (PNG/JPG/WebP)');
        return;
      }

      const extRaw = file.name.split('.').pop()?.toLowerCase();
      const ext = extRaw && ['png', 'jpg', 'jpeg', 'webp'].includes(extRaw) ? extRaw : 'png';
      const coverPath = `web-books/${bookId}/cover.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('book-category-assets')
        .upload(coverPath, file, {
          upsert: true,
          contentType: file.type || 'image/png',
          cacheControl: '3600',
        });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from('book-category-assets')
        .getPublicUrl(coverPath);

      const coverUrl = publicData.publicUrl;

      const { error: updateError } = await supabase
        .from('web_books')
        .update({
          cover_url: coverUrl,
          cover_path: coverPath,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookId);

      if (updateError) throw updateError;

      toast.success('Capa atualizada!');
      await clearAllCache(true);
      loadBooks();
    } catch (err) {
      console.error('[CoverUpload] Erro:', err);
      toast.error('Erro ao enviar capa');
    }
  }, [clearAllCache, loadBooks]);

  const handleRemoveCover = useCallback(async (bookId: string) => {
    try {
      const book = books.find(b => b.id === bookId);

      // 1) Remover arquivo no storage (se soubermos o path)
      if (book?.cover_path) {
        await supabase.storage.from('book-category-assets').remove([book.cover_path]);
      }

      // 2) Zerar no banco
      const { error } = await supabase
        .from('web_books')
        .update({
          cover_url: null,
          cover_path: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookId);

      if (error) throw error;

      toast.success('Capa removida');
      await clearAllCache(true);
      loadBooks();
    } catch (err) {
      console.error('[CoverRemove] Erro:', err);
      toast.error('Erro ao remover capa');
    }
  }, [books, clearAllCache, loadBooks]);

  // Abrir modal de edição
  const handleOpenEdit = (book: WebBookAdmin) => {
    setEditingBook(book);
    setEditForm({
      title: book.title,
      subtitle: book.subtitle || '',
      category: book.category || 'quimica_geral',
      description: book.description || '',
      tags: book.tags || [],
    });
  };

  // Salvar edição
  const handleSaveEdit = async () => {
    if (!editingBook) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('web_books')
        .update({
          title: editForm.title.trim(),
          subtitle: editForm.subtitle?.trim() || null,
          category: editForm.category as "exercicios" | "fisico_quimica" | "mapas_mentais" | "outros" | "previsao_final" | "quimica_geral" | "quimica_organica" | "resumos" | "revisao_ciclica" | "simulados",
          description: editForm.description?.trim() || null,
          tags: editForm.tags.length > 0 ? editForm.tags : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingBook.id);

      if (error) throw error;
      
      toast.success('Livro atualizado com sucesso!');
      setEditingBook(null);
      loadBooks();
    } catch (err) {
      console.error('[GestaoLivrosWeb] Erro ao salvar:', err);
      toast.error('Erro ao salvar alterações');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-primary" />
            Gestão de Livros Web
          </h1>
          <p className="text-muted-foreground">
            Gerencie seus livros digitais interativos
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              await clearAllCache(true);
              loadBooks();
            }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Limpar cache
          </Button>
          <Button variant="outline" onClick={loadBooks}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={() => setShowUploadDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Importar PDF
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{books.length}</div>
            <p className="text-sm text-muted-foreground">Total de livros</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-500">
              {books.filter(b => b.status === 'ready').length}
            </div>
            <p className="text-sm text-muted-foreground">Publicados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-amber-500">
              {books.filter(b => ['queued', 'processing'].includes(b.status)).length}
            </div>
            <p className="text-sm text-muted-foreground">Processando</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              {books.reduce((acc, b) => acc + (b.unique_readers || 0), 0)}
            </div>
            <p className="text-sm text-muted-foreground">Leitores únicos</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar livros..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={statusFilter || "__all__"} onValueChange={(v) => setStatusFilter(v === "__all__" ? "" : v)}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos</SelectItem>
            {Object.entries(STATUS_MAP).map(([value, { label }]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={categoryFilter || "__all__"} onValueChange={(v) => setCategoryFilter(v === "__all__" ? "" : v)}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todas</SelectItem>
            {CATEGORIES.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground/50 mb-3" />
              <h3 className="font-medium">Nenhum livro encontrado</h3>
              <p className="text-sm text-muted-foreground">
                Importe seu primeiro PDF para começar
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis]}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Livro</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Páginas</TableHead>
                    <TableHead>Leitores</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <SortableContext
                    items={filteredBooks.map(b => b.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {filteredBooks.map((book) => (
                      <SortableBookRow
                        key={book.id}
                        book={book as any}
                        coverIndex={coverIndexMap.get(book.id)}
                        categories={CATEGORIES}
                        statusMap={STATUS_MAP}
                        onInlineUpdate={handleInlineUpdate}
                        onUploadCover={handleUploadCover}
                        onRemoveCover={handleRemoveCover}
                        onPreview={(id) => {
                          setPreviewBookId(id);
                          setPreviewOpen(true);
                        }}
                        onEdit={handleOpenEdit}
                        onPublish={handlePublish}
                        onArchive={handleArchive}
                        onAnnihilate={setAnnihilateBook}
                      />
                    ))}
                  </SortableContext>
                </TableBody>
              </Table>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog (mesma URL) */}
      <Dialog
        open={previewOpen}
        onOpenChange={(open) => {
          setPreviewOpen(open);
          if (!open) {
            setPreviewBookId(null);
            // ✅ P0: Recarregar livros ao fechar (reflete total_pages atualizado pelo pdfRenderer)
            loadBooks();
          }
        }}
      >
        <DialogContent className="max-w-6xl w-[96vw] h-[90vh] p-0 overflow-hidden">
          {previewBookId ? (
            <div className="h-[90vh]">
              <WebBookViewer
                bookId={previewBookId}
                className="h-full"
                onClose={() => {
                  setPreviewOpen(false);
                  setPreviewBookId(null);
                  // ✅ P0: Recarregar ao fechar via botão interno
                  loadBooks();
                }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-[90vh]">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Upload Dialog */}
      <UploadDialog
        open={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        onSuccess={loadBooks}
      />

      {/* Edit Dialog */}
      <Dialog open={!!editingBook} onOpenChange={(open) => !open && setEditingBook(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5" />
              Editar Livro
            </DialogTitle>
            <DialogDescription>
              Atualize os dados do livro
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Título *</Label>
              <Input
                id="edit-title"
                value={editForm.title}
                onChange={(e) => setEditForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Título do livro"
                disabled={isSaving}
              />
            </div>

            <div>
              <Label htmlFor="edit-subtitle">Subtítulo</Label>
              <Input
                id="edit-subtitle"
                value={editForm.subtitle}
                onChange={(e) => setEditForm(f => ({ ...f, subtitle: e.target.value }))}
                placeholder="Subtítulo opcional"
                disabled={isSaving}
              />
            </div>

            <div>
              <Label htmlFor="edit-category">Categoria</Label>
              <Select
                value={editForm.category}
                onValueChange={(value) => setEditForm(f => ({ ...f, category: value }))}
                disabled={isSaving}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="edit-description">Descrição</Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Descrição opcional"
                rows={3}
                disabled={isSaving}
              />
            </div>

            <div>
              <Label htmlFor="edit-tags">Tags</Label>
              <TagInput
                value={editForm.tags}
                onChange={(tags) => setEditForm(f => ({ ...f, tags }))}
                placeholder="Digite e pressione Enter..."
                disabled={isSaving}
              />
            </div>

            {/* Substituição de PDF */}
            <div className="pt-4 border-t">
              <Label className="flex items-center gap-2 mb-3">
                <FileUp className="w-4 h-4" />
                Substituir PDF
              </Label>
              <PDFReplacementUploader
                bookId={editingBook?.id || ''}
                currentFileName={editingBook?.original_filename}
                onSuccess={() => {
                  loadBooks();
                  clearAllCache();
                }}
                disabled={isSaving}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingBook(null)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving || !editForm.title.trim()}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Aniquilar Dialog */}
      <Dialog 
        open={!!annihilateBook} 
        onOpenChange={(open) => {
          if (!open) {
            setAnnihilateBook(null);
            setAnnihilateConfirm('');
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              🔥 Aniquilar Livro
            </DialogTitle>
            <DialogDescription>
              Esta ação é <strong className="text-destructive">IRREVERSÍVEL</strong>. 
              O livro e todos os dados associados serão excluídos permanentemente:
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Info do livro */}
            <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/30">
              <p className="font-semibold text-foreground">{annihilateBook?.title}</p>
              <p className="text-sm text-muted-foreground">{annihilateBook?.total_pages || 0} páginas</p>
            </div>

            {/* Lista do que será deletado */}
            <div className="text-sm space-y-1 text-muted-foreground">
              <p>• Todas as páginas do livro</p>
              <p>• Anotações e marcações dos alunos</p>
              <p>• Histórico de chat com IA</p>
              <p>• Sessões de leitura e logs</p>
              <p>• Avaliações e ratings</p>
              <p>• Arquivos no storage</p>
            </div>

            {/* Campo de confirmação */}
            <div>
              <Label htmlFor="confirm-annihilate" className="text-destructive">
                Digite <strong>EXCLUIR</strong> para confirmar:
              </Label>
              <Input
                id="confirm-annihilate"
                value={annihilateConfirm}
                onChange={(e) => setAnnihilateConfirm(e.target.value.toUpperCase())}
                placeholder="EXCLUIR"
                className="mt-2 font-mono"
                disabled={isAnnihilating}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setAnnihilateBook(null);
                setAnnihilateConfirm('');
              }}
              disabled={isAnnihilating}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={handleAnnihilate}
              disabled={annihilateConfirm !== 'EXCLUIR' || isAnnihilating}
            >
              {isAnnihilating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Aniquilando...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  🔥 Aniquilar Permanentemente
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

GestaoLivrosWeb.displayName = 'GestaoLivrosWeb';

export default GestaoLivrosWeb;
