// ============================================
// GESTÃO DE FÓRUM - Central de Moderação
// Sincronizado em tempo real com /alunos/forum e /comunidade/forum
// ============================================

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Search, MessageSquare, Users, CheckCircle2, Clock, 
  AlertCircle, Eye, Trash2, Pin, TrendingUp, RefreshCw,
  MessageCircle, Flag, ThumbsUp, Filter, PlusCircle, Settings,
  Flame, Archive, Lock
} from "lucide-react";
import { motion } from "framer-motion";

// Types
interface ForumCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  position: number | null;
  is_active: boolean | null;
  created_at: string;
}

interface ForumTopic {
  id: string;
  category_id: string | null;
  author_id: string | null;
  author_name: string | null;
  author_email: string | null;
  title: string;
  content: string;
  status: string;
  is_pinned: boolean | null;
  is_hot: boolean | null;
  is_solved: boolean | null;
  views_count: number | null;
  replies_count: number | null;
  likes_count: number | null;
  tags: string[] | null;
  created_at: string;
  category?: ForumCategory;
}

interface ForumPost {
  id: string;
  topic_id: string;
  author_id: string | null;
  author_name: string | null;
  author_email: string | null;
  content: string;
  is_solution: boolean | null;
  likes_count: number | null;
  created_at: string;
}

// Hooks
function useForumCategories() {
  return useQuery({
    queryKey: ['gestao-forum-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('forum_categories')
        .select('*')
        .order('position', { ascending: true });
      
      if (error) throw error;
      return (data || []) as ForumCategory[];
    }
  });
}

function useForumTopics() {
  return useQuery({
    queryKey: ['gestao-forum-topics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('forum_topics')
        .select('*, category:forum_categories(*)')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as ForumTopic[];
    }
  });
}

function useForumPosts(topicId: string | null) {
  return useQuery({
    queryKey: ['gestao-forum-posts', topicId],
    queryFn: async () => {
      if (!topicId) return [];
      const { data, error } = await supabase
        .from('forum_posts')
        .select('*')
        .eq('topic_id', topicId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return (data || []) as ForumPost[];
    },
    enabled: !!topicId
  });
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: typeof Clock }> = {
    open: { label: "Aberto", variant: "default", icon: MessageCircle },
    closed: { label: "Fechado", variant: "secondary", icon: Lock },
    pinned: { label: "Fixado", variant: "outline", icon: Pin },
    archived: { label: "Arquivado", variant: "secondary", icon: Archive },
  };
  
  const config = statusConfig[status] || { label: status, variant: "outline" as const, icon: Clock };
  const Icon = config.icon;
  
  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}

