// ============================================
// 📚 GESTÃO DE CURSOS E MÓDULOS — DESIGN 2300
// Sistema completo de CRUD para LMS
// Hierarquia: Curso → Módulo → Aula
// CSS-ONLY ANIMATIONS (LEI I PERFORMANCE v2.0)
// 🔄 REALTIME: Sincronização entre múltiplos admins
// ============================================

import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Plus, Search, Edit2, Trash2, GraduationCap, BookOpen, 
  Layers, ChevronRight, ChevronDown, Eye, EyeOff, 
  Save, X, FolderOpen, PlayCircle, Clock, Users,
  MoreHorizontal, Copy, ArrowUpDown, Grip, Check, AlertTriangle,
  Sparkles, Zap, Wand2, Upload, GripVertical
} from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SacredImage } from '@/components/performance/SacredImage';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { CyberBackground } from '@/components/ui/cyber-background';
import { FuturisticPageHeader } from '@/components/ui/futuristic-page-header';
import { ModulosGlobalManager } from '@/components/gestao/cursos/ModulosGlobalManager';
import { CourseMasterMode } from '@/components/gestao/cursos/CourseMasterMode';
import { ModuleImageUploader } from '@/components/gestao/cursos/ModuleImageUploader';
import { StatOrb, SortableModuleItem, ModuleItem, type Module } from '@/components/gestao/cursos/CursoComponents';

// ============================================
// TIPOS (baseados no schema real do banco)
// ============================================
interface Course {
  id: string;
  title: string;
  description: string | null;
  slug: string | null;
  thumbnail_url: string | null;
  category: string | null;
  difficulty_level: string | null;
  estimated_hours: number | null;
  is_published: boolean;
  total_xp: number | null;
  created_at: string;
  updated_at: string;
  status: string | null;
  price: number | null;
}

