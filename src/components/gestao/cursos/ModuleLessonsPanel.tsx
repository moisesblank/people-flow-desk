// ============================================
// 🎛️ MODULE LESSONS PANEL — FULL PARITY v1.1
// Painel completo de gestão de aulas dentro do módulo
// Paridade total com /gestaofc/videoaulas
// NOVO: Suporte a Material Complementar (PDF)
// ============================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { formatError } from '@/lib/utils/formatError';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Plus, Trash2, Edit2, Eye, EyeOff, GripVertical,
  Video, PlayCircle, Clock, Save, X, ChevronDown, ChevronUp,
  ExternalLink, Youtube, Tv, Link2, Check, AlertTriangle, Hash,
  FileText, Upload, File, Loader2
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ============================================
// TYPES
// ============================================
interface Lesson {
  id: string;
  module_id: string | null;
  title: string;
  description?: string | null;
  video_url?: string | null;
  video_provider?: string | null;
  panda_video_id?: string | null;
  youtube_video_id?: string | null;
  position: number;
  is_published: boolean;
  is_free?: boolean | null;
  duration_minutes?: number | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  // Material Complementar (PDF)
  material_url?: string | null;
  material_nome?: string | null;
}

interface ModuleLessonsPanelProps {
  moduleId: string;
  moduleName: string;
}

// ============================================
// HOOKS
// ============================================
function useModuleLessons(moduleId: string) {
  return useQuery({
    queryKey: ['module-lessons-panel', moduleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('module_id', moduleId)
        .order('position', { ascending: true });
      
      if (error) throw error;
      return data as Lesson[];
    },
    enabled: !!moduleId
  });
}

