// ============================================
// 📦 GESTÃO GLOBAL DE MÓDULOS — DESIGN 2300
// Visão completa de todos os módulos do sistema
// CRUD + Aulas associadas + Estatísticas
// ============================================

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Layers, Search, Edit2, Trash2, Plus, Eye, EyeOff,
  ChevronRight, ChevronDown, PlayCircle, MoreHorizontal,
  Filter, SortAsc, SortDesc, FolderOpen, BookOpen,
  Check, AlertTriangle, Image, Video, Clock, Save, X,
  ArrowUpDown, GripVertical, RefreshCw, BarChart3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// ============================================
// TIPOS
// ============================================
interface Module {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  position: number;
  is_published: boolean;
  status: string | null;
  xp_reward: number | null;
  thumbnail_url: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  course?: {
    id: string;
    title: string;
    is_published: boolean;
  };
  _count?: {
    lessons: number;
    lessons_published: number;
  };
}

interface Lesson {
  id: string;
  module_id: string;
  title: string;
  position: number;
  is_published: boolean;
  video_url: string | null;
  duration_minutes: number | null;
}

interface Course {
  id: string;
  title: string;
  is_published: boolean;
}

// ============================================
// HOOKS
// ============================================

// Buscar TODOS os módulos com contagem de aulas
function useAllModules() {
  return useQuery({
    queryKey: ['gestao-all-modules'],
    queryFn: async () => {
      // Buscar módulos com curso
      const { data: modules, error } = await supabase
        .from('modules')
        .select(`
          *,
          course:courses(id, title, is_published)
        `)
        .order('course_id')
        .order('position', { ascending: true });
      
      if (error) throw error;

      // Buscar contagem de aulas por módulo
      const { data: lessonCounts, error: countError } = await supabase
        .from('lessons')
        .select('module_id, is_published');
      
      if (countError) throw countError;

      // Agregar contagens
      const countMap = new Map<string, { total: number; published: number }>();
      (lessonCounts || []).forEach(l => {
        const curr = countMap.get(l.module_id) || { total: 0, published: 0 };
        curr.total++;
        if (l.is_published) curr.published++;
        countMap.set(l.module_id, curr);
      });

      // Anexar contagens aos módulos
      return (modules || []).map(m => ({
        ...m,
        _count: {
          lessons: countMap.get(m.id)?.total || 0,
          lessons_published: countMap.get(m.id)?.published || 0
        }
      })) as Module[];
    }
  });
}

// Buscar cursos para dropdown
function useCoursesDropdown() {
  return useQuery({
    queryKey: ['gestao-courses-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select('id, title, is_published')
        .order('title');
      if (error) throw error;
      return data as Course[];
    }
  });
}

// Buscar aulas de um módulo
function useModuleLessonsQuery(moduleId: string | null) {
  return useQuery({
    queryKey: ['gestao-module-lessons', moduleId],
    queryFn: async () => {
      if (!moduleId) return [];
      const { data, error } = await supabase
        .from('lessons')
        .select('id, module_id, title, position, is_published, video_url, duration_minutes')
        .eq('module_id', moduleId)
        .order('position', { ascending: true });
      
      if (error) throw error;
      return data as Lesson[];
    },
    enabled: !!moduleId
  });
}

