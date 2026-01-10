// ============================================
// 📄 GESTÃO DE MATERIAIS PDF
// Área da Gestão para gerenciar materiais
// Tecnologia: PDF.js + Signed URLs + Watermarks
// ============================================

import { memo, useState, useCallback, useEffect, useMemo } from 'react';
import { 
  FileText, 
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
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  Tag,
  Download,
  Shield,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDropzone } from 'react-dropzone';
import { MaterialViewer } from '@/components/materials/MaterialViewer';

// ============================================
// TIPOS
// ============================================

interface Material {
  id: string;
  title: string;
  description?: string;
  category: string;
  status: 'draft' | 'processing' | 'ready' | 'archived';
  tags: string[];
  total_pages: number;
  created_at: string;
  updated_at: string;
  view_count: number;
  download_count: number;
  unique_readers: number;
  cover_url?: string | null;
  file_path: string;
  file_name?: string;
  file_size_bytes?: number;
  watermark_enabled: boolean;
  is_premium: boolean;
  // Campos temporais (padrão arquivos_universal)
  ano?: number;
  mes?: number;
  semana?: number;
  dia?: number;
  folder?: string;
  position?: number;
  upload_date?: string;
}

// ============================================
// CATEGORIAS
// ============================================

const CATEGORIES = [
  { value: 'apostilas', label: '📚 Apostilas' },
  { value: 'resumos', label: '📋 Resumos' },
  { value: 'exercicios', label: '✏️ Exercícios' },
  { value: 'simulados', label: '📝 Simulados' },
  { value: 'mapas_mentais', label: '🧠 Mapas Mentais' },
  { value: 'formulas', label: '🔬 Fórmulas' },
  { value: 'tabelas', label: '📊 Tabelas' },
  { value: 'revisao', label: '🔄 Revisão' },
  { value: 'extras', label: '⭐ Extras' },
  { value: 'outros', label: '📁 Outros' },
];

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: 'Rascunho', color: 'bg-muted', icon: Edit },
  processing: { label: 'Processando', color: 'bg-blue-500', icon: Loader2 },
  ready: { label: 'Publicado', color: 'bg-green-500', icon: CheckCircle },
  archived: { label: 'Arquivado', color: 'bg-gray-500', icon: Archive },
};