interface Lesson {
  id: string;
  module_id: string;
  title: string;
  position: number;
  is_published: boolean;
  status: string | null;
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
// HOOKS DE DADOS
// ============================================
function useCourses() {
  return useQuery({
    queryKey: ['gestao-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Course[];
    }
  });
}

function useModules(courseId?: string) {
  return useQuery({
    queryKey: ['gestao-modules', courseId],
    queryFn: async () => {
      // FONTE DA VERDADE: Tabela 'modules' (onde lessons.module_id aponta)
      let query = supabase
        .from('modules')
        .select('id, title, description, course_id, position, is_published, status, xp_reward, thumbnail_url, created_at, updated_at')
        .order('position', { ascending: true });
      
      if (courseId) {
        query = query.eq('course_id', courseId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      // Mapear para interface Module esperada
      return (data || []).map(mod => ({
        id: mod.id,
        name: mod.title,
        title: mod.title,
        slug: null,
        course_id: mod.course_id,
        position: mod.position,
        is_published: mod.is_published ?? true,
        status: mod.status || 'active',
        xp_reward: mod.xp_reward,
        thumbnail_url: mod.thumbnail_url,
        description: mod.description,
        icon: null,
        color: null,
        created_at: mod.created_at,
        updated_at: mod.updated_at
      })) as Module[];
    },
    enabled: !!courseId || courseId === undefined
  });
}

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
// 🔄 REALTIME HOOK - Sincronização entre admins
// ============================================
function useGestaoLMSRealtime(queryClient: ReturnType<typeof useQueryClient>) {
  useEffect(() => {
    const channel = supabase
      .channel('gestao-lms-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'courses' },
        () => {
          console.log('[REALTIME-GESTAO] Courses atualizado');
          queryClient.invalidateQueries({ queryKey: ['gestao-courses'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'modules' },
        () => {
          console.log('[REALTIME-GESTAO] Modules atualizado');
          queryClient.invalidateQueries({ queryKey: ['gestao-modules'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lessons' },
        () => {
          console.log('[REALTIME-GESTAO] Lessons atualizado');
          queryClient.invalidateQueries({ queryKey: ['gestao-lessons'] });
        }
      )
      .subscribe((status) => {
        console.log('[REALTIME-GESTAO] Status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

// StatOrb, SortableModuleItem e ModuleItem foram extraídos para:
// src/components/gestao/cursos/CursoComponents.tsx

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export default function GestaoCursos() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // 🔄 REALTIME: Sincronização entre múltiplos admins
  useGestaoLMSRealtime(queryClient);
  
  // Tab state - Cursos ou Módulos
  const [activeTab, setActiveTab] = useState<'cursos' | 'modulos'>('cursos');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  
  // Dialogs
  const [courseDialog, setCourseDialog] = useState(false);
  const [moduleDialog, setModuleDialog] = useState(false);
  const [masterModeOpen, setMasterModeOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ type: 'course' | 'module'; id: string; name: string } | null>(null);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  
  // Form states
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    slug: '',
    category: '',
    difficulty_level: 'iniciante',
    estimated_hours: 10,
    is_published: false,
    total_xp: 100,
    thumbnail_url: ''
  });
  
  const [moduleForm, setModuleForm] = useState({
    title: '',
    description: '',
    position: 0,
    is_published: true,
    thumbnail_url: ''
  });
  
  // Queries
  const { data: courses, isLoading: loadingCourses } = useCourses();
  const { data: modules, isLoading: loadingModules } = useModules(selectedCourse?.id);
  
  // Mutations
  const createCourse = useMutation({
    mutationFn: async (data: typeof courseForm) => {
      const slug = data.slug || data.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const { data: result, error } = await supabase
        .from('courses')
        .insert({ ...data, slug })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gestao-courses'] });
      toast({ title: '✅ Curso criado!', description: 'O curso foi adicionado com sucesso.' });
      setCourseDialog(false);
      resetCourseForm();
    },
    onError: (err: any) => {
      toast({ title: '❌ Erro ao criar curso', description: err.message, variant: 'destructive' });
    }
  });
  
  const updateCourse = useMutation({
    mutationFn: async (data: Partial<Course> & { id: string }) => {
      const { id, ...updates } = data;
      const { error } = await supabase
        .from('courses')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gestao-courses'] });
      toast({ title: '✅ Curso atualizado!' });
      setCourseDialog(false);
      setEditingCourse(null);
      resetCourseForm();
    },
    onError: (err: any) => {
      toast({ title: '❌ Erro ao atualizar', description: err.message, variant: 'destructive' });
    }
  });
  
  const deleteCourse = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gestao-courses'] });
      toast({ title: '🗑️ Curso excluído' });
      setDeleteDialog(null);
      if (selectedCourse?.id === deleteDialog?.id) {
        setSelectedCourse(null);
      }
    },
    onError: (err: any) => {
      toast({ title: '❌ Erro ao excluir', description: err.message, variant: 'destructive' });
    }
  });
  
  const createModule = useMutation({
    mutationFn: async (data: typeof moduleForm & { course_id: string }) => {
      // FONTE DA VERDADE: Tabela 'modules'
      const { data: result, error } = await supabase
        .from('modules')
        .insert({
          title: data.title,
          description: data.description,
          position: data.position,
          is_published: data.is_published,
          thumbnail_url: data.thumbnail_url,
          course_id: data.course_id,
          status: 'active'
        })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gestao-modules'] });
      toast({ title: '✅ Módulo criado!' });
      setModuleDialog(false);
      resetModuleForm();
    },
    onError: (err: any) => {
      toast({ title: '❌ Erro ao criar módulo', description: err.message, variant: 'destructive' });
    }
  });
  
  const updateModule = useMutation({
    mutationFn: async (data: Partial<Module> & { id: string }) => {
      const { id, title, name, is_published, ...rest } = data;
      // FONTE DA VERDADE: Tabela 'modules'
      const updateData: Record<string, any> = { ...rest };
      if (title !== undefined || name !== undefined) {
        updateData.title = title || name;
      }
      if (is_published !== undefined) {
        updateData.is_published = is_published;
      }
      const { error } = await supabase
        .from('modules')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gestao-modules'] });
      toast({ title: '✅ Módulo atualizado!' });
      setModuleDialog(false);
      setEditingModule(null);
      resetModuleForm();
    },
    onError: (err: any) => {
      toast({ title: '❌ Erro ao atualizar', description: err.message, variant: 'destructive' });
    }
  });
  
  const deleteModule = useMutation({
    mutationFn: async (id: string) => {
      // FONTE DA VERDADE: Tabela 'modules'
      const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gestao-modules'] });
      toast({ title: '🗑️ Módulo excluído' });
      setDeleteDialog(null);
    },
    onError: (err: any) => {
      toast({ title: '❌ Erro ao excluir', description: err.message, variant: 'destructive' });
    }
  });
  
  // ============================================
  // DRAG & DROP — Reordenação de módulos
  // ============================================
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const moduleIds = useMemo(() => modules?.map(m => m.id) || [], [modules]);
  
  const activeModule = useMemo(() => {
    if (!activeModuleId || !modules) return null;
    return modules.find(m => m.id === activeModuleId) || null;
  }, [activeModuleId, modules]);
  
  const handleDragStart = (event: DragStartEvent) => {
    setActiveModuleId(event.active.id as string);
  };
  
  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveModuleId(null);
    const { active, over } = event;
    
    if (!over || active.id === over.id || !modules) return;
    
    const oldIndex = modules.findIndex(m => m.id === active.id);
    const newIndex = modules.findIndex(m => m.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;
    
    // Reordenar localmente para feedback imediato
    const reorderedModules = arrayMove(modules, oldIndex, newIndex);
    
    // Atualizar posições no banco
    try {
      const updates = reorderedModules.map((mod, idx) => ({
        id: mod.id,
        position: idx
      }));
      
      // Batch update - atualiza todos os módulos afetados
      for (const update of updates) {
        const { error } = await supabase
          .from('modules')
          .update({ position: update.position })
          .eq('id', update.id);
        if (error) throw error;
      }
      
      // Invalidar cache para refletir nova ordem
      queryClient.invalidateQueries({ queryKey: ['gestao-modules', selectedCourse?.id] });
      toast({ title: '✅ Ordem atualizada!' });
    } catch (error: any) {
      toast({ 
        title: '❌ Erro ao reordenar', 
        description: error.message, 
        variant: 'destructive' 
      });
      // Refetch para restaurar ordem original
      queryClient.invalidateQueries({ queryKey: ['gestao-modules', selectedCourse?.id] });
    }
  };
  
  // Helpers
  const resetCourseForm = () => {
    setCourseForm({
      title: '',
      description: '',
      slug: '',
      category: '',
      difficulty_level: 'iniciante',
      estimated_hours: 10,
      is_published: false,
      total_xp: 100,
      thumbnail_url: ''
    });
  };
  
  const resetModuleForm = () => {
    setModuleForm({
      title: '',
      description: '',
      position: modules?.length || 0,
      is_published: true,
      thumbnail_url: ''
    });
  };
  
  const openEditCourse = (course: Course) => {
    setEditingCourse(course);
    setCourseForm({
      title: course.title,
      description: course.description || '',
      slug: course.slug || '',
      category: course.category || '',
      difficulty_level: course.difficulty_level || 'iniciante',
      estimated_hours: course.estimated_hours || 10,
      is_published: course.is_published,
      total_xp: course.total_xp || 100,
      thumbnail_url: course.thumbnail_url || ''
    });
    setCourseDialog(true);
  };
  
  const openEditModule = (module: Module) => {
    setEditingModule(module);
    setModuleForm({
      title: module.title,
      description: module.description || '',
      position: module.position,
      is_published: module.is_published,
      thumbnail_url: module.thumbnail_url || ''
    });
    setModuleDialog(true);
  };
  
  const openNewModule = () => {
    setEditingModule(null);
    resetModuleForm();
    setModuleForm(prev => ({ ...prev, position: modules?.length || 0 }));
    setModuleDialog(true);
  };
  
  const toggleModuleExpand = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };
  
  const filteredCourses = courses?.filter(course => 
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];
  
  // ============================================
  // RENDER — DESIGN 2300 CINEMATIC
  // ============================================
  return (
    <>
    <CourseMasterMode 
      isOpen={masterModeOpen} 
      onClose={() => setMasterModeOpen(false)}
      initialCourseId={selectedCourse?.id}
    />
    <div className="relative min-h-screen">
      {/* Cyber Background */}
      <CyberBackground variant="grid" className="opacity-30" />
      
      <div className="relative container mx-auto py-6 px-4 space-y-6">
        {/* Header Futurístico */}
        <FuturisticPageHeader
          title="Gestão de Cursos"
          subtitle="Sistema completo de gerenciamento do LMS"
          icon={GraduationCap}
          accentColor="primary"
          action={
            activeTab === 'cursos' ? (
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => setMasterModeOpen(true)} 
                  variant="outline"
                  className="gap-2 border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
                >
                  <Wand2 className="h-4 w-4" />
                  MODO MASTER
                </Button>
                <Button 
                  onClick={() => { setEditingCourse(null); resetCourseForm(); setCourseDialog(true); }} 
                  className="gap-2 bg-primary/90 hover:bg-primary shadow-lg shadow-primary/25"
                >
                  <Plus className="h-4 w-4" />
                  Novo Curso
                </Button>
              </div>
            ) : null
          }
        />
        
        {/* Tabs de Navegação - Cursos / Módulos */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'cursos' | 'modulos')} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-card/80 backdrop-blur-sm border border-border/50">
            <TabsTrigger 
              value="cursos" 
              className="gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
            >
              <BookOpen className="h-4 w-4" />
              Cursos
            </TabsTrigger>
            <TabsTrigger 
              value="modulos" 
              className="gap-2 data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400"
            >
              <Layers className="h-4 w-4" />
              Módulos
            </TabsTrigger>
          </TabsList>
          
          {/* ========== TAB: CURSOS ========== */}
          <TabsContent value="cursos" className="mt-6 space-y-6">
            {/* Stats — Iron Man HUD Orbs */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatOrb
                icon={<BookOpen className="h-6 w-6" />}
                value={courses?.length || 0}
                label="Cursos"
                color="blue"
                delay={0}
              />
              <StatOrb
                icon={<Layers className="h-6 w-6" />}
                value={modules?.length || 0}
                label="Módulos"
                color="purple"
                delay={50}
              />
              <StatOrb
                icon={<Check className="h-6 w-6" />}
                value={modules?.filter(m => m.thumbnail_url).length || 0}
                label="Conformes"
                color="green"
                delay={100}
              />
              <StatOrb
                icon={<AlertTriangle className="h-6 w-6" />}
                value={modules?.filter(m => !m.thumbnail_url).length || 0}
                label="Sem Imagem"
                color="red"
                delay={150}
              />
              <StatOrb
                icon={<EyeOff className="h-6 w-6" />}
                value={courses?.filter(c => !c.is_published).length || 0}
                label="Rascunhos"
                color="amber"
                delay={200}
              />
            </div>
            
            {/* Main Content — Split View com Cards Neon */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0 flex-1">
          {/* Left: Course List — Glassmorphism Card */}
          <div className="relative group flex flex-col min-h-0">
            {/* Neon border glow */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/50 via-purple-500/50 to-blue-500/50 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
            
            <Card className="relative flex-1 min-h-[500px] max-h-[75vh] flex flex-col bg-card/80 backdrop-blur-sm border-2 border-border/50 hover:border-blue-500/40 rounded-2xl overflow-hidden transition-colors duration-300">
              <CardHeader className="shrink-0 border-b-2 border-border/30 bg-gradient-to-r from-blue-500/10 via-card to-purple-500/10 py-5 px-5">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/30 to-purple-500/30 border border-blue-500/40">
                      <Sparkles className="h-5 w-5 text-blue-300" />
                    </div>
                    Cursos
                  </CardTitle>
                  <Badge variant="secondary" className="px-3 py-1 text-sm bg-blue-500/20 text-blue-300 border-2 border-blue-500/40 font-bold">
                    {filteredCourses.length}
                  </Badge>
                </div>
                <div className="relative mt-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar cursos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-11 bg-background/50 border-2 border-border/50 focus:border-blue-500/50 rounded-xl"
                  />
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0 min-h-0 overflow-hidden">
                <ScrollArea className="h-full w-full">
                  {loadingCourses ? (
                    <div className="p-4 space-y-3">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-20 bg-muted/30 animate-pulse rounded-xl" />
                      ))}
                    </div>
                  ) : filteredCourses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                      <div className="p-4 rounded-full bg-blue-500/10 mb-4">
                        <BookOpen className="h-12 w-12 text-blue-400" />
                      </div>
                      <h3 className="font-medium">Nenhum curso encontrado</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Crie seu primeiro curso para começar
                      </p>
                      <Button 
                        variant="outline" 
                        className="mt-4 border-blue-500/30 hover:bg-blue-500/10"
                        onClick={() => { setEditingCourse(null); resetCourseForm(); setCourseDialog(true); }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Criar Curso
                      </Button>
                    </div>
                  ) : (
                    <div className="p-3 space-y-2">
                      {filteredCourses.map((course, idx) => (
                        <div
                          key={course.id}
                          className={cn(
                            "p-4 rounded-xl border cursor-pointer transition-all duration-300",
                            "animate-fade-in hover:scale-[1.01]",
                            selectedCourse?.id === course.id 
                              ? "bg-primary/10 border-primary/50 shadow-lg shadow-primary/10" 
                              : "bg-card/50 hover:bg-muted/50 border-border/30 hover:border-border/60"
                          )}
                          style={{ animationDelay: `${idx * 30}ms` }}
                          onClick={() => setSelectedCourse(course)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-medium truncate">{course.title}</h4>
                                {course.is_published ? (
                                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                                    <Eye className="h-3 w-3 mr-1" />
                                    Publicado
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="text-xs bg-muted/50">
                                    <EyeOff className="h-3 w-3 mr-1" />
                                    Rascunho
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {course.description || 'Sem descrição'}
                              </p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                {course.category && (
                                  <span className="flex items-center gap-1">
                                    <FolderOpen className="h-3 w-3" />
                                    {course.category}
                                  </span>
                                )}
                                {course.estimated_hours && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {course.estimated_hours}h
                                  </span>
                                )}
                                <span className="flex items-center gap-1 text-amber-400">
                                  <Zap className="h-3 w-3" />
                                  {course.total_xp} XP
                                </span>
                              </div>
                            </div>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={(e) => e.stopPropagation()}>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-card/95 backdrop-blur-sm border-border/50">
                                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditCourse(course); }}>
                                  <Edit2 className="h-4 w-4 mr-2" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    updateCourse.mutate({ id: course.id, is_published: !course.is_published });
                                  }}
                                >
                                  {course.is_published ? (
                                    <><EyeOff className="h-4 w-4 mr-2" />Despublicar</>
                                  ) : (
                                    <><Eye className="h-4 w-4 mr-2" />Publicar</>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  className="text-destructive"
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    setDeleteDialog({ type: 'course', id: course.id, name: course.title });
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
          
          {/* Right: Modules Panel — Glassmorphism Card */}
          <div className="relative group flex flex-col min-h-0">
            {/* Neon border glow */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/50 via-pink-500/50 to-purple-500/50 rounded-2xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
            
            <Card className="relative flex-1 min-h-[500px] max-h-[75vh] flex flex-col bg-card/80 backdrop-blur-sm border-2 border-border/50 hover:border-purple-500/40 rounded-2xl overflow-hidden transition-colors duration-300">
              <CardHeader className="shrink-0 border-b-2 border-border/30 bg-gradient-to-r from-purple-500/10 via-card to-pink-500/10 py-5 px-5">
                {selectedCourse ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 border border-purple-500/40">
                            <Layers className="h-5 w-5 text-purple-300" />
                          </div>
                          Módulos
                        </CardTitle>
                        <CardDescription className="mt-2 text-base text-muted-foreground truncate max-w-[300px]">
                          {selectedCourse.title}
                        </CardDescription>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={openNewModule} 
                        className="gap-2 h-10 px-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg shadow-purple-500/25 border-0"
                      >
                        <Plus className="h-4 w-4" />
                        Módulo
                      </Button>
                    </div>
                  </>
                ) : (
                  <CardTitle className="text-xl text-muted-foreground flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-muted/30 border border-border/30">
                      <Layers className="h-5 w-5 opacity-50" />
                    </div>
                    Selecione um curso
                  </CardTitle>
                )}
              </CardHeader>
              <CardContent className="flex-1 p-0 min-h-0 overflow-hidden">
                <ScrollArea className="h-full w-full">
                  {!selectedCourse ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                      <div className="p-4 rounded-full bg-purple-500/10 mb-4">
                        <Layers className="h-12 w-12 text-purple-400" />
                      </div>
                      <h3 className="font-medium">Nenhum curso selecionado</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Clique em um curso para ver seus módulos
                      </p>
                    </div>
                  ) : loadingModules ? (
                    <div className="p-4 space-y-3">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-20 bg-muted/30 animate-pulse rounded-xl" />
                      ))}
                    </div>
                  ) : modules?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                      <div className="p-4 rounded-full bg-purple-500/10 mb-4">
                        <FolderOpen className="h-12 w-12 text-purple-400" />
                      </div>
                      <h3 className="font-medium">Nenhum módulo</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Adicione módulos para organizar as aulas
                      </p>
                      <Button 
                        variant="outline" 
                        className="mt-4 border-purple-500/30 hover:bg-purple-500/10" 
                        onClick={openNewModule}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Criar Módulo
                      </Button>
                    </div>
                  ) : (
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={moduleIds}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="p-3 space-y-2">
                          {modules?.map((module, index) => (
                            <SortableModuleItem 
                              key={module.id}
                              module={module}
                              index={index}
                              isExpanded={expandedModules.has(module.id)}
                              onToggle={() => toggleModuleExpand(module.id)}
                              onEdit={() => openEditModule(module)}
                              onDelete={() => setDeleteDialog({ type: 'module', id: module.id, name: module.title })}
                              onToggleActive={() => updateModule.mutate({ id: module.id, is_published: !module.is_published })}
                              onImageUpdate={(moduleId, imageUrl) => updateModule.mutate({ id: moduleId, thumbnail_url: imageUrl })}
                              onPositionUpdate={(moduleId, newPosition) => updateModule.mutate({ id: moduleId, position: newPosition })}
                            />
                          ))}
                        </div>
                      </SortableContext>
                      
                      <DragOverlay>
                        {activeModule && (
                          <div className="rounded-xl border bg-card/95 backdrop-blur-sm border-purple-500/50 shadow-2xl shadow-purple-500/25 p-3 opacity-90">
                            <div className="flex items-center gap-3">
                              <GripVertical className="h-5 w-5 text-purple-400" />
                              <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-400">
                                #{activeModule.position + 1}
                              </Badge>
                              <span className="font-medium">{activeModule.title}</span>
                            </div>
                          </div>
                        )}
                      </DragOverlay>
                    </DndContext>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
          </div>
          </TabsContent>
          
          {/* ========== TAB: MÓDULOS ========== */}
          <TabsContent value="modulos" className="mt-6">
            <ModulosGlobalManager />
          </TabsContent>
        </Tabs>
        
        {/* Course Dialog */}
        <Dialog open={courseDialog} onOpenChange={setCourseDialog}>
          <DialogContent className="max-w-[98vw] w-[98vw] h-[98vh] overflow-y-auto bg-card/95 backdrop-blur-sm border-border/50">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                {editingCourse ? 'Editar Curso' : 'Novo Curso'}
              </DialogTitle>
              <DialogDescription>
                {editingCourse ? 'Atualize as informações do curso' : 'Preencha as informações para criar um novo curso'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={courseForm.title}
                    onChange={(e) => setCourseForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Química Geral - ENEM"
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (URL)</Label>
                  <Input
                    id="slug"
                    value={courseForm.slug}
                    onChange={(e) => setCourseForm(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="quimica-geral-enem"
                    className="bg-background/50"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={courseForm.description}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva o curso..."
                  rows={3}
                  className="bg-background/50"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Select 
                    value={courseForm.category} 
                    onValueChange={(v) => setCourseForm(prev => ({ ...prev, category: v }))}
                  >
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quimica-geral">Química Geral</SelectItem>
                      <SelectItem value="quimica-organica">Química Orgânica</SelectItem>
                      <SelectItem value="fisico-quimica">Físico-Química</SelectItem>
                      <SelectItem value="quimica-ambiental">Química Ambiental</SelectItem>
                      <SelectItem value="bioquimica">Bioquímica</SelectItem>
                      <SelectItem value="enem">ENEM</SelectItem>
                      <SelectItem value="vestibular">Vestibular</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Dificuldade</Label>
                  <Select 
                    value={courseForm.difficulty_level} 
                    onValueChange={(v) => setCourseForm(prev => ({ ...prev, difficulty_level: v }))}
                  >
                    <SelectTrigger className="bg-background/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="iniciante">Iniciante</SelectItem>
                      <SelectItem value="intermediario">Intermediário</SelectItem>
                      <SelectItem value="avancado">Avançado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="hours">Carga Horária</Label>
                  <Input
                    id="hours"
                    type="number"
                    value={courseForm.estimated_hours}
                    onChange={(e) => setCourseForm(prev => ({ ...prev, estimated_hours: parseInt(e.target.value) || 0 }))}
                    placeholder="10"
                    className="bg-background/50"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="xp">XP Total</Label>
                <Input
                  id="xp"
                  type="number"
                  value={courseForm.total_xp}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, total_xp: parseInt(e.target.value) || 0 }))}
                  placeholder="100"
                  className="bg-background/50"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="thumbnail">URL da Thumbnail</Label>
                <Input
                  id="thumbnail"
                  value={courseForm.thumbnail_url}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                  placeholder="https://..."
                  className="bg-background/50"
                />
              </div>
              
              <div className="flex flex-wrap gap-6 pt-2">
                <div className="flex items-center gap-2">
                  <Switch
                    id="published"
                    checked={courseForm.is_published}
                    onCheckedChange={(v) => setCourseForm(prev => ({ ...prev, is_published: v }))}
                  />
                  <Label htmlFor="published" className="cursor-pointer">Publicado</Label>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setCourseDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => {
                  if (editingCourse) {
                    updateCourse.mutate({ id: editingCourse.id, ...courseForm });
                  } else {
                    createCourse.mutate(courseForm);
                  }
                }}
                disabled={!courseForm.title || createCourse.isPending || updateCourse.isPending}
                className="bg-primary shadow-lg shadow-primary/25"
              >
                <Save className="h-4 w-4 mr-2" />
                {editingCourse ? 'Salvar' : 'Criar Curso'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Module Dialog - TELA MÁXIMA com SCROLLABLE CONTENT */}
        <Dialog open={moduleDialog} onOpenChange={setModuleDialog}>
          <DialogContent className="max-w-[98vw] w-[98vw] h-[98vh] flex flex-col bg-card/95 backdrop-blur-sm border-border/50 p-0 gap-0 overflow-hidden">
            {/* Fixed Header */}
            <DialogHeader className="shrink-0 border-b border-border/30 px-6 py-4 bg-gradient-to-r from-purple-500/10 via-card to-pink-500/10">
              <DialogTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 border-2 border-purple-500/50 shadow-lg shadow-purple-500/20">
                  <Layers className="h-6 w-6 text-purple-300" />
                </div>
                {editingModule ? 'Editar Módulo' : 'Novo Módulo'}
              </DialogTitle>
              <DialogDescription className="text-base text-muted-foreground">
                Curso: <span className="text-foreground font-semibold">{selectedCourse?.title}</span>
              </DialogDescription>
            </DialogHeader>
            
            {/* Scrollable Body */}
            <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6">
              {/* Layout 2 colunas: Preview | Formulário */}
              <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-8">
              
              {/* Coluna Esquerda - Upload de Imagem */}
              <div className="flex flex-col gap-4 p-6 rounded-xl bg-muted/30 border border-border/30">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider text-center">
                  Imagem do Módulo
                </h3>
                <ModuleImageUploader
                  value={moduleForm.thumbnail_url}
                  onChange={(url) => setModuleForm(prev => ({ ...prev, thumbnail_url: url }))}
                  showPreview={true}
                  previewSize="lg"
                />
              </div>
              
              {/* Coluna Direita - Formulário */}
              <div className="flex flex-col gap-6">
                
                {/* Título */}
                <div className="space-y-2">
                  <Label htmlFor="module-title" className="text-base font-medium">
                    Título do Módulo *
                  </Label>
                  <Input
                    id="module-title"
                    value={moduleForm.title}
                    onChange={(e) => setModuleForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Módulo 1 - Introdução à Química"
                    className="bg-background/50 h-12 text-base"
                  />
                </div>
                
                {/* Descrição */}
                <div className="space-y-2">
                  <Label htmlFor="module-description" className="text-base font-medium">
                    Descrição
                  </Label>
                  <Textarea
                    id="module-description"
                    value={moduleForm.description}
                    onChange={(e) => setModuleForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descreva o conteúdo deste módulo..."
                    rows={5}
                    className="bg-background/50 text-base resize-none"
                  />
                </div>
                
                {/* Posição e Status */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="module-position" className="text-base font-medium">
                      Posição / Ordem
                    </Label>
                    <Input
                      id="module-position"
                      type="number"
                      value={moduleForm.position}
                      onChange={(e) => setModuleForm(prev => ({ ...prev, position: parseInt(e.target.value) || 0 }))}
                      className="bg-background/50 h-12 text-base"
                    />
                    <p className="text-xs text-muted-foreground">Define a ordem de exibição</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-base font-medium">Status</Label>
                    <div className="flex items-center gap-3 h-12 px-4 rounded-lg border border-border/50 bg-background/50">
                      <Switch
                        id="module-active"
                        checked={moduleForm.is_published}
                        onCheckedChange={(v) => setModuleForm(prev => ({ ...prev, is_published: v }))}
                      />
                      <Label htmlFor="module-active" className="cursor-pointer text-base">
                        {moduleForm.is_published ? (
                          <span className="text-green-400">Ativo (Publicado)</span>
                        ) : (
                          <span className="text-muted-foreground">Inativo (Rascunho)</span>
                        )}
                      </Label>
                    </div>
                  </div>
                </div>
                
              </div>
              </div>  {/* Fecha grid cols */}
            </div>  {/* Fecha scrollable body */}
            
            {/* Fixed Footer */}
            <DialogFooter className="shrink-0 border-t border-border/30 px-6 py-4 bg-card/95">
              <Button variant="outline" onClick={() => setModuleDialog(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={() => {
                  if (!selectedCourse) return;
                  if (!moduleForm.thumbnail_url) {
                    toast({ 
                      title: '⚠️ Imagem obrigatória', 
                      description: 'Módulo deve ter imagem (752×940 px) para ser criado.',
                      variant: 'destructive'
                    });
                    return;
                  }
                  if (editingModule) {
                    updateModule.mutate({ id: editingModule.id, ...moduleForm });
                  } else {
                    createModule.mutate({ ...moduleForm, course_id: selectedCourse.id });
                  }
                }}
                disabled={!moduleForm.title || !moduleForm.thumbnail_url || createModule.isPending || updateModule.isPending}
                className="bg-purple-500 hover:bg-purple-600 shadow-lg shadow-purple-500/25"
              >
                <Save className="h-4 w-4 mr-2" />
                {editingModule ? 'Salvar' : 'Criar Módulo'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
          <DialogContent className="bg-card/95 backdrop-blur-sm border-border/50">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Confirmar Exclusão
              </DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir{' '}
                <span className="font-medium text-foreground">{deleteDialog?.name}</span>?
                {deleteDialog?.type === 'course' && (
                  <span className="block mt-2 text-destructive">
                    ⚠️ Isso irá excluir todos os módulos e aulas associados!
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteDialog(null)}>
                Cancelar
              </Button>
              <Button 
                variant="destructive"
                onClick={() => {
                  if (deleteDialog?.type === 'course') {
                    deleteCourse.mutate(deleteDialog.id);
                  } else if (deleteDialog?.type === 'module') {
                    deleteModule.mutate(deleteDialog.id);
                  }
                }}
                disabled={deleteCourse.isPending || deleteModule.isPending}
                className="shadow-lg shadow-destructive/25"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
    </>
  );
}

// ============================================
// LESSONS LIST — DRAG & DROP para Videoaulas
// ============================================
interface LessonsListProps {
  moduleId: string;
  lessons: LessonBasic[] | undefined;
}

function LessonsList({ moduleId, lessons: initialLessons }: LessonsListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [lessons, setLessons] = useState<LessonBasic[]>([]);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  
  useEffect(() => {
    setLessons(initialLessons || []);
  }, [initialLessons]);
  
  const lessonIds = useMemo(() => lessons.map(l => l.id), [lessons]);
  const activeLesson = activeLessonId ? lessons.find(l => l.id === activeLessonId) : null;
  
  const handleDragStart = (event: DragStartEvent) => {
    setActiveLessonId(event.active.id as string);
  };
  
  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveLessonId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    
    const oldIndex = lessons.findIndex(l => l.id === active.id);
    const newIndex = lessons.findIndex(l => l.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    
    const newOrder = arrayMove(lessons, oldIndex, newIndex);
    setLessons(newOrder);
    
    try {
      // 🚀 PATCH 5K: Batch update via RPC ao invés de loop sequencial
      // ANTES: 50 aulas = 50 requisições sequenciais (2.5s)
      // DEPOIS: 50 aulas = 1 RPC (~100ms)
      const updates = newOrder.map((lesson, idx) => ({
        id: lesson.id,
        position: idx
      }));
      
      const { error } = await supabase.rpc('batch_update_lesson_positions', {
        updates: JSON.stringify(updates)
      });
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['gestao-lessons', moduleId] });
      toast({ title: '✅ Ordem das aulas salva!' });
    } catch (error: any) {
      toast({ title: 'Erro ao reordenar', description: error.message, variant: 'destructive' });
      setLessons(initialLessons || []);
    }
  };
  
  if (!lessons || lessons.length === 0) {
    return (
      <div className="px-3 pb-3 pt-0">
        <div className="pl-11 border-l-2 border-dashed border-purple-500/20">
          <div className="text-sm text-muted-foreground py-2 pl-2">
            Nenhuma aula neste módulo
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="px-3 pb-3 pt-0">
      <div className="pl-11 border-l-2 border-dashed border-purple-500/20 space-y-1">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={lessonIds} strategy={verticalListSortingStrategy}>
            {lessons.map((lesson, idx) => (
              <SortableLessonItem key={lesson.id} lesson={lesson} index={idx} />
            ))}
          </SortableContext>
          
          <DragOverlay>
            {activeLesson && (
              <div className="rounded-lg border bg-card/95 backdrop-blur-sm border-purple-500/50 shadow-2xl shadow-purple-500/25 p-2 opacity-90 text-sm flex items-center gap-2">
                <GripVertical className="h-3 w-3 text-purple-400" />
                <PlayCircle className="h-4 w-4 text-purple-400" />
                <span className="truncate">{activeLesson.title}</span>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}

// ============================================
// SORTABLE LESSON ITEM
// ============================================
interface SortableLessonItemProps {
  lesson: LessonBasic;
  index: number;
}

function SortableLessonItem({ lesson, index }: SortableLessonItemProps) {
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
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 p-2 rounded-lg text-sm transition-all animate-fade-in",
        lesson.is_published 
          ? "bg-muted/30 hover:bg-muted/50" 
          : "bg-muted/20 opacity-50"
      )}
    >
      {/* DRAG HANDLE */}
      <div 
        {...listeners} 
        {...attributes}
        className="cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-purple-500/20 transition-colors shrink-0 touch-none"
        title="Arraste para reordenar"
      >
        <GripVertical className="h-3 w-3 text-muted-foreground hover:text-purple-400 transition-colors" />
      </div>
      
      <PlayCircle className="h-4 w-4 text-purple-400" />
      <span className="truncate flex-1">{lesson.title}</span>
      <Badge variant="outline" className="text-xs border-border/30">
        #{lesson.position + 1}
      </Badge>
    </div>
  );
}
