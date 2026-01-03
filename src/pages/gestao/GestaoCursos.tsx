// ============================================
// 📚 GESTÃO DE CURSOS E MÓDULOS
// Sistema completo de CRUD para LMS
// Hierarquia: Curso → Módulo → Aula
// ============================================

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Edit2, Trash2, GraduationCap, BookOpen, 
  Layers, ChevronRight, ChevronDown, Eye, EyeOff, 
  Save, X, FolderOpen, PlayCircle, Clock, Users,
  MoreHorizontal, Copy, ArrowUpDown, Grip, Check, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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
      let query = supabase
        .from('modules')
        .select('*')
        .order('position', { ascending: true });
      
      if (courseId) {
        query = query.eq('course_id', courseId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Module[];
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
// COMPONENTE PRINCIPAL
// ============================================
export default function GestaoCursos() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  
  // Dialogs
  const [courseDialog, setCourseDialog] = useState(false);
  const [moduleDialog, setModuleDialog] = useState(false);
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
      const { data: result, error } = await supabase
        .from('modules')
        .insert(data)
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
      const { id, ...updates } = data;
      const { error } = await supabase
        .from('modules')
        .update(updates)
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
  // RENDER
  // ============================================
  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-primary" />
            Gestão de Cursos
          </h1>
          <p className="text-muted-foreground mt-1">
            Crie e gerencie cursos e módulos do LMS
          </p>
        </div>
        
        <Button onClick={() => { setEditingCourse(null); resetCourseForm(); setCourseDialog(true); }} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Curso
        </Button>
      </motion.div>
      
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{courses?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Cursos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Layers className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{modules?.length || 0}</p>
                <p className="text-xs text-muted-foreground">Módulos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Eye className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{courses?.filter(c => c.is_published).length || 0}</p>
                <p className="text-xs text-muted-foreground">Publicados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <EyeOff className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-2xl font-bold">{courses?.filter(c => !c.is_published).length || 0}</p>
                <p className="text-xs text-muted-foreground">Rascunhos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Content - Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Course List */}
        <Card className="h-[600px] flex flex-col">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Cursos</CardTitle>
              <Badge variant="secondary">{filteredCourses.length}</Badge>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cursos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-full">
              {loadingCourses ? (
                <div className="p-4 space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-20 bg-muted/50 animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : filteredCourses.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <BookOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="font-medium">Nenhum curso encontrado</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Crie seu primeiro curso para começar
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => { setEditingCourse(null); resetCourseForm(); setCourseDialog(true); }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Curso
                  </Button>
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {filteredCourses.map((course) => (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "p-4 rounded-lg border cursor-pointer transition-all",
                        selectedCourse?.id === course.id 
                          ? "bg-primary/10 border-primary/50" 
                          : "hover:bg-muted/50 border-transparent"
                      )}
                      onClick={() => setSelectedCourse(course)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium truncate">{course.title}</h4>
                            {course.is_published ? (
                              <Badge variant="default" className="bg-green-500/20 text-green-500 text-xs">
                                <Eye className="h-3 w-3 mr-1" />
                                Publicado
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
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
                            <span className="flex items-center gap-1">
                              <GraduationCap className="h-3 w-3" />
                              {course.total_xp} XP
                            </span>
                          </div>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
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
                    </motion.div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
        
        {/* Right: Modules Panel */}
        <Card className="h-[600px] flex flex-col">
          <CardHeader className="border-b">
            {selectedCourse ? (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Layers className="h-5 w-5 text-purple-500" />
                      Módulos
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {selectedCourse.title}
                    </CardDescription>
                  </div>
                  <Button size="sm" onClick={openNewModule} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Módulo
                  </Button>
                </div>
              </>
            ) : (
              <CardTitle className="text-lg text-muted-foreground">
                Selecione um curso
              </CardTitle>
            )}
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-full">
              {!selectedCourse ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <Layers className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="font-medium">Nenhum curso selecionado</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Clique em um curso para ver seus módulos
                  </p>
                </div>
              ) : loadingModules ? (
                <div className="p-4 space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-16 bg-muted/50 animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : modules?.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <FolderOpen className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <h3 className="font-medium">Nenhum módulo</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Adicione módulos para organizar as aulas
                  </p>
                  <Button variant="outline" className="mt-4" onClick={openNewModule}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Módulo
                  </Button>
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  <AnimatePresence>
                    {modules?.map((module, index) => (
                      <ModuleItem 
                        key={module.id}
                        module={module}
                        index={index}
                        isExpanded={expandedModules.has(module.id)}
                        onToggle={() => toggleModuleExpand(module.id)}
                        onEdit={() => openEditModule(module)}
                        onDelete={() => setDeleteDialog({ type: 'module', id: module.id, name: module.title })}
                        onToggleActive={() => updateModule.mutate({ id: module.id, is_published: !module.is_published })}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
      
      {/* Course Dialog */}
      <Dialog open={courseDialog} onOpenChange={setCourseDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL)</Label>
                <Input
                  id="slug"
                  value={courseForm.slug}
                  onChange={(e) => setCourseForm(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="quimica-geral-enem"
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
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select 
                  value={courseForm.category} 
                  onValueChange={(v) => setCourseForm(prev => ({ ...prev, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quimica-geral">Química Geral</SelectItem>
                    <SelectItem value="quimica-organica">Química Orgânica</SelectItem>
                    <SelectItem value="fisico-quimica">Físico-Química</SelectItem>
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
                  <SelectTrigger>
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
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="thumbnail">URL da Thumbnail</Label>
              <Input
                id="thumbnail"
                value={courseForm.thumbnail_url}
                onChange={(e) => setCourseForm(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                placeholder="https://..."
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
            >
              <Save className="h-4 w-4 mr-2" />
              {editingCourse ? 'Salvar' : 'Criar Curso'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Module Dialog */}
      <Dialog open={moduleDialog} onOpenChange={setModuleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-purple-500" />
              {editingModule ? 'Editar Módulo' : 'Novo Módulo'}
            </DialogTitle>
            <DialogDescription>
              {selectedCourse?.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="module-title">Título *</Label>
              <Input
                id="module-title"
                value={moduleForm.title}
                onChange={(e) => setModuleForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Módulo 1 - Introdução"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="module-description">Descrição</Label>
              <Textarea
                id="module-description"
                value={moduleForm.description}
                onChange={(e) => setModuleForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o módulo..."
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="module-thumbnail">
                Imagem do Módulo
                <span className="text-muted-foreground text-xs ml-2">(752 × 940 px)</span>
              </Label>
              <Input
                id="module-thumbnail"
                value={moduleForm.thumbnail_url}
                onChange={(e) => setModuleForm(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                placeholder="/images/modules/meu-modulo.jpg"
              />
              {moduleForm.thumbnail_url && (
                <div className="relative w-[150px] h-[188px] rounded-lg overflow-hidden border bg-muted">
                  <img 
                    src={moduleForm.thumbnail_url} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                    onError={(e) => e.currentTarget.style.display = 'none'}
                  />
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="module-position">Posição</Label>
                <Input
                  id="module-position"
                  type="number"
                  value={moduleForm.position}
                  onChange={(e) => setModuleForm(prev => ({ ...prev, position: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="flex items-center gap-2 pt-7">
                <Switch
                  id="module-active"
                  checked={moduleForm.is_published}
                  onCheckedChange={(v) => setModuleForm(prev => ({ ...prev, is_published: v }))}
                />
                <Label htmlFor="module-active" className="cursor-pointer">Ativo</Label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setModuleDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => {
                if (!selectedCourse) return;
                if (editingModule) {
                  updateModule.mutate({ id: editingModule.id, ...moduleForm });
                } else {
                  createModule.mutate({ ...moduleForm, course_id: selectedCourse.id });
                }
              }}
              disabled={!moduleForm.title || createModule.isPending || updateModule.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {editingModule ? 'Salvar' : 'Criar Módulo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir{' '}
              <span className="font-medium">{deleteDialog?.name}</span>?
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
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================
// COMPONENTE DE MÓDULO
// ============================================
interface ModuleItemProps {
  module: Module;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}

function ModuleItem({ module, index, isExpanded, onToggle, onEdit, onDelete, onToggleActive }: ModuleItemProps) {
  const { data: lessons } = useLessons(isExpanded ? module.id : undefined);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "rounded-lg border transition-all",
        module.is_published ? "bg-card" : "bg-muted/50 opacity-60"
      )}
    >
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <div className="flex items-center gap-3 p-3">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          
          {/* Thumbnail do módulo (752x940 → preview 60x75) */}
          {module.thumbnail_url && (
            <div className="w-[60px] h-[75px] rounded-md overflow-hidden border bg-muted shrink-0">
              <img 
                src={module.thumbnail_url} 
                alt={module.title} 
                className="w-full h-full object-cover"
                onError={(e) => e.currentTarget.style.display = 'none'}
              />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs shrink-0">
                #{module.position + 1}
              </Badge>
              <h4 className="font-medium truncate">{module.title}</h4>
              {!module.is_published && (
                <Badge variant="secondary" className="text-xs">Inativo</Badge>
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
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit2 className="h-4 w-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onToggleActive}>
                {module.is_published ? (
                  <><EyeOff className="h-4 w-4 mr-2" />Desativar</>
                ) : (
                  <><Eye className="h-4 w-4 mr-2" />Ativar</>
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
          <div className="px-3 pb-3 pt-0">
            <div className="pl-11 border-l-2 border-dashed border-muted-foreground/20 space-y-1">
              {lessons && lessons.length > 0 ? (
                lessons.map((lesson) => (
                  <div 
                    key={lesson.id}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-md text-sm",
                      lesson.is_published ? "bg-muted/50" : "bg-muted/30 opacity-50"
                    )}
                  >
                    <PlayCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{lesson.title}</span>
                    <Badge variant="outline" className="text-xs ml-auto">
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
    </motion.div>
  );
}