// ============================================
// UPLOAD DIALOG
// ============================================

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const UploadDialog = memo(function UploadDialog({ open, onOpenChange, onSuccess }: UploadDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('outros');
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  const [isPremium, setIsPremium] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024, // 100MB
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const f = acceptedFiles[0];
        setFile(f);
        if (!title) {
          setTitle(f.name.replace(/\.pdf$/i, ''));
        }
      }
    }
  });

  const handleUpload = async () => {
    if (!file || !title.trim()) {
      toast.error('Título e arquivo são obrigatórios');
      return;
    }

    setUploading(true);
    setProgress(10);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Não autenticado');

      // Preparar dados temporais (padrão arquivos_universal)
      const now = new Date();
      const ano = now.getFullYear();
      const mes = now.getMonth() + 1;
      const dia = now.getDate();
      const semana = Math.ceil((now.getDate() + new Date(now.getFullYear(), now.getMonth(), 1).getDay()) / 7);

      // 1. Upload do arquivo com organização por data
      const folder = `${ano}/${String(mes).padStart(2, '0')}/${String(dia).padStart(2, '0')}`;
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = `${folder}/${fileName}`;
      
      setProgress(30);
      
      const { error: uploadError } = await supabase.storage
        .from('materiais')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;
      
      setProgress(70);

      // 2. Criar registro no banco com campos temporais
      const { error: dbError } = await supabase
        .from('materials')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          category,
          status: 'ready',
          file_path: filePath,
          file_name: file.name,
          file_size_bytes: file.size,
          watermark_enabled: watermarkEnabled,
          is_premium: isPremium,
          created_by: userData.user.id,
          // Campos temporais (padrão arquivos_universal)
          ano,
          mes,
          semana,
          dia,
          folder,
          upload_date: now.toISOString(),
        });

      if (dbError) throw dbError;
      
      setProgress(100);
      
      toast.success('Material enviado com sucesso!');
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setTitle('');
      setDescription('');
      setCategory('outros');
      setFile(null);
      setWatermarkEnabled(true);
      setIsPremium(true);

    } catch (error: any) {
      console.error('Erro no upload:', error);
      toast.error(error.message || 'Erro ao enviar material');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Novo Material PDF
          </DialogTitle>
          <DialogDescription>
            Faça upload de um PDF para disponibilizar aos alunos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all",
              isDragActive && "border-primary bg-primary/5",
              file && "border-green-500 bg-green-500/5"
            )}
          >
            <input {...getInputProps()} />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="w-8 h-8 text-green-500" />
                <div className="text-left">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div>
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                <p className="font-medium">Arraste um PDF aqui</p>
                <p className="text-sm text-muted-foreground">ou clique para selecionar (máx. 100MB)</p>
              </div>
            )}
          </div>

          {/* Título */}
          <div className="space-y-2">
            <Label>Título *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Apostila de Química Orgânica"
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição do material..."
              rows={2}
            />
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
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

          {/* Opções */}
          <div className="flex gap-6">
            <div className="flex items-center gap-2">
              <Switch
                checked={watermarkEnabled}
                onCheckedChange={setWatermarkEnabled}
              />
              <Label className="flex items-center gap-1 cursor-pointer">
                <Shield className="w-4 h-4" />
                Marca d'água
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={isPremium}
                onCheckedChange={setIsPremium}
              />
              <Label className="flex items-center gap-1 cursor-pointer">
                <Users className="w-4 h-4" />
                Apenas Premium
              </Label>
            </div>
          </div>

          {/* Progress */}
          {uploading && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-center text-muted-foreground">
                Enviando... {progress}%
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>
            Cancelar
          </Button>
          <Button onClick={handleUpload} disabled={uploading || !file || !title.trim()}>
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Enviar Material
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

const GestaoMateriais = memo(function GestaoMateriais() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [viewingMaterial, setViewingMaterial] = useState<Material | null>(null);

  // Buscar materiais
  const fetchMaterials = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMaterials((data as Material[]) || []);
    } catch (error) {
      console.error('Erro ao buscar materiais:', error);
      toast.error('Erro ao carregar materiais');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaterials();

    // Realtime subscription
    const channel = supabase
      .channel('materials_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'materials' }, () => {
        fetchMaterials();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchMaterials]);

  // Filtros
  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           m.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || m.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || m.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [materials, searchQuery, categoryFilter, statusFilter]);

  // Ações
  const handleStatusChange = async (id: string, newStatus: 'draft' | 'processing' | 'ready' | 'archived') => {
    try {
      const { error } = await supabase
        .from('materials')
        .update({ status: newStatus })
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Status atualizado');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao atualizar status');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este material?')) return;
    
    try {
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Material excluído');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao excluir');
    }
  };

  // Stats
  const stats = useMemo(() => ({
    total: materials.length,
    published: materials.filter(m => m.status === 'ready').length,
    draft: materials.filter(m => m.status === 'draft').length,
    totalViews: materials.reduce((sum, m) => sum + (m.view_count || 0), 0),
  }), [materials]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" />
            Gestão de Materiais
          </h1>
          <p className="text-muted-foreground mt-1">
            PDFs protegidos com marca d'água e signed URLs
          </p>
        </div>
        <Button onClick={() => setUploadOpen(true)} size="lg" className="gap-2">
          <Plus className="w-5 h-5" />
          Novo Material
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
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
                <p className="text-2xl font-bold">{stats.published}</p>
                <p className="text-sm text-muted-foreground">Publicados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Edit className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.draft}</p>
                <p className="text-sm text-muted-foreground">Rascunhos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10">
                <Eye className="w-5 h-5 text-cyan-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalViews}</p>
                <p className="text-sm text-muted-foreground">Visualizações</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar materiais..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Categorias</SelectItem>
                {CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                {Object.entries(STATUS_MAP).map(([value, { label }]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Views</TableHead>
                <TableHead className="text-center">Downloads</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMaterials.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-muted-foreground">Nenhum material encontrado</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredMaterials.map(material => {
                  const statusInfo = STATUS_MAP[material.status] || STATUS_MAP.draft;
                  const StatusIcon = statusInfo.icon;
                  const categoryLabel = CATEGORIES.find(c => c.value === material.category)?.label || material.category;
                  
                  return (
                    <TableRow key={material.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium line-clamp-1">{material.title}</p>
                            {material.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {material.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{categoryLabel}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn(statusInfo.color, 'text-white gap-1')}>
                          <StatusIcon className={cn("w-3 h-3", material.status === 'processing' && 'animate-spin')} />
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{material.view_count || 0}</TableCell>
                      <TableCell className="text-center">{material.download_count || 0}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(material.created_at), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setViewingMaterial(material)}>
                              <Eye className="w-4 h-4 mr-2" />
                              Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {material.status === 'draft' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(material.id, 'ready')}>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Publicar
                              </DropdownMenuItem>
                            )}
                            {material.status === 'ready' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(material.id, 'archived')}>
                                <Archive className="w-4 h-4 mr-2" />
                                Arquivar
                              </DropdownMenuItem>
                            )}
                            {material.status === 'archived' && (
                              <DropdownMenuItem onClick={() => handleStatusChange(material.id, 'ready')}>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Republicar
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDelete(material.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onSuccess={fetchMaterials}
      />

      {/* Material Viewer */}
      <AnimatePresence>
        {viewingMaterial && (
          <MaterialViewer
            material={viewingMaterial}
            onClose={() => setViewingMaterial(null)}
            isAdmin
          />
        )}
      </AnimatePresence>
    </div>
  );
});

export default GestaoMateriais;
