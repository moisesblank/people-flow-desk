// ============================================
// 📚 CURSO COMPONENTS — Extracted for Build Optimization
// Componentes extraídos de GestaoCursos.tsx
// ============================================

import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  ChevronRight, Check, AlertTriangle, MoreHorizontal,
  Edit2, Trash2, Eye, EyeOff, Upload, GripVertical
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { SacredImage } from '@/components/performance/SacredImage';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// ============================================
// TIPOS
// ============================================
export interface Module {
  id: string;
  course_id: string;
  name: string;
  title?: string;
  description: string | null;
  position: number;
  is_published: boolean;
  status: string | null;
  xp_reward: number | null;
  thumbnail_url: string | null;
  icon: string | null;
  color: string | null;
  slug: string | null;
  created_at: string;
  updated_at: string;
}

interface LessonBasic {
  id: string;
  module_id: string;
  title: string;
  position: number;
  is_published: boolean;
  status: string | null;
}

// ============================================
// useLessons Hook (for ModuleItem)
// ============================================
function useLessons(moduleId?: string) {
  return useQuery({
    queryKey: ['gestao-lessons', moduleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lessons')
        .select('id, module_id, title, position, is_published, status')
        .eq('module_id', moduleId!)
        .order('position', { ascending: true });
      if (error) throw error;
      return data as LessonBasic[];
    },
    enabled: !!moduleId
  });
}

// ============================================
// STAT ORB COMPONENT — IRON MAN HUD STYLE
// ============================================
interface StatOrbProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: 'blue' | 'purple' | 'green' | 'red' | 'amber';
  delay?: number;
}

