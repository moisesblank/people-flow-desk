// ============================================
// 📚 LIVROS DO MOISA - Gestão de Livros Web
// Área do Owner para gerenciar livros
// ============================================

import { memo, useState, useCallback, useEffect } from 'react';
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
  X
} from 'lucide-react';
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDropzone } from 'react-dropzone';

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
  cover_url?: string;
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
    tags: '',
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
    setUploadProgress(10);

    try {
      // Usar edge function genesis-book-upload diretamente
      const formDataUpload = new FormData();
      formDataUpload.append('file', selectedFile);
      formDataUpload.append('title', form.title);
      if (form.subtitle) formDataUpload.append('subtitle', form.subtitle);
      if (form.description) formDataUpload.append('description', form.description);
      formDataUpload.append('category', form.category);
      if (form.tags) formDataUpload.append('tags', form.tags);
      formDataUpload.append('isPublished', 'true');

      setUploadProgress(30);

      // Chamar edge function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData?.session?.access_token) {
        throw new Error('Não autenticado');
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/genesis-book-upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionData.session.access_token}`,
        },
        body: formDataUpload,
      });

      setUploadProgress(70);

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao processar livro');
      }

      setUploadProgress(100);
      toast.success('Livro enviado para processamento!', {
        description: `Job ID: ${result.jobId?.substring(0, 8)}...`,
      });
      onSuccess();
      onClose();

      // Resetar form
      setForm({ title: '', subtitle: '', category: 'quimica_geral', description: '', tags: '' });
      setSelectedFile(null);
    } catch (err) {
      console.error('[UploadDialog] Erro:', err);
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
              <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
              <Input
                id="tags"
                value={form.tags}
                onChange={(e) => setForm(f => ({ ...f, tags: e.target.value }))}
                placeholder="química, orgânica, revisão"
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

  // Carregar livros
  const loadBooks = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('web_books')
        .select('*')
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

  // Publicar livro
  const handlePublish = async (bookId: string) => {
    try {
      const { error } = await supabase
        .from('web_books')
        .update({ status: 'ready' })
        .eq('id', bookId);

      if (error) throw error;
      toast.success('Livro publicado');
      loadBooks();
    } catch (err) {
      toast.error('Erro ao publicar');
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
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            {Object.entries(STATUS_MAP).map(([value, { label }]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas</SelectItem>
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
            <Table>
              <TableHeader>
                <TableRow>
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
                {filteredBooks.map((book) => {
                  const status = STATUS_MAP[book.status] || STATUS_MAP.draft;
                  const StatusIcon = status.icon;
                  const category = CATEGORIES.find(c => c.value === book.category);

                  return (
                    <TableRow key={book.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {book.cover_url ? (
                            <img
                              src={book.cover_url}
                              alt={book.title}
                              className="w-10 h-14 object-cover rounded"
                            />
                          ) : (
                            <div className="w-10 h-14 bg-muted rounded flex items-center justify-center">
                              <BookOpen className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium line-clamp-1">{book.title}</p>
                            {book.subtitle && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {book.subtitle}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{category?.label || book.category}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("gap-1", status.color)}>
                          <StatusIcon className={cn("w-3 h-3", book.status === 'processing' && 'animate-spin')} />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{book.total_pages || 0}</TableCell>
                      <TableCell>{book.unique_readers || 0}</TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(book.created_at), "dd/MM/yy", { locale: ptBR })}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            {book.status === 'draft' && (
                              <DropdownMenuItem onClick={() => handlePublish(book.id)}>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Publicar
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => handleArchive(book.id)}
                              className="text-destructive"
                            >
                              <Archive className="w-4 h-4 mr-2" />
                              Arquivar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <UploadDialog
        open={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        onSuccess={loadBooks}
      />
    </div>
  );
});

GestaoLivrosWeb.displayName = 'GestaoLivrosWeb';

export default GestaoLivrosWeb;