// ============================================
// STAT CARD COMPONENT
// ============================================
function StatCard({ icon, value, label, color }: { 
  icon: React.ReactNode; 
  value: number; 
  label: string; 
  color: 'purple' | 'blue' | 'green' | 'amber' | 'red';
}) {
  const colorMap = {
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/30 text-purple-400',
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/30 text-blue-400',
    green: 'from-green-500/20 to-green-600/10 border-green-500/30 text-green-400',
    amber: 'from-amber-500/20 to-amber-600/10 border-amber-500/30 text-amber-400',
    red: 'from-red-500/20 to-red-600/10 border-red-500/30 text-red-400',
  };

  return (
    <div className={cn(
      "bg-gradient-to-br border rounded-xl p-4 backdrop-blur-sm",
      colorMap[color]
    )}>
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-background/50">{icon}</div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
export function ModulosGlobalManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCourse, setFilterCourse] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'position' | 'title' | 'lessons'>('position');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  
  // Selected module for detail view
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  
  // Dialogs
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<Module | null>(null);
  const [createDialog, setCreateDialog] = useState(false);
  
  // Form
  const [moduleForm, setModuleForm] = useState({
    title: '',
    description: '',
    position: 0,
    is_published: true,
    thumbnail_url: '',
    course_id: ''
  });

  // Queries
  const { data: modules, isLoading, refetch } = useAllModules();
  const { data: courses } = useCoursesDropdown();
  const { data: selectedModuleLessons } = useModuleLessonsQuery(selectedModule?.id || null);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('modules-global-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'modules' }, () => {
        queryClient.invalidateQueries({ queryKey: ['gestao-all-modules'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lessons' }, () => {
        queryClient.invalidateQueries({ queryKey: ['gestao-all-modules'] });
        queryClient.invalidateQueries({ queryKey: ['gestao-module-lessons'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  // Mutations
  const createModule = useMutation({
    mutationFn: async (data: typeof moduleForm) => {
      const { data: result, error } = await supabase
        .from('modules')
        .insert({
          title: data.title,
          description: data.description,
          position: data.position,
          is_published: data.is_published,
          thumbnail_url: data.thumbnail_url || null,
          course_id: data.course_id,
          status: 'active'
        })
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gestao-all-modules'] });
      toast({ title: '✅ Módulo criado com sucesso!' });
      setCreateDialog(false);
      resetForm();
    },
    onError: (err: any) => {
      toast({ title: '❌ Erro ao criar módulo', description: err.message, variant: 'destructive' });
    }
  });

  const updateModule = useMutation({
    mutationFn: async (data: Partial<Module> & { id: string }) => {
      const { id, course, _count, ...updates } = data as any;
      const { error } = await supabase
        .from('modules')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gestao-all-modules'] });
      toast({ title: '✅ Módulo atualizado!' });
      setEditDialog(false);
      setSelectedModule(null);
    },
    onError: (err: any) => {
      toast({ title: '❌ Erro ao atualizar', description: err.message, variant: 'destructive' });
    }
  });

  const deleteModule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gestao-all-modules'] });
      toast({ title: '🗑️ Módulo excluído' });
      setDeleteDialog(null);
      if (selectedModule?.id === deleteDialog?.id) {
        setSelectedModule(null);
      }
    },
    onError: (err: any) => {
      toast({ title: '❌ Erro ao excluir', description: err.message, variant: 'destructive' });
    }
  });

  // Helpers
  const resetForm = () => {
    setModuleForm({
      title: '',
      description: '',
      position: 0,
      is_published: true,
      thumbnail_url: '',
      course_id: ''
    });
  };

  const openEdit = (module: Module) => {
    setModuleForm({
      title: module.title,
      description: module.description || '',
      position: module.position,
      is_published: module.is_published,
      thumbnail_url: module.thumbnail_url || '',
      course_id: module.course_id
    });
    setSelectedModule(module);
    setEditDialog(true);
  };

  const openCreate = () => {
    resetForm();
    // Default to first course if available
    if (courses && courses.length > 0) {
      setModuleForm(prev => ({ ...prev, course_id: courses[0].id }));
    }
    setCreateDialog(true);
  };

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedModules);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedModules(newSet);
  };

  // Filtered & sorted modules
  const filteredModules = useMemo(() => {
    let result = modules || [];

    // Filter by search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(m => 
        m.title.toLowerCase().includes(term) ||
        m.description?.toLowerCase().includes(term) ||
        m.course?.title.toLowerCase().includes(term)
      );
    }

    // Filter by course
    if (filterCourse !== 'all') {
      result = result.filter(m => m.course_id === filterCourse);
    }

    // Filter by status
    if (filterStatus === 'published') {
      result = result.filter(m => m.is_published);
    } else if (filterStatus === 'draft') {
      result = result.filter(m => !m.is_published);
    } else if (filterStatus === 'no-image') {
      result = result.filter(m => !m.thumbnail_url);
    } else if (filterStatus === 'no-lessons') {
      result = result.filter(m => (m._count?.lessons || 0) === 0);
    }

    // Sort
    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'position') {
        cmp = a.position - b.position;
      } else if (sortBy === 'title') {
        cmp = a.title.localeCompare(b.title);
      } else if (sortBy === 'lessons') {
        cmp = (a._count?.lessons || 0) - (b._count?.lessons || 0);
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [modules, searchTerm, filterCourse, filterStatus, sortBy, sortDir]);

  // Stats
  const stats = useMemo(() => {
    const all = modules || [];
    return {
      total: all.length,
      published: all.filter(m => m.is_published).length,
      withImage: all.filter(m => m.thumbnail_url).length,
      withLessons: all.filter(m => (m._count?.lessons || 0) > 0).length,
      totalLessons: all.reduce((sum, m) => sum + (m._count?.lessons || 0), 0)
    };
  }, [modules]);

  // Group by course for grid view
  const modulesByCourse = useMemo(() => {
    const map = new Map<string, { course: Course | null; modules: Module[] }>();
    filteredModules.forEach(m => {
      const key = m.course_id;
      if (!map.has(key)) {
        map.set(key, { course: m.course || null, modules: [] });
      }
      map.get(key)!.modules.push(m);
    });
    return Array.from(map.values());
  }, [filteredModules]);

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard icon={<Layers className="h-5 w-5" />} value={stats.total} label="Total Módulos" color="purple" />
        <StatCard icon={<Eye className="h-5 w-5" />} value={stats.published} label="Publicados" color="green" />
        <StatCard icon={<Image className="h-5 w-5" />} value={stats.withImage} label="Com Imagem" color="blue" />
        <StatCard icon={<Video className="h-5 w-5" />} value={stats.totalLessons} label="Total Aulas" color="amber" />
        <StatCard icon={<AlertTriangle className="h-5 w-5" />} value={stats.total - stats.withImage} label="Sem Imagem" color="red" />
      </div>

      {/* Toolbar */}
      <Card className="bg-card/80 backdrop-blur-sm border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar módulos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background/50"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
              <Select value={filterCourse} onValueChange={setFilterCourse}>
                <SelectTrigger className="w-[180px] bg-background/50">
                  <FolderOpen className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Curso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Cursos</SelectItem>
                  {courses?.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[160px] bg-background/50">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="published">Publicados</SelectItem>
                  <SelectItem value="draft">Rascunhos</SelectItem>
                  <SelectItem value="no-image">Sem Imagem</SelectItem>
                  <SelectItem value="no-lessons">Sem Aulas</SelectItem>
                </SelectContent>
              </Select>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="bg-background/50">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    Ordenar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => { setSortBy('position'); setSortDir('asc'); }}>
                    Posição (Crescente)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setSortBy('position'); setSortDir('desc'); }}>
                    Posição (Decrescente)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => { setSortBy('title'); setSortDir('asc'); }}>
                    Nome (A-Z)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setSortBy('title'); setSortDir('desc'); }}>
                    Nome (Z-A)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => { setSortBy('lessons'); setSortDir('desc'); }}>
                    Mais Aulas
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setSortBy('lessons'); setSortDir('asc'); }}>
                    Menos Aulas
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button onClick={() => refetch()} variant="outline" className="bg-background/50">
                <RefreshCw className="h-4 w-4" />
              </Button>

              <Button onClick={openCreate} className="bg-purple-500 hover:bg-purple-600 shadow-lg shadow-purple-500/25">
                <Plus className="h-4 w-4 mr-2" />
                Novo Módulo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content - Grid View */}
      {isLoading ? (
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-muted/30 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : filteredModules.length === 0 ? (
        <Card className="bg-card/80 backdrop-blur-sm border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="p-4 rounded-full bg-purple-500/10 mb-4">
              <Layers className="h-12 w-12 text-purple-400" />
            </div>
            <h3 className="font-medium text-lg">Nenhum módulo encontrado</h3>
            <p className="text-muted-foreground mt-1">
              {searchTerm || filterCourse !== 'all' || filterStatus !== 'all' 
                ? 'Tente ajustar os filtros' 
                : 'Crie seu primeiro módulo'}
            </p>
            <Button onClick={openCreate} className="mt-4 bg-purple-500 hover:bg-purple-600">
              <Plus className="h-4 w-4 mr-2" />
              Criar Módulo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {modulesByCourse.map(({ course, modules: courseModules }) => (
            <Card key={course?.id || 'no-course'} className="bg-card/80 backdrop-blur-sm border-border/50 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-500/5 to-pink-500/5 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-purple-400" />
                    <div>
                      <CardTitle className="text-lg">{course?.title || 'Sem Curso'}</CardTitle>
                      <CardDescription>
                        {courseModules.length} módulo{courseModules.length !== 1 ? 's' : ''} • 
                        {courseModules.reduce((s, m) => s + (m._count?.lessons || 0), 0)} aulas
                      </CardDescription>
                    </div>
                  </div>
                  {course?.is_published ? (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Publicado</Badge>
                  ) : (
                    <Badge variant="secondary">Rascunho</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="max-h-[400px]">
                  <div className="p-4 space-y-2">
                    {courseModules.map((module, idx) => (
                      <ModuleCard
                        key={module.id}
                        module={module}
                        index={idx}
                        isExpanded={expandedModules.has(module.id)}
                        onToggle={() => toggleExpand(module.id)}
                        onEdit={() => openEdit(module)}
                        onDelete={() => setDeleteDialog(module)}
                        onTogglePublish={() => updateModule.mutate({ id: module.id, is_published: !module.is_published })}
                        onSelect={() => setSelectedModule(module)}
                        isSelected={selectedModule?.id === module.id}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Module Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="max-w-lg bg-card/95 backdrop-blur-sm border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-purple-500" />
              Novo Módulo
            </DialogTitle>
            <DialogDescription>
              Crie um novo módulo para organizar suas aulas
            </DialogDescription>
          </DialogHeader>
          
          <ModuleFormContent
            form={moduleForm}
            setForm={setModuleForm}
            courses={courses || []}
          />
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialog(false)}>Cancelar</Button>
            <Button 
              onClick={() => createModule.mutate(moduleForm)}
              disabled={!moduleForm.title || !moduleForm.course_id || createModule.isPending}
              className="bg-purple-500 hover:bg-purple-600"
            >
              <Save className="h-4 w-4 mr-2" />
              Criar Módulo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Module Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-lg bg-card/95 backdrop-blur-sm border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit2 className="h-5 w-5 text-purple-500" />
              Editar Módulo
            </DialogTitle>
            <DialogDescription>
              {selectedModule?.course?.title}
            </DialogDescription>
          </DialogHeader>
          
          <ModuleFormContent
            form={moduleForm}
            setForm={setModuleForm}
            courses={courses || []}
          />
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)}>Cancelar</Button>
            <Button 
              onClick={() => selectedModule && updateModule.mutate({ id: selectedModule.id, ...moduleForm })}
              disabled={!moduleForm.title || updateModule.isPending}
              className="bg-purple-500 hover:bg-purple-600"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent className="bg-card/95 backdrop-blur-sm border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Excluir Módulo
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir <strong>{deleteDialog?.title}</strong>?
              {(deleteDialog?._count?.lessons || 0) > 0 && (
                <span className="block mt-2 text-destructive">
                  ⚠️ Este módulo possui {deleteDialog?._count?.lessons} aula(s) que também serão excluídas!
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>Cancelar</Button>
            <Button 
              variant="destructive"
              onClick={() => deleteDialog && deleteModule.mutate(deleteDialog.id)}
              disabled={deleteModule.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Module Detail Sidebar (if selected) */}
      {selectedModule && (
        <ModuleDetailPanel
          module={selectedModule}
          lessons={selectedModuleLessons || []}
          onClose={() => setSelectedModule(null)}
          onEdit={() => openEdit(selectedModule)}
        />
      )}
    </div>
  );
}

// ============================================
// MODULE CARD COMPONENT
// ============================================
interface ModuleCardProps {
  module: Module;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePublish: () => void;
  onSelect: () => void;
  isSelected: boolean;
}

function ModuleCard({ 
  module, 
  index, 
  isExpanded, 
  onToggle, 
  onEdit, 
  onDelete, 
  onTogglePublish,
  onSelect,
  isSelected 
}: ModuleCardProps) {
  const { data: lessons } = useModuleLessonsQuery(isExpanded ? module.id : null);

  return (
    <div
      className={cn(
        "rounded-xl border transition-all duration-300 animate-fade-in",
        isSelected && "ring-2 ring-purple-500/50",
        module.is_published 
          ? "bg-card/50 border-border/30 hover:border-purple-500/30" 
          : "bg-muted/30 opacity-70 border-border/20"
      )}
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <div className="flex items-center gap-3 p-3">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 hover:bg-purple-500/10">
              <ChevronRight className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-90")} />
            </Button>
          </CollapsibleTrigger>

          {/* Thumbnail */}
          {module.thumbnail_url ? (
            <div className="relative w-[50px] h-[62px] rounded-lg overflow-hidden border border-green-500/30 bg-muted shrink-0">
              <img src={module.thumbnail_url} alt={module.title} className="w-full h-full object-cover" />
              <Check className="absolute bottom-0.5 right-0.5 h-3 w-3 text-green-500 bg-green-900/80 rounded-full p-0.5" />
            </div>
          ) : (
            <div className="w-[50px] h-[62px] rounded-lg border-2 border-dashed border-destructive/40 bg-destructive/10 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0 cursor-pointer" onClick={onSelect}>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-400">
                #{module.position + 1}
              </Badge>
              <h4 className="font-medium truncate">{module.title}</h4>
              {!module.is_published && (
                <Badge variant="secondary" className="text-xs">Inativo</Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Video className="h-3 w-3" />
                {module._count?.lessons || 0} aulas
              </span>
              {module._count?.lessons_published !== module._count?.lessons && (
                <span className="text-amber-400">
                  ({module._count?.lessons_published || 0} publicadas)
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-purple-500/10">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card/95 backdrop-blur-sm">
              <DropdownMenuItem onClick={onEdit}>
                <Edit2 className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onTogglePublish}>
                {module.is_published ? (
                  <><EyeOff className="h-4 w-4 mr-2" />Despublicar</>
                ) : (
                  <><Eye className="h-4 w-4 mr-2" />Publicar</>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <CollapsibleContent>
          <div className="px-3 pb-3">
            <div className="pl-11 border-l-2 border-dashed border-purple-500/20 space-y-1">
              {lessons && lessons.length > 0 ? (
                lessons.map((lesson, idx) => (
                  <div 
                    key={lesson.id}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg text-sm transition-all",
                      lesson.is_published ? "bg-muted/30 hover:bg-muted/50" : "bg-muted/20 opacity-50"
                    )}
                  >
                    <PlayCircle className="h-4 w-4 text-purple-400 shrink-0" />
                    <span className="truncate flex-1">{lesson.title}</span>
                    {lesson.duration_minutes && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {lesson.duration_minutes}min
                      </span>
                    )}
                    <Badge variant="outline" className="text-xs border-border/30">
                      #{lesson.position + 1}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground py-2 pl-2">
                  Nenhuma aula neste módulo
                </div>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// ============================================
// MODULE FORM CONTENT
// ============================================
interface ModuleFormState {
  title: string;
  description: string;
  position: number;
  is_published: boolean;
  thumbnail_url: string;
  course_id: string;
}

function ModuleFormContent({ form, setForm, courses }: {
  form: ModuleFormState;
  setForm: React.Dispatch<React.SetStateAction<ModuleFormState>>;
  courses: Course[];
}) {
  return (
    <div className="grid gap-4 py-4">
      <div className="space-y-2">
        <Label>Curso *</Label>
        <Select value={form.course_id} onValueChange={(v) => setForm(p => ({ ...p, course_id: v }))}>
          <SelectTrigger className="bg-background/50">
            <SelectValue placeholder="Selecione um curso" />
          </SelectTrigger>
          <SelectContent>
            {courses.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Título *</Label>
        <Input
          value={form.title}
          onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))}
          placeholder="Ex: Módulo 1 - Introdução"
          className="bg-background/50"
        />
      </div>

      <div className="space-y-2">
        <Label>Descrição</Label>
        <Textarea
          value={form.description}
          onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
          placeholder="Descreva o módulo..."
          rows={3}
          className="bg-background/50"
        />
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          Imagem
          <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-400">752 × 940 px</Badge>
        </Label>
        <Input
          value={form.thumbnail_url}
          onChange={(e) => setForm((p: any) => ({ ...p, thumbnail_url: e.target.value }))}
          placeholder="/images/modules/meu-modulo.jpg"
          className="bg-background/50"
        />
        {form.thumbnail_url && (
          <div className="relative w-[100px] h-[125px] rounded-lg overflow-hidden border border-green-500/30 bg-muted">
            <img src={form.thumbnail_url} alt="Preview" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Posição</Label>
          <Input
            type="number"
            value={form.position}
            onChange={(e) => setForm((p: any) => ({ ...p, position: parseInt(e.target.value) || 0 }))}
            className="bg-background/50"
          />
        </div>
        <div className="flex items-center gap-2 pt-7">
          <Switch
            checked={form.is_published}
            onCheckedChange={(v) => setForm((p: any) => ({ ...p, is_published: v }))}
          />
          <Label className="cursor-pointer">Publicado</Label>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MODULE DETAIL PANEL
// ============================================
function ModuleDetailPanel({ module, lessons, onClose, onEdit }: {
  module: Module;
  lessons: Lesson[];
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <Card className="fixed bottom-4 right-4 w-[400px] max-h-[500px] bg-card/95 backdrop-blur-xl border-purple-500/30 shadow-2xl shadow-purple-500/20 z-50 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Layers className="h-5 w-5 text-purple-400" />
            <div>
              <CardTitle className="text-base">{module.title}</CardTitle>
              <CardDescription className="text-xs">{module.course?.title}</CardDescription>
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={onEdit} className="h-8 w-8">
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[350px]">
          <div className="p-4 space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <p className="text-2xl font-bold text-purple-400">{lessons.length}</p>
                <p className="text-xs text-muted-foreground">Aulas</p>
              </div>
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-2xl font-bold text-green-400">{lessons.filter(l => l.is_published).length}</p>
                <p className="text-xs text-muted-foreground">Publicadas</p>
              </div>
            </div>

            {/* Description */}
            {module.description && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Descrição</p>
                <p className="text-sm">{module.description}</p>
              </div>
            )}

            {/* Lessons List */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Aulas ({lessons.length})</p>
              <div className="space-y-1">
                {lessons.length > 0 ? lessons.map((lesson, idx) => (
                  <div 
                    key={lesson.id}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg text-sm",
                      lesson.is_published ? "bg-muted/30" : "bg-muted/20 opacity-50"
                    )}
                  >
                    <PlayCircle className="h-4 w-4 text-purple-400 shrink-0" />
                    <span className="truncate flex-1">{lesson.title}</span>
                    {lesson.video_url && <Video className="h-3 w-3 text-green-400" />}
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground">Nenhuma aula</p>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