export function StatOrb({ icon, value, label, color, delay = 0 }: StatOrbProps) {
  const colorMap = {
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 shadow-blue-500/20',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 shadow-purple-500/20',
    green: 'from-green-500/20 to-green-600/10 border-green-500/30 shadow-green-500/20',
    red: 'from-red-500/20 to-red-600/10 border-red-500/30 shadow-red-500/20',
    amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/30 shadow-amber-500/20',
  };
  
  const iconColorMap = {
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    green: 'text-green-400',
    red: 'text-red-400',
    amber: 'text-amber-400',
  };

  return (
    <div 
      className={cn(
        "relative group cursor-default",
        "bg-gradient-to-br border rounded-2xl p-4",
        "backdrop-blur-sm",
        "transition-all duration-300 hover:scale-[1.02]",
        "shadow-lg hover:shadow-xl",
        "animate-fade-in",
        colorMap[color]
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={cn(
        "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100",
        "transition-opacity duration-500",
        "bg-gradient-to-br",
        colorMap[color]
      )} />
      
      <div className="relative flex items-center gap-3">
        <div className={cn(
          "p-2 rounded-xl bg-background/50",
          iconColorMap[color]
        )}>
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
      
      <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none opacity-30">
        <div className="absolute inset-0 scanline-effect" />
      </div>
    </div>
  );
}

// ============================================
// SORTABLE MODULE ITEM — DRAG & DROP
// ============================================
interface SortableModuleItemProps {
  module: Module;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  onImageUpdate: (moduleId: string, imageUrl: string) => void;
  onPositionUpdate: (moduleId: string, newPosition: number) => void;
}

export function SortableModuleItem(props: SortableModuleItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.module.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  return (
    <div ref={setNodeRef} style={style}>
      <ModuleItem {...props} dragListeners={listeners} dragAttributes={attributes} />
    </div>
  );
}

// ============================================
// COMPONENTE DE MÓDULO — CSS-ONLY ANIMATIONS
// ============================================
interface ModuleItemProps {
  module: Module;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  onImageUpdate: (moduleId: string, imageUrl: string) => void;
  onPositionUpdate: (moduleId: string, newPosition: number) => void;
  dragListeners?: any;
  dragAttributes?: any;
}

export function ModuleItem({ 
  module, index, isExpanded, onToggle, onEdit, onDelete, 
  onToggleActive, onImageUpdate, onPositionUpdate, 
  dragListeners, dragAttributes 
}: ModuleItemProps) {
  const { data: lessons } = useLessons(isExpanded ? module.id : undefined);
  const [isUploading, setIsUploading] = useState(false);
  const [positionInput, setPositionInput] = useState(String(module.position));
  const [isSavingPosition, setIsSavingPosition] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    setPositionInput(String(module.position));
  }, [module.position]);
  
  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Arquivo inválido', description: 'Selecione apenas imagens.', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Arquivo muito grande', description: 'Máximo 5MB.', variant: 'destructive' });
      return;
    }
    
    setIsUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `module_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
      const filePath = `modules/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('materiais')
        .upload(filePath, file, { cacheControl: '3600', upsert: false });
      
      if (uploadError) throw uploadError;
      
      // 🛡️ P0 FIX: Salvar apenas o PATH no banco (não URL pública)
      // O frontend irá gerar URL assinada quando precisar exibir
      onImageUpdate(module.id, filePath);
      toast({ title: '✅ Imagem enviada!' });
    } catch (error: any) {
      toast({ title: 'Erro no upload', description: error.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };
  
  const handlePositionChange = async () => {
    const newPos = parseInt(positionInput);
    if (isNaN(newPos) || newPos < 0) {
      setPositionInput(String(module.position));
      return;
    }
    if (newPos === module.position) return;
    
    setIsSavingPosition(true);
    try {
      onPositionUpdate(module.id, newPos);
    } finally {
      setIsSavingPosition(false);
    }
  };
  
  return (
    <div
      className={cn(
        "rounded-xl border transition-all duration-300",
        "animate-fade-in hover:scale-[1.01]",
        module.is_published 
          ? "bg-card/50 border-border/30 hover:border-purple-500/30" 
          : "bg-muted/30 opacity-60 border-border/20"
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
      />
      
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <div className="flex items-center gap-2 p-3">
          <div 
            {...dragListeners} 
            {...dragAttributes}
            className="cursor-grab active:cursor-grabbing p-1.5 rounded-lg hover:bg-purple-500/20 transition-colors shrink-0 touch-none"
            title="Arraste para reordenar"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground hover:text-purple-400 transition-colors" />
          </div>
          
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 hover:bg-purple-500/10">
              <ChevronRight className={cn(
                "h-4 w-4 transition-transform duration-200",
                isExpanded && "rotate-90"
              )} />
            </Button>
          </CollapsibleTrigger>
          
          {module.thumbnail_url ? (
            <div 
              className="relative w-[60px] h-[75px] rounded-lg overflow-hidden border border-green-500/30 bg-muted shrink-0 shadow-lg cursor-pointer hover:opacity-80 transition-opacity group"
              onClick={() => fileInputRef.current?.click()}
              title="Clique para trocar a imagem (752×940px)"
            >
              <SacredImage 
                src={module.thumbnail_url} 
                alt={module.title} 
                className="w-full h-full"
                objectFit="cover"
                onError={() => {}}
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Upload className="h-4 w-4 text-white" />
              </div>
              <div className="absolute bottom-0 right-0 bg-green-600 p-0.5 rounded-tl">
                <Check className="h-2.5 w-2.5 text-white" />
              </div>
            </div>
          ) : (
            <div 
              className={cn(
                "relative w-[60px] h-[75px] rounded-lg overflow-hidden border-2 border-dashed shrink-0 flex items-center justify-center cursor-pointer transition-all",
                isUploading 
                  ? "border-amber-500/50 bg-amber-500/10" 
                  : "border-destructive/50 bg-destructive/10 hover:border-amber-500/50 hover:bg-amber-500/10"
              )}
              onClick={() => !isUploading && fileInputRef.current?.click()}
              title="Clique para adicionar imagem (752×940px)"
            >
              {isUploading ? (
                <div className="animate-spin h-5 w-5 border-2 border-amber-500 border-t-transparent rounded-full" />
              ) : (
                <Upload className="h-5 w-5 text-destructive hover:text-amber-500 transition-colors" />
              )}
            </div>
          )}
          
          <div className="flex flex-col items-center shrink-0">
            <span className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">Pos</span>
            <Input
              type="number"
              min={0}
              value={positionInput}
              onChange={(e) => setPositionInput(e.target.value)}
              onBlur={handlePositionChange}
              onKeyDown={(e) => e.key === 'Enter' && handlePositionChange()}
              className={cn(
                "w-12 h-7 text-center text-xs font-mono p-0 border-purple-500/30 bg-purple-500/10 focus:ring-purple-500/50",
                isSavingPosition && "opacity-50"
              )}
              disabled={isSavingPosition}
            />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-medium truncate">{module.title}</h4>
              {!module.is_published && (
                <Badge variant="secondary" className="text-xs bg-muted/50">Inativo</Badge>
              )}
              {!module.thumbnail_url && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Sem imagem
                </Badge>
              )}
            </div>
            {module.description && (
              <p className="text-sm text-muted-foreground truncate mt-1">
                {module.description}
              </p>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-purple-500/10">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card/95 backdrop-blur-sm border-border/50">
              <DropdownMenuItem onClick={onEdit}>
                <Edit2 className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToggleActive}>
                {module.is_published ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Desativar
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Ativar
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <CollapsibleContent>
          <div className="px-4 pb-4 pt-2 border-t border-border/20">
            {lessons && lessons.length > 0 ? (
              <div className="space-y-1">
                {lessons.map((lesson, i) => (
                  <div 
                    key={lesson.id}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg",
                      "bg-muted/30 hover:bg-muted/50 transition-colors",
                      !lesson.is_published && "opacity-50"
                    )}
                  >
                    <span className="text-xs text-muted-foreground font-mono w-6">
                      #{lesson.position}
                    </span>
                    <span className="text-sm flex-1 truncate">{lesson.title}</span>
                    {!lesson.is_published && (
                      <Badge variant="secondary" className="text-[10px]">Inativo</Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma aula cadastrada
              </p>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