// Topic Detail Dialog
function TopicDetailDialog({ topic, onSuccess }: { topic: ForumTopic; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const { data: posts, isLoading: loadingPosts } = useForumPosts(open ? topic.id : null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const handleTogglePin = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('forum_topics')
        .update({ is_pinned: !topic.is_pinned })
        .eq('id', topic.id);
      
      if (error) throw error;
      toast.success(topic.is_pinned ? "Tópico desafixado" : "Tópico fixado");
      onSuccess();
    } catch {
      toast.error("Erro ao atualizar tópico");
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleToggleStatus = async (newStatus: string) => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('forum_topics')
        .update({ status: newStatus })
        .eq('id', topic.id);
      
      if (error) throw error;
      toast.success("Status atualizado");
      onSuccess();
    } catch {
      toast.error("Erro ao atualizar status");
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja excluir este tópico?")) return;
    
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('forum_topics')
        .delete()
        .eq('id', topic.id);
      
      if (error) throw error;
      toast.success("Tópico excluído");
      setOpen(false);
      onSuccess();
    } catch {
      toast.error("Erro ao excluir tópico");
    } finally {
      setIsUpdating(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Eye className="w-4 h-4 mr-1" />
          Ver
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                {topic.is_pinned && <Pin className="w-4 h-4 text-primary" />}
                {topic.is_hot && <Flame className="w-4 h-4 text-orange-500" />}
                {topic.title}
              </DialogTitle>
              <DialogDescription>
                Por {topic.author_name || topic.author_email} • {format(new Date(topic.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </DialogDescription>
            </div>
            <StatusBadge status={topic.status} />
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {/* Content */}
            <div className="p-4 bg-muted rounded-lg">
              <p className="whitespace-pre-wrap">{topic.content}</p>
            </div>
            
            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {topic.views_count || 0} views
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="w-4 h-4" />
                {topic.replies_count || 0} respostas
              </span>
              <span className="flex items-center gap-1">
                <ThumbsUp className="w-4 h-4" />
                {topic.likes_count || 0} likes
              </span>
            </div>
            
            {/* Replies */}
            <div className="space-y-3">
              <h4 className="font-medium">Respostas ({posts?.length || 0})</h4>
              {loadingPosts ? (
                <div className="flex items-center justify-center py-4">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                </div>
              ) : posts?.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4">Nenhuma resposta ainda.</p>
              ) : (
                posts?.map((post) => (
                  <Card key={post.id} className={post.is_solution ? "border-green-500" : ""}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{post.author_name || post.author_email}</span>
                          {post.is_solution && (
                            <Badge variant="default" className="bg-green-500">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Solução
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(post.created_at), "dd/MM/yy HH:mm")}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{post.content}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </ScrollArea>
        
        <DialogFooter className="flex-shrink-0 gap-2">
          <Button 
            variant="outline" 
            onClick={handleTogglePin}
            disabled={isUpdating}
          >
            <Pin className="w-4 h-4 mr-1" />
            {topic.is_pinned ? "Desafixar" : "Fixar"}
          </Button>
          <Select 
            value={topic.status} 
            onValueChange={handleToggleStatus}
            disabled={isUpdating}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">Aberto</SelectItem>
              <SelectItem value="closed">Fechado</SelectItem>
              <SelectItem value="archived">Arquivado</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isUpdating}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Excluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Category Management Dialog
function CategoryManagementDialog({ onSuccess }: { onSuccess: () => void }) {
  const { data: categories } = useForumCategories();
  const [open, setOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '', slug: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const slug = newCategory.slug || newCategory.name.toLowerCase().replace(/\s+/g, '-');
      const { error } = await supabase
        .from('forum_categories')
        .insert({
          name: newCategory.name,
          description: newCategory.description || null,
          slug,
          position: (categories?.length || 0) + 1
        });
      
      if (error) throw error;
      toast.success("Categoria criada");
      setNewCategory({ name: '', description: '', slug: '' });
      onSuccess();
    } catch {
      toast.error("Erro ao criar categoria");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleToggleActive = async (cat: ForumCategory) => {
    try {
      const { error } = await supabase
        .from('forum_categories')
        .update({ is_active: !cat.is_active })
        .eq('id', cat.id);
      
      if (error) throw error;
      toast.success(cat.is_active ? "Categoria desativada" : "Categoria ativada");
      onSuccess();
    } catch {
      toast.error("Erro ao atualizar categoria");
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Settings className="w-4 h-4 mr-2" />
          Categorias
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Gerenciar Categorias</DialogTitle>
          <DialogDescription>Adicione ou edite categorias do fórum</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Add new category */}
          <div className="space-y-3 p-4 border rounded-lg">
            <h4 className="font-medium">Nova Categoria</h4>
            <Input
              placeholder="Nome da categoria"
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
            />
            <Input
              placeholder="Descrição (opcional)"
              value={newCategory.description}
              onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
            />
            <Button onClick={handleAddCategory} disabled={isSubmitting} className="w-full">
              <PlusCircle className="w-4 h-4 mr-2" />
              Adicionar
            </Button>
          </div>
          
          {/* Existing categories */}
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {categories?.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{cat.name}</p>
                    <p className="text-xs text-muted-foreground">{cat.slug}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={cat.is_active ?? true}
                      onCheckedChange={() => handleToggleActive(cat)}
                    />
                    <span className="text-xs">{cat.is_active ? 'Ativa' : 'Inativa'}</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Main Component
export default function GestaoForum() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("topics");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  
  const { data: categories, isLoading: isLoadingCategories } = useForumCategories();
  const { data: topics, isLoading: isLoadingTopics } = useForumTopics();
  
  // Realtime sync
  useEffect(() => {
    const channel = supabase
      .channel('gestao-forum-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'forum_categories' }, () => {
        queryClient.invalidateQueries({ queryKey: ['gestao-forum-categories'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'forum_topics' }, () => {
        queryClient.invalidateQueries({ queryKey: ['gestao-forum-topics'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'forum_posts' }, () => {
        queryClient.invalidateQueries({ queryKey: ['gestao-forum-posts'] });
      })
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);
  
  // Stats
  const stats = {
    totalTopics: topics?.length || 0,
    openTopics: topics?.filter(t => t.status === 'open').length || 0,
    pinnedTopics: topics?.filter(t => t.is_pinned).length || 0,
    hotTopics: topics?.filter(t => t.is_hot).length || 0,
    totalCategories: categories?.length || 0,
    activeCategories: categories?.filter(c => c.is_active).length || 0,
  };
  
  // Filtered data
  const filteredTopics = topics?.filter(t => {
    const matchesSearch = 
      t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.author_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || t.category_id === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  }) || [];
  
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['gestao-forum-categories'] });
    queryClient.invalidateQueries({ queryKey: ['gestao-forum-topics'] });
  };
  
  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Gestão do Fórum</h1>
          <p className="text-muted-foreground">Modere tópicos e gerencie a comunidade</p>
        </div>
        <div className="flex gap-2">
          <CategoryManagementDialog onSuccess={handleRefresh} />
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalTopics}</p>
                  <p className="text-xs text-muted-foreground">Total Tópicos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.openTopics}</p>
                  <p className="text-xs text-muted-foreground">Abertos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Pin className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stats.pinnedTopics}</p>
                  <p className="text-xs text-muted-foreground">Fixados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.hotTopics}</p>
                  <p className="text-xs text-muted-foreground">Em Alta</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Flag className="w-5 h-5 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.totalCategories}</p>
                  <p className="text-xs text-muted-foreground">Categorias</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-cyan-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.activeCategories}</p>
                  <p className="text-xs text-muted-foreground">Ativas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
      
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tópicos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="open">Abertos</SelectItem>
            <SelectItem value="closed">Fechados</SelectItem>
            <SelectItem value="archived">Arquivados</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Categorias</SelectItem>
            {categories?.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Topics Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tópicos do Fórum</CardTitle>
          <CardDescription>Gerencie e modere os tópicos da comunidade</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingTopics ? (
            <div className="flex items-center justify-center h-40">
              <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTopics.length === 0 ? (
            <div className="text-center py-10">
              <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum tópico encontrado</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tópico</TableHead>
                    <TableHead>Autor</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Stats</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTopics.map((topic) => (
                    <TableRow key={topic.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {topic.is_pinned && <Pin className="w-4 h-4 text-primary" />}
                          {topic.is_hot && <Flame className="w-4 h-4 text-orange-500" />}
                          <span className="max-w-[200px] truncate font-medium">{topic.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{topic.author_name || 'Anônimo'}</p>
                          <p className="text-xs text-muted-foreground">{topic.author_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {topic.category ? (
                          <Badge variant="outline">{topic.category.name}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={topic.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {topic.views_count || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            {topic.replies_count || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3" />
                            {topic.likes_count || 0}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(topic.created_at), "dd/MM/yy HH:mm")}
                      </TableCell>
                      <TableCell>
                        <TopicDetailDialog 
                          topic={topic} 
                          onSuccess={handleRefresh} 
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