// ============================================
// SORTABLE LESSON ROW
// ============================================
function SortableLessonRow({
  lesson,
  onEdit,
  onDelete,
  onTogglePublish,
}: {
  lesson: Lesson;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePublish: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getProviderIcon = () => {
    if (lesson.panda_video_id) return <Tv className="h-3.5 w-3.5 text-orange-400" />;
    if (lesson.youtube_video_id) return <Youtube className="h-3.5 w-3.5 text-red-400" />;
    if (lesson.video_url) return <Link2 className="h-3.5 w-3.5 text-blue-400" />;
    return <Video className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  const hasPdfMaterial = !!lesson.material_url;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-3 p-3 rounded-xl border transition-all",
        "bg-gradient-to-r from-card/80 to-card/60",
        lesson.is_published 
          ? "border-green-500/30 hover:border-green-500/50" 
          : "border-border/40 hover:border-border/60 opacity-60",
        isDragging && "z-50 shadow-2xl scale-[1.02] bg-card border-cyan-500"
      )}
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="p-1.5 rounded-lg hover:bg-muted/50 cursor-grab active:cursor-grabbing touch-none"
        title="Arrastar para reordenar"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* Position Badge */}
      <Badge variant="outline" className="text-xs shrink-0 border-border/50">
        #{lesson.position + 1}
      </Badge>

      {/* Provider Icon */}
      <div className="shrink-0">
        {getProviderIcon()}
      </div>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{lesson.title}</p>
          {hasPdfMaterial && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-red-500/50 text-red-400 shrink-0">
              <FileText className="h-2.5 w-2.5 mr-0.5" />
              PDF
            </Badge>
          )}
        </div>
        {lesson.duration_minutes && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <Clock className="h-3 w-3" />
            {lesson.duration_minutes} min
          </p>
        )}
      </div>

      {/* Status & Actions - Always visible for quick access */}
      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-8 w-8 rounded-lg",
            lesson.is_published 
              ? "hover:bg-amber-500/20 text-green-400" 
              : "hover:bg-green-500/20 text-muted-foreground"
          )}
          onClick={onTogglePublish}
          title={lesson.is_published ? "Despublicar" : "Publicar"}
        >
          {lesson.is_published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg hover:bg-cyan-500/20 text-cyan-400"
          onClick={onEdit}
          title="Editar aula"
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg hover:bg-destructive/20 text-destructive"
          onClick={onDelete}
          title="Excluir aula"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ============================================
// LESSON EDIT DIALOG
// ============================================
function LessonEditDialog({
  lesson,
  open,
  onOpenChange,
  moduleId,
  nextPosition,
}: {
  lesson: Lesson | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleId: string;
  nextPosition: number;
}) {
  const queryClient = useQueryClient();
  const isNew = !lesson;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_url: '',
    video_provider: 'youtube' as string,
    panda_video_id: '',
    youtube_video_id: '',
    duration_minutes: null as number | null,
    position: 0,
    is_published: true,
    is_free: false,
    // Material Complementar (PDF)
    material_url: '',
    material_nome: '',
  });

  // Reset form when lesson changes
  useEffect(() => {
    if (lesson) {
      setFormData({
        title: lesson.title || '',
        description: lesson.description || '',
        video_url: lesson.video_url || '',
        video_provider: lesson.video_provider || 'youtube',
        panda_video_id: lesson.panda_video_id || '',
        youtube_video_id: lesson.youtube_video_id || '',
        duration_minutes: lesson.duration_minutes,
        position: lesson.position,
        is_published: lesson.is_published ?? true,
        is_free: lesson.is_free ?? false,
        material_url: lesson.material_url || '',
        material_nome: lesson.material_nome || '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        video_url: '',
        video_provider: 'youtube',
        panda_video_id: '',
        youtube_video_id: '',
        duration_minutes: null,
        position: nextPosition,
        is_published: true,
        is_free: false,
        material_url: '',
        material_nome: '',
      });
    }
  }, [lesson, nextPosition]);

  // Handle PDF upload
  const handlePdfUpload = async (file: File) => {
    if (!file) return;
    
    // Validate file type
    if (file.type !== 'application/pdf') {
      toast.error("Apenas arquivos PDF são aceitos");
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast.error("O arquivo deve ter no máximo 50MB");
      return;
    }

    setIsUploadingPdf(true);

    try {
      // Generate unique path
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `lessons/${moduleId}/${timestamp}_${sanitizedName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('materiais')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) throw error;

      // 🛡️ P0 FIX: Salvar apenas o PATH no banco (não URL pública)
      // O frontend irá gerar URL assinada quando precisar exibir
      setFormData(prev => ({
        ...prev,
        material_url: path, // Store path, not full URL
        material_nome: file.name,
      }));

      toast.success("PDF enviado com sucesso!");
    } catch (error: unknown) {
      console.error('Erro ao fazer upload do PDF:', error);
      toast.error(`Erro ao enviar PDF: ${formatError(error)}`);
    } finally {
      setIsUploadingPdf(false);
    }
  };

  // Remove PDF
  const handleRemovePdf = async () => {
    if (formData.material_url) {
      try {
        // Delete from storage
        await supabase.storage
          .from('materiais')
          .remove([formData.material_url]);
      } catch (error) {
        console.warn('Erro ao remover arquivo do storage:', error);
      }
    }
    
    setFormData(prev => ({
      ...prev,
      material_url: '',
      material_nome: '',
    }));
    toast.success("Material removido");
  };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from('lessons')
        .insert({
          module_id: moduleId,
          title: data.title,
          description: data.description || null,
          video_url: data.video_url || null,
          video_provider: data.video_provider,
          panda_video_id: data.panda_video_id || null,
          youtube_video_id: data.youtube_video_id || null,
          duration_minutes: data.duration_minutes,
          position: data.position,
          is_published: data.is_published,
          is_free: data.is_free,
          status: 'ativo',
          material_url: data.material_url || null,
          material_nome: data.material_nome || null,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Aula criada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['module-lessons-panel', moduleId] });
      queryClient.invalidateQueries({ queryKey: ['gestao-videoaulas'] });
      queryClient.invalidateQueries({ queryKey: ['gestao-all-modules'] });
      queryClient.invalidateQueries({ queryKey: ['gestao-module-lessons'] });
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      toast.error(`Erro ao criar: ${formatError(error)}`);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!lesson) throw new Error("Nenhuma aula selecionada");
      const { error } = await supabase
        .from('lessons')
        .update({
          title: data.title,
          description: data.description || null,
          video_url: data.video_url || null,
          video_provider: data.video_provider,
          panda_video_id: data.panda_video_id || null,
          youtube_video_id: data.youtube_video_id || null,
          duration_minutes: data.duration_minutes,
          position: data.position,
          is_published: data.is_published,
          is_free: data.is_free,
          material_url: data.material_url || null,
          material_nome: data.material_nome || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', lesson.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Aula atualizada!");
      queryClient.invalidateQueries({ queryKey: ['module-lessons-panel', moduleId] });
      queryClient.invalidateQueries({ queryKey: ['gestao-videoaulas'] });
      queryClient.invalidateQueries({ queryKey: ['gestao-all-modules'] });
      queryClient.invalidateQueries({ queryKey: ['gestao-module-lessons'] });
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      toast.error(`Erro ao atualizar: ${formatError(error)}`);
    },
  });

  const handleSave = () => {
    if (!formData.title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }
    if (isNew) {
      createMutation.mutate(formData);
    } else {
      updateMutation.mutate(formData);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card/95 backdrop-blur-xl border-primary/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20">
              {isNew ? <Plus className="h-5 w-5 text-green-400" /> : <Edit2 className="h-5 w-5 text-cyan-400" />}
            </div>
            {isNew ? 'Nova Videoaula' : 'Editar Videoaula'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-1">
          {/* Título */}
          <div className="space-y-2">
            <Label>Título *</Label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
              placeholder="Ex: Aula 01 - Introdução"
              className="bg-background/50"
            />
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
              placeholder="Descrição breve da aula..."
              rows={2}
              className="bg-background/50"
            />
          </div>

          <Separator className="my-2" />

          {/* Provedor de Vídeo */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Video className="h-4 w-4 text-primary" />
              Fonte do Vídeo
            </Label>
            <Select
              value={formData.video_provider}
              onValueChange={(v) => setFormData(p => ({ ...p, video_provider: v }))}
            >
              <SelectTrigger className="bg-background/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="panda">
                  <div className="flex items-center gap-2">
                    <Tv className="h-4 w-4 text-orange-400" />
                    Panda Video
                  </div>
                </SelectItem>
                <SelectItem value="youtube">
                  <div className="flex items-center gap-2">
                    <Youtube className="h-4 w-4 text-red-400" />
                    YouTube
                  </div>
                </SelectItem>
                <SelectItem value="url">
                  <div className="flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-blue-400" />
                    URL Direta
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* IDs/URLs condicionais */}
          {formData.video_provider === 'panda' && (
            <div className="space-y-2">
              <Label>Panda Video ID</Label>
              <Input
                value={formData.panda_video_id}
                onChange={(e) => setFormData(p => ({ ...p, panda_video_id: e.target.value }))}
                placeholder="ID do vídeo no Panda"
                className="bg-background/50 font-mono text-sm"
              />
            </div>
          )}

          {formData.video_provider === 'youtube' && (
            <div className="space-y-2">
              <Label>YouTube Video ID</Label>
              <Input
                value={formData.youtube_video_id}
                onChange={(e) => setFormData(p => ({ ...p, youtube_video_id: e.target.value }))}
                placeholder="Ex: dQw4w9WgXcQ"
                className="bg-background/50 font-mono text-sm"
              />
            </div>
          )}

          {formData.video_provider === 'url' && (
            <div className="space-y-2">
              <Label>URL do Vídeo</Label>
              <Input
                value={formData.video_url}
                onChange={(e) => setFormData(p => ({ ...p, video_url: e.target.value }))}
                placeholder="https://..."
                className="bg-background/50"
              />
            </div>
          )}

          <Separator className="my-2" />

          {/* Duração e Posição */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Duração (min)
              </Label>
              <Input
                type="number"
                value={formData.duration_minutes ?? ''}
                onChange={(e) => setFormData(p => ({ 
                  ...p, 
                  duration_minutes: e.target.value ? parseInt(e.target.value) : null 
                }))}
                placeholder="30"
                className="bg-background/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                Posição
              </Label>
              <Input
                type="number"
                min={0}
                value={formData.position}
                onChange={(e) => setFormData(p => ({ 
                  ...p, 
                  position: parseInt(e.target.value) || 0 
                }))}
                className="bg-background/50"
              />
            </div>
          </div>

          {/* Switches */}
          <div className="flex items-center gap-6 pt-2">
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_published}
                onCheckedChange={(v) => setFormData(p => ({ ...p, is_published: v }))}
              />
              <Label className="cursor-pointer flex items-center gap-2">
                {formData.is_published ? (
                  <><Eye className="h-4 w-4 text-green-400" /> Publicada</>
                ) : (
                  <><EyeOff className="h-4 w-4 text-muted-foreground" /> Oculta</>
                )}
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_free}
                onCheckedChange={(v) => setFormData(p => ({ ...p, is_free: v }))}
              />
              <Label className="cursor-pointer">Gratuita</Label>
            </div>
          </div>

          <Separator className="my-2" />

          {/* ============================================ */}
          {/* MATERIAL COMPLEMENTAR (PDF) */}
          {/* ============================================ */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-red-400" />
              Material Complementar (PDF)
            </Label>
            
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handlePdfUpload(file);
                e.target.value = ''; // Reset to allow re-upload
              }}
            />

            {formData.material_url ? (
              /* PDF Attached - Show preview card */
              <Card className="border-red-500/30 bg-gradient-to-r from-red-500/10 to-orange-500/10">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-500/20">
                    <File className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{formData.material_nome || 'material.pdf'}</p>
                    <p className="text-xs text-muted-foreground">PDF anexado</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-cyan-500/20"
                      onClick={() => {
                        const { data: { publicUrl } } = supabase.storage
                          .from('materiais')
                          .getPublicUrl(formData.material_url);
                        window.open(publicUrl, '_blank');
                      }}
                      title="Visualizar PDF"
                    >
                      <ExternalLink className="h-4 w-4 text-cyan-400" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-destructive/20"
                      onClick={handleRemovePdf}
                      title="Remover PDF"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* No PDF - Show upload button */
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "w-full h-20 border-dashed border-2 flex flex-col gap-2",
                  "hover:border-red-500/50 hover:bg-red-500/5 transition-all",
                  isUploadingPdf && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPdf}
              >
                {isUploadingPdf ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin text-red-400" />
                    <span className="text-xs text-muted-foreground">Enviando PDF...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Clique para anexar PDF (máx. 50MB)</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isPending || !formData.title.trim()}
            className="bg-gradient-to-r from-green-500 to-emerald-500"
          >
            <Save className="h-4 w-4 mr-2" />
            {isPending ? 'Salvando...' : isNew ? 'Criar' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// DELETE CONFIRMATION DIALOG
// ============================================
function DeleteConfirmDialog({
  lesson,
  open,
  onOpenChange,
  moduleId,
}: {
  lesson: Lesson | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleId: string;
}) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!lesson) throw new Error("Nenhuma aula selecionada");
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lesson.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Aula excluída!");
      queryClient.invalidateQueries({ queryKey: ['module-lessons-panel', moduleId] });
      queryClient.invalidateQueries({ queryKey: ['gestao-videoaulas'] });
      queryClient.invalidateQueries({ queryKey: ['gestao-all-modules'] });
      queryClient.invalidateQueries({ queryKey: ['gestao-module-lessons'] });
      onOpenChange(false);
    },
    onError: (error: unknown) => {
      toast.error(`Erro ao excluir: ${formatError(error)}`);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card/95 backdrop-blur-xl border-destructive/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Excluir Videoaula
          </DialogTitle>
        </DialogHeader>
        <p className="text-muted-foreground">
          Tem certeza que deseja excluir <strong>"{lesson?.title}"</strong>?
          <br />
          <span className="text-destructive text-sm">Esta ação não pode ser desfeita.</span>
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={() => deleteMutation.mutate()}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export function ModuleLessonsPanel({ moduleId, moduleName }: ModuleLessonsPanelProps) {
  const queryClient = useQueryClient();
  const { data: lessons = [], isLoading, refetch } = useModuleLessons(moduleId);

  // State
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteLesson, setDeleteLesson] = useState<Lesson | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  // DnD
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`module-lessons-${moduleId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lessons',
          filter: `module_id=eq.${moduleId}`,
        },
        (payload) => {
          console.log('[ModuleLessonsPanel] Realtime:', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ['module-lessons-panel', moduleId] });
          queryClient.invalidateQueries({ queryKey: ['gestao-all-modules'] });
          queryClient.invalidateQueries({ queryKey: ['gestao-videoaulas'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [moduleId, queryClient]);

  // Toggle publish mutation
  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { error } = await supabase
        .from('lessons')
        .update({ is_published })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success(variables.is_published ? "Aula publicada!" : "Aula despublicada!");
      queryClient.invalidateQueries({ queryKey: ['module-lessons-panel', moduleId] });
      queryClient.invalidateQueries({ queryKey: ['gestao-videoaulas'] });
      queryClient.invalidateQueries({ queryKey: ['gestao-all-modules'] });
    },
  });

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: async (updates: { id: string; position: number }[]) => {
      const promises = updates.map(({ id, position }) =>
        supabase.from('lessons').update({ position }).eq('id', id)
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      toast.success("Ordem atualizada!");
      queryClient.invalidateQueries({ queryKey: ['module-lessons-panel', moduleId] });
      queryClient.invalidateQueries({ queryKey: ['gestao-videoaulas'] });
      queryClient.invalidateQueries({ queryKey: ['gestao-module-lessons'] });
    },
  });

  // Drag end handler
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = lessons.findIndex((l) => l.id === active.id);
    const newIndex = lessons.findIndex((l) => l.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(lessons, oldIndex, newIndex);
    const updates = newOrder.map((lesson, index) => ({
      id: lesson.id,
      position: index,
    }));

    reorderMutation.mutate(updates);
  }, [lessons, reorderMutation]);

  // Handlers
  const handleEdit = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setEditDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingLesson(null);
    setEditDialogOpen(true);
  };

  const handleDelete = (lesson: Lesson) => {
    setDeleteLesson(lesson);
    setDeleteDialogOpen(true);
  };

  const handleTogglePublish = (lesson: Lesson) => {
    togglePublishMutation.mutate({
      id: lesson.id,
      is_published: !lesson.is_published,
    });
  };

  const nextPosition = lessons.length;
  const publishedCount = lessons.filter(l => l.is_published).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div className="flex items-center justify-between">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="gap-2 hover:bg-green-500/10">
              <PlayCircle className="h-5 w-5 text-green-400" />
              <span className="font-semibold">Videoaulas do Módulo</span>
              <Badge variant="secondary" className="ml-2">
                {publishedCount}/{lessons.length}
              </Badge>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          </CollapsibleTrigger>

          <Button
            size="sm"
            onClick={handleCreate}
            className="bg-gradient-to-r from-green-500 to-emerald-500"
          >
            <Plus className="h-4 w-4 mr-1" />
            Nova Aula
          </Button>
        </div>

        <CollapsibleContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando aulas...
            </div>
          ) : lessons.length === 0 ? (
            <Card className="border-dashed border-2 border-border/50 bg-muted/10 mt-4">
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <PlayCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-4">
                  Este módulo ainda não possui videoaulas
                </p>
                <Button onClick={handleCreate} variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar primeira aula
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="mt-4 space-y-2">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={lessons.map((l) => l.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {lessons.map((lesson) => (
                    <SortableLessonRow
                      key={lesson.id}
                      lesson={lesson}
                      onEdit={() => handleEdit(lesson)}
                      onDelete={() => handleDelete(lesson)}
                      onTogglePublish={() => handleTogglePublish(lesson)}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Edit/Create Dialog */}
      <LessonEditDialog
        lesson={editingLesson}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        moduleId={moduleId}
        nextPosition={nextPosition}
      />

      {/* Delete Dialog */}
      <DeleteConfirmDialog
        lesson={deleteLesson}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        moduleId={moduleId}
      />
    </div>
  );
}

export default ModuleLessonsPanel;
