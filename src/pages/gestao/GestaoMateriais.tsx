// ============================================
// 📄 GESTÃO DE MATERIAIS PDF
// Organização: CONTEUDISTA → 5 MACROS → MICROS
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
  Users,
  Brain,
  HelpCircle,
  FlaskConical,
  Atom,
  Beaker,
  Leaf,
  Dna,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Sparkles
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useDropzone } from 'react-dropzone';
import { MaterialViewer } from '@/components/materials/MaterialViewer';
import { useTaxonomyForSelects } from '@/hooks/useQuestionTaxonomy';

// ============================================
// TIPOS
// ============================================

interface Material {
  id: string;
  title: string;
  description?: string;
  category: string;
  content_type: string;
  macro?: string;
  micro?: string;
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
  ano?: number;
  mes?: number;
  folder?: string;
  position?: number;
}

// ============================================
// TIPOS DE CONTEÚDO (CONTEUDISTA)
// ============================================

const CONTENT_TYPES = [
  { value: 'mapa_mental', label: '🧠 Mapa Mental', icon: Brain },
  { value: 'questoes', label: '❓ Questões', icon: HelpCircle },
  { value: 'resumo', label: '📋 Resumo', icon: FileText },
  { value: 'formula', label: '🔬 Fórmulas', icon: FlaskConical },
  { value: 'tabela', label: '📊 Tabela', icon: Tag },
  { value: 'outros', label: '📁 Outros', icon: FolderOpen },
];

// 5 MACROS CANÔNICOS
const MACRO_CONFIG: Record<string, { icon: React.ElementType; color: string; gradient: string }> = {
  'quimica_geral': { icon: Atom, color: 'text-amber-500', gradient: 'from-amber-500 to-orange-500' },
  'fisico_quimica': { icon: FlaskConical, color: 'text-cyan-500', gradient: 'from-cyan-500 to-blue-500' },
  'quimica_organica': { icon: Beaker, color: 'text-purple-500', gradient: 'from-purple-500 to-violet-500' },
  'quimica_ambiental': { icon: Leaf, color: 'text-green-500', gradient: 'from-green-500 to-emerald-500' },
  'bioquimica': { icon: Dna, color: 'text-pink-500', gradient: 'from-pink-500 to-rose-500' },
};

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: 'Rascunho', color: 'bg-muted', icon: Edit },
  processing: { label: 'Processando', color: 'bg-blue-500', icon: Loader2 },
  ready: { label: 'Publicado', color: 'bg-green-500', icon: CheckCircle },
  archived: { label: 'Arquivado', color: 'bg-gray-500', icon: Archive },
};

// ============================================
// UPLOAD DIALOG COM TAXONOMIA
// ============================================

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const UploadDialog = memo(function UploadDialog({ open, onOpenChange, onSuccess }: UploadDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contentType, setContentType] = useState('mapa_mental');
  const [selectedMacro, setSelectedMacro] = useState('');
  const [selectedMicro, setSelectedMicro] = useState('');
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  const [isPremium, setIsPremium] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const { macros, getMicrosForSelect, isLoading: taxonomyLoading } = useTaxonomyForSelects();
  const micros = selectedMacro ? getMicrosForSelect(selectedMacro) : [];

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024,
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

  const handleMacroChange = (value: string) => {
    setSelectedMacro(value);
    setSelectedMicro(''); // Reset micro
  };

  const handleUpload = async () => {
    if (!file || !title.trim()) {
      toast.error('Título e arquivo são obrigatórios');
      return;
    }
    if (!selectedMacro) {
      toast.error('Selecione um Macro-assunto');
      return;
    }

    setUploading(true);
    setProgress(10);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Não autenticado');

      const now = new Date();
      const ano = now.getFullYear();
      const mes = now.getMonth() + 1;
      const dia = now.getDate();
      const semana = Math.ceil((now.getDate() + new Date(now.getFullYear(), now.getMonth(), 1).getDay()) / 7);

      // Organizar por: contentType/macro/micro/data
      const folder = `${contentType}/${selectedMacro}/${selectedMicro || 'geral'}/${ano}/${String(mes).padStart(2, '0')}`;
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

      const { error: dbError } = await supabase
        .from('materials')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          category: contentType, // Manter compatibilidade
          content_type: contentType,
          macro: selectedMacro,
          micro: selectedMicro || null,
          status: 'ready',
          file_path: filePath,
          file_name: file.name,
          file_size_bytes: file.size,
          watermark_enabled: watermarkEnabled,
          is_premium: isPremium,
          created_by: userData.user.id,
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
      setContentType('mapa_mental');
      setSelectedMacro('');
      setSelectedMicro('');
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Novo Material PDF
          </DialogTitle>
          <DialogDescription>
            Organize por tipo de conteúdo e taxonomia
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all",
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
                <FileText className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                <p className="font-medium">Arraste um PDF aqui</p>
                <p className="text-sm text-muted-foreground">ou clique para selecionar</p>
              </div>
            )}
          </div>

          {/* Título */}
          <div className="space-y-2">
            <Label>Título *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Mapa Mental - Química Orgânica"
            />
          </div>

          {/* Tipo de Conteúdo */}
          <div className="space-y-2">
            <Label>Tipo de Conteúdo *</Label>
            <Select value={contentType} onValueChange={setContentType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTENT_TYPES.map(ct => (
                  <SelectItem key={ct.value} value={ct.value}>
                    {ct.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Macro-assunto */}
          <div className="space-y-2">
            <Label>Macro-assunto * (5 Áreas)</Label>
            <Select value={selectedMacro} onValueChange={handleMacroChange} disabled={taxonomyLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o macro..." />
              </SelectTrigger>
              <SelectContent>
                {macros.map(m => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Micro-assunto */}
          {selectedMacro && (
            <div className="space-y-2">
              <Label>Micro-assunto</Label>
              <Select value={selectedMicro} onValueChange={setSelectedMicro}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o micro (opcional)..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Geral / Todos</SelectItem>
                  {micros.map(m => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
          <Button onClick={handleUpload} disabled={uploading || !file || !title.trim() || !selectedMacro}>
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
// MATERIAL ROW
// ============================================

interface MaterialRowProps {
  material: Material;
  onView: () => void;
  onStatusChange: (id: string, status: 'draft' | 'processing' | 'ready' | 'archived') => void;
  onDelete: (id: string) => void;
}

const MaterialRow = memo(function MaterialRow({ material, onView, onStatusChange, onDelete }: MaterialRowProps) {
  const status = STATUS_MAP[material.status] || STATUS_MAP.draft;
  const StatusIcon = status.icon;
  const macroConfig = MACRO_CONFIG[material.macro || ''];
  const MacroIcon = macroConfig?.icon || Atom;
  
  return (
    <TableRow className="hover:bg-muted/50">
      <TableCell>
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-lg",
            macroConfig?.color ? `bg-${macroConfig.color.replace('text-', '')}/10` : 'bg-muted'
          )}>
            <MacroIcon className={cn("w-5 h-5", macroConfig?.color || 'text-muted-foreground')} />
          </div>
          <div>
            <p className="font-medium line-clamp-1">{material.title}</p>
            <p className="text-xs text-muted-foreground">
              {material.content_type === 'mapa_mental' ? '🧠 Mapa Mental' : 
               material.content_type === 'questoes' ? '❓ Questões' : material.content_type}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="font-normal">
          {material.macro || '-'}
        </Badge>
      </TableCell>
      <TableCell>
        <span className="text-sm text-muted-foreground">{material.micro || 'Geral'}</span>
      </TableCell>
      <TableCell>
        <Badge className={cn(status.color, 'text-white gap-1')}>
          <StatusIcon className={cn("w-3 h-3", material.status === 'processing' && 'animate-spin')} />
          {status.label}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {material.view_count || 0}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <span className="text-sm text-muted-foreground">
          {format(new Date(material.created_at), 'dd/MM/yy', { locale: ptBR })}
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
            <DropdownMenuItem onClick={onView}>
              <Eye className="w-4 h-4 mr-2" />
              Visualizar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {material.status !== 'ready' && (
              <DropdownMenuItem onClick={() => onStatusChange(material.id, 'ready')}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Publicar
              </DropdownMenuItem>
            )}
            {material.status !== 'archived' && (
              <DropdownMenuItem onClick={() => onStatusChange(material.id, 'archived')}>
                <Archive className="w-4 h-4 mr-2" />
                Arquivar
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onDelete(material.id)}
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
});

// ============================================
// MACRO SECTION (Collapsible)
// ============================================

interface MacroSectionProps {
  macroValue: string;
  macroLabel: string;
  materials: Material[];
  onView: (m: Material) => void;
  onStatusChange: (id: string, status: 'draft' | 'processing' | 'ready' | 'archived') => void;
  onDelete: (id: string) => void;
  defaultOpen?: boolean;
}

const MacroSection = memo(function MacroSection({ 
  macroValue, 
  macroLabel, 
  materials, 
  onView, 
  onStatusChange, 
  onDelete,
  defaultOpen = false 
}: MacroSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const config = MACRO_CONFIG[macroValue] || MACRO_CONFIG['quimica_geral'];
  const Icon = config.icon;

  if (materials.length === 0) return null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Card className="cursor-pointer hover:shadow-md transition-all">
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg bg-gradient-to-br", config.gradient)}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base">{macroLabel}</CardTitle>
                  <CardDescription>{materials.length} materiais</CardDescription>
                </div>
              </div>
              {isOpen ? (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
        </Card>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <Card className="mt-2 border-t-0 rounded-t-none">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Macro</TableHead>
                <TableHead>Micro</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.map(m => (
                <MaterialRow
                  key={m.id}
                  material={m}
                  onView={() => onView(m)}
                  onStatusChange={onStatusChange}
                  onDelete={onDelete}
                />
              ))}
            </TableBody>
          </Table>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
});

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

const GestaoMateriais = memo(function GestaoMateriais() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [contentTypeFilter, setContentTypeFilter] = useState<string>('all');
  const [macroFilter, setMacroFilter] = useState<string>('all');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [viewingMaterial, setViewingMaterial] = useState<Material | null>(null);

  const { macros } = useTaxonomyForSelects();

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

    const channel = supabase
      .channel('materials_gestao_changes')
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
      const matchesContentType = contentTypeFilter === 'all' || m.content_type === contentTypeFilter;
      const matchesMacro = macroFilter === 'all' || m.macro === macroFilter;
      return matchesSearch && matchesContentType && matchesMacro;
    });
  }, [materials, searchQuery, contentTypeFilter, macroFilter]);

  // Agrupar por MACRO
  const materialsByMacro = useMemo(() => {
    const grouped: Record<string, Material[]> = {};
    macros.forEach(m => {
      grouped[m.value] = filteredMaterials.filter(mat => mat.macro === m.value);
    });
    // Adicionar materiais sem macro
    grouped['sem_macro'] = filteredMaterials.filter(m => !m.macro);
    return grouped;
  }, [filteredMaterials, macros]);

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
    mapas: materials.filter(m => m.content_type === 'mapa_mental').length,
    questoes: materials.filter(m => m.content_type === 'questoes').length,
    published: materials.filter(m => m.status === 'ready').length,
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
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Gestão de Materiais PDF
          </h1>
          <p className="text-muted-foreground">
            Organize por tipo de conteúdo e taxonomia (5 Macros)
          </p>
        </div>
        <Button onClick={() => setUploadOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Material
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-pink-500" />
            <div>
              <p className="text-2xl font-bold">{stats.mapas}</p>
              <p className="text-sm text-muted-foreground">Mapas Mentais</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <HelpCircle className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">{stats.questoes}</p>
              <p className="text-sm text-muted-foreground">Questões</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{stats.published}</p>
              <p className="text-sm text-muted-foreground">Publicados</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar materiais..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={contentTypeFilter} onValueChange={setContentTypeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            {CONTENT_TYPES.map(ct => (
              <SelectItem key={ct.value} value={ct.value}>
                {ct.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={macroFilter} onValueChange={setMacroFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Macro" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Macros</SelectItem>
            {macros.map(m => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Lista por MACRO */}
      <div className="space-y-4">
        {filteredMaterials.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhum material encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Comece enviando seu primeiro PDF
            </p>
            <Button onClick={() => setUploadOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Material
            </Button>
          </Card>
        ) : (
          macros.map((macro, index) => (
            <MacroSection
              key={macro.value}
              macroValue={macro.value}
              macroLabel={macro.label}
              materials={materialsByMacro[macro.value] || []}
              onView={setViewingMaterial}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
              defaultOpen={index === 0}
            />
          ))
        )}

        {/* Materiais sem MACRO */}
        {materialsByMacro['sem_macro']?.length > 0 && (
          <Card className="p-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-muted-foreground" />
                Sem Macro Definido
              </CardTitle>
            </CardHeader>
            <Table>
              <TableBody>
                {materialsByMacro['sem_macro'].map(m => (
                  <MaterialRow
                    key={m.id}
                    material={m}
                    onView={() => setViewingMaterial(m)}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                  />
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

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
          />
        )}
      </AnimatePresence>
    </div>
  );
});

export default GestaoMateriais;
