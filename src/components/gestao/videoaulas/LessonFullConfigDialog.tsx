// ============================================
// 🎛️ LESSON FULL CONFIG DIALOG v1.0
// Modal de configuração COMPLETA de aula/vídeo
// VERDADE ABSOLUTA - Todas as propriedades editáveis
// ============================================

import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { 
  Settings, Video, Youtube, Tv, Upload, Link, QrCode, 
  BookOpen, Eye, EyeOff, Clock, Zap, FileText, Image,
  Save, X, Copy, ExternalLink, AlertTriangle, Check,
  Layers, Hash, Calendar, BarChart3
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SacredImage } from "@/components/performance/SacredImage";

type VideoProvider = 'panda' | 'youtube' | 'vimeo' | 'upload';

interface Lesson {
  id: string;
  title: string;
  description?: string | null;
  content?: string | null;
  video_url?: string | null;
  video_provider?: VideoProvider | string | null;
  panda_video_id?: string | null;
  youtube_video_id?: string | null;
  thumbnail_url?: string | null;
  duration_minutes?: number | null;
  video_duration?: number | null;
  position?: number | null;
  is_free?: boolean | null;
  is_published?: boolean | null;
  views_count?: number | null;
  likes_count?: number | null;
  xp_reward?: number | null;
  module_id?: string | null;
  area_id?: string | null;
  legacy_qr_id?: number | null;
  status?: string | null;
  tipo?: string | null;
  material_url?: string | null;
  material_nome?: string | null;
  transcript?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  module?: { id: string; title: string } | null;
  area?: { id: string; name: string } | null;
}

interface LessonFullConfigDialogProps {
  lesson: Lesson | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LessonFullConfigDialog({ lesson, open, onOpenChange }: LessonFullConfigDialogProps) {
  const queryClient = useQueryClient();
  
  // Form state - TODAS as propriedades editáveis
  const [formData, setFormData] = useState({
    // Identificação
    title: "",
    description: "",
    content: "",
    legacy_qr_id: null as number | null,
    
    // Vídeo
    video_url: "",
    video_provider: "youtube" as VideoProvider,
    panda_video_id: "",
    youtube_video_id: "",
    thumbnail_url: "",
    duration_minutes: null as number | null,
    video_duration: null as number | null,
    
    // Organização
    module_id: null as string | null,
    area_id: null as string | null,
    position: null as number | null,
    
    // Status & Permissões
    is_published: true,
    is_free: false,
    status: "ativo",
    tipo: "video",
    
    // Gamificação
    xp_reward: null as number | null,
    
    // Material Complementar
    material_url: "",
    material_nome: "",
    transcript: "",
  });

  // Carregar módulos disponíveis
  const { data: modules = [] } = useQuery({
    queryKey: ['modules-for-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('modules')
        .select('id, title')
        .order('title');
      if (error) throw error;
      return data || [];
    },
  });

  // Carregar áreas disponíveis
  const { data: areas = [] } = useQuery({
    queryKey: ['areas-for-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('areas')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });

  // Sincronizar form com lesson selecionada
  useEffect(() => {
    if (lesson) {
      setFormData({
        title: lesson.title || "",
        description: lesson.description || "",
        content: lesson.content || "",
        legacy_qr_id: lesson.legacy_qr_id,
        video_url: lesson.video_url || "",
        video_provider: (lesson.video_provider as VideoProvider) || "youtube",
        panda_video_id: lesson.panda_video_id || "",
        youtube_video_id: lesson.youtube_video_id || "",
        thumbnail_url: lesson.thumbnail_url || "",
        duration_minutes: lesson.duration_minutes,
        video_duration: lesson.video_duration,
        module_id: lesson.module_id,
        area_id: lesson.area_id,
        position: lesson.position,
        is_published: lesson.is_published ?? true,
        is_free: lesson.is_free ?? false,
        status: lesson.status || "ativo",
        tipo: lesson.tipo || "video",
        xp_reward: lesson.xp_reward,
        material_url: lesson.material_url || "",
        material_nome: lesson.material_nome || "",
        transcript: lesson.transcript || "",
      });
    }
  }, [lesson]);

  // Mutation para salvar
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!lesson) throw new Error("Nenhuma aula selecionada");
      
      const { error } = await supabase
        .from('lessons')
        .update({
          title: data.title,
          description: data.description || null,
          content: data.content || null,
          legacy_qr_id: data.legacy_qr_id,
          video_url: data.video_url || null,
          video_provider: data.video_provider,
          panda_video_id: data.panda_video_id || null,
          youtube_video_id: data.youtube_video_id || null,
          thumbnail_url: data.thumbnail_url || null,
          duration_minutes: data.duration_minutes,
          video_duration: data.video_duration,
          module_id: data.module_id,
          area_id: data.area_id,
          position: data.position,
          is_published: data.is_published,
          is_free: data.is_free,
          status: data.status,
          tipo: data.tipo,
          xp_reward: data.xp_reward,
          material_url: data.material_url || null,
          material_nome: data.material_nome || null,
          transcript: data.transcript || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', lesson.id);
      
      if (error) throw error;
      return lesson.id;
    },
    onSuccess: () => {
      toast.success("Aula atualizada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['gestao-videoaulas'] });
      queryClient.invalidateQueries({ queryKey: ['aluno-videoaulas'] });
      queryClient.invalidateQueries({ queryKey: ['lessons'] });
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('[LessonFullConfig] Erro ao salvar:', error);
      toast.error("Erro ao salvar alterações");
    },
  });

  const handleSave = () => {
    if (!formData.title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }
    saveMutation.mutate(formData);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  if (!lesson) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Configuração Completa da Aula
          </DialogTitle>
          <DialogDescription>
            Todas as propriedades desta aula. Alterações são propagadas para todos os lugares.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <Tabs defaultValue="identificacao" className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-4">
              <TabsTrigger value="identificacao">Identificação</TabsTrigger>
              <TabsTrigger value="video">Vídeo</TabsTrigger>
              <TabsTrigger value="organizacao">Organização</TabsTrigger>
              <TabsTrigger value="status">Status</TabsTrigger>
              <TabsTrigger value="extras">Extras</TabsTrigger>
            </TabsList>

            {/* TAB: Identificação */}
            <TabsContent value="identificacao" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    Identificadores Únicos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* ID do Sistema */}
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <Label className="text-xs text-muted-foreground">ID do Sistema (UUID)</Label>
                      <p className="font-mono text-sm">{lesson.id}</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard(lesson.id, "ID")}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Legacy QR ID */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <QrCode className="w-4 h-4" />
                      Legacy QR ID (Livro Físico)
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Ex: 1234"
                        value={formData.legacy_qr_id || ""}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          legacy_qr_id: e.target.value ? parseInt(e.target.value) : null 
                        }))}
                      />
                      {formData.legacy_qr_id && (
                        <Button size="sm" variant="outline" onClick={() => copyToClipboard(String(formData.legacy_qr_id), "QR ID")}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ID numérico único para resolução de QR codes em livros físicos
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Informações Básicas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Título */}
                  <div className="space-y-2">
                    <Label>Título *</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Título da aula"
                    />
                  </div>

                  {/* Descrição */}
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descrição breve da aula"
                      rows={3}
                    />
                  </div>

                  {/* Conteúdo */}
                  <div className="space-y-2">
                    <Label>Conteúdo (HTML/Texto)</Label>
                    <Textarea
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Conteúdo adicional da aula"
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB: Vídeo */}
            <TabsContent value="video" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Video className="w-4 h-4" />
                    Configuração do Vídeo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Provider */}
                  <div className="space-y-2">
                    <Label>Provedor de Vídeo</Label>
                    <Select
                      value={formData.video_provider}
                      onValueChange={(value: VideoProvider) => setFormData(prev => ({ ...prev, video_provider: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="youtube">
                          <div className="flex items-center gap-2">
                            <Youtube className="w-4 h-4 text-red-500" />
                            YouTube
                          </div>
                        </SelectItem>
                        <SelectItem value="panda">
                          <div className="flex items-center gap-2">
                            <Tv className="w-4 h-4 text-emerald-500" />
                            Panda Video
                          </div>
                        </SelectItem>
                        <SelectItem value="vimeo">
                          <div className="flex items-center gap-2">
                            <Video className="w-4 h-4 text-blue-500" />
                            Vimeo
                          </div>
                        </SelectItem>
                        <SelectItem value="upload">
                          <div className="flex items-center gap-2">
                            <Upload className="w-4 h-4 text-purple-500" />
                            Upload Direto
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* IDs específicos por provider */}
                  {formData.video_provider === 'youtube' && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Youtube className="w-4 h-4 text-red-500" />
                        YouTube Video ID
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Ex: dQw4w9WgXcQ"
                          value={formData.youtube_video_id}
                          onChange={(e) => setFormData(prev => ({ ...prev, youtube_video_id: e.target.value }))}
                        />
                        {formData.youtube_video_id && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => window.open(`https://www.youtube.com/watch?v=${formData.youtube_video_id}`, '_blank')}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Apenas o ID do vídeo (parte após v= na URL)
                      </p>
                    </div>
                  )}

                  {formData.video_provider === 'panda' && (
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Tv className="w-4 h-4 text-emerald-500" />
                        Panda Video ID
                      </Label>
                      <Input
                        placeholder="Ex: abc123-def456-..."
                        value={formData.panda_video_id}
                        onChange={(e) => {
                          const videoId = e.target.value.trim();
                          // Auto-preenche thumbnail quando digitar UUID válido
                          // Usando o CDN correto: b-vz-c3e3c21e-7ce.tv.pandavideo.com.br
                          const autoThumbnail = videoId && /^[a-f0-9-]{36}$/i.test(videoId)
                            ? `https://b-vz-c3e3c21e-7ce.tv.pandavideo.com.br/${videoId}/thumbnail.jpg`
                            : '';
                          setFormData(prev => ({ 
                            ...prev, 
                            panda_video_id: videoId,
                            thumbnail_url: !prev.thumbnail_url || prev.thumbnail_url.includes('pandavideo.com.br') || prev.thumbnail_url.includes('b-cdn.net')
                              ? autoThumbnail 
                              : prev.thumbnail_url
                          }));
                        }}
                      />
                      <p className="text-xs text-muted-foreground">
                        UUID do vídeo (thumbnail automática)
                      </p>
                    </div>
                  )}

                  {/* URL Genérica */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Link className="w-4 h-4" />
                      URL do Vídeo (Fallback)
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://..."
                        value={formData.video_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, video_url: e.target.value }))}
                      />
                      {formData.video_url && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.open(formData.video_url, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Thumbnail */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Image className="w-4 h-4" />
                      URL da Thumbnail
                    </Label>
                    <Input
                      placeholder="https://..."
                      value={formData.thumbnail_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                    />
                    {formData.thumbnail_url && (
                      <SacredImage 
                        src={formData.thumbnail_url} 
                        alt="Thumbnail preview" 
                        width={128}
                        height={80}
                        className="w-32 h-20 rounded border"
                        objectFit="cover"
                      />
                    )}
                  </div>

                  {/* Duração */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Duração (minutos)
                      </Label>
                      <Input
                        type="number"
                        placeholder="Ex: 15"
                        value={formData.duration_minutes || ""}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          duration_minutes: e.target.value ? parseInt(e.target.value) : null 
                        }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Duração (segundos)
                      </Label>
                      <Input
                        type="number"
                        placeholder="Ex: 900"
                        value={formData.video_duration || ""}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          video_duration: e.target.value ? parseInt(e.target.value) : null 
                        }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB: Organização */}
            <TabsContent value="organizacao" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    Hierarquia e Posição
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Módulo */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Módulo
                    </Label>
                    <Select
                      value={formData.module_id || ""}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, module_id: value || null }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um módulo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Sem módulo</SelectItem>
                        {modules.map((mod) => (
                          <SelectItem key={mod.id} value={mod.id}>
                            {mod.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {lesson.module && (
                      <p className="text-xs text-muted-foreground">
                        Atual: {lesson.module.title}
                      </p>
                    )}
                  </div>

                  {/* Área */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Layers className="w-4 h-4" />
                      Área
                    </Label>
                    <Select
                      value={formData.area_id || ""}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, area_id: value || null }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma área" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Sem área</SelectItem>
                        {areas.map((area) => (
                          <SelectItem key={area.id} value={area.id}>
                            {area.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {lesson.area && (
                      <p className="text-xs text-muted-foreground">
                        Atual: {lesson.area.name}
                      </p>
                    )}
                  </div>

                  {/* Posição */}
                  <div className="space-y-2">
                    <Label>Posição/Ordem</Label>
                    <Input
                      type="number"
                      placeholder="Ex: 1"
                      value={formData.position || ""}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        position: e.target.value ? parseInt(e.target.value) : null 
                      }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Ordem de exibição dentro do módulo
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB: Status */}
            <TabsContent value="status" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Visibilidade e Permissões
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Publicada */}
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="space-y-0.5">
                      <Label className="flex items-center gap-2">
                        {formData.is_published ? <Eye className="w-4 h-4 text-green-500" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                        Publicada
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Aulas publicadas ficam visíveis para alunos
                      </p>
                    </div>
                    <Switch
                      checked={formData.is_published}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_published: checked }))}
                    />
                  </div>

                  {/* Gratuita */}
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="space-y-0.5">
                      <Label className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-500" />
                        Gratuita / Amostra
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Aulas gratuitas podem ser acessadas por todos
                      </p>
                    </div>
                    <Switch
                      checked={formData.is_free}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_free: checked }))}
                    />
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                        <SelectItem value="rascunho">Rascunho</SelectItem>
                        <SelectItem value="arquivado">Arquivado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Tipo */}
                  <div className="space-y-2">
                    <Label>Tipo de Conteúdo</Label>
                    <Select
                      value={formData.tipo}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, tipo: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="video">Vídeo</SelectItem>
                        <SelectItem value="texto">Texto</SelectItem>
                        <SelectItem value="quiz">Quiz</SelectItem>
                        <SelectItem value="exercicio">Exercício</SelectItem>
                        <SelectItem value="material">Material PDF</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Estatísticas (Somente Leitura)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-muted/50 rounded-lg text-center">
                      <p className="text-2xl font-bold">{lesson.views_count || 0}</p>
                      <p className="text-xs text-muted-foreground">Visualizações</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg text-center">
                      <p className="text-2xl font-bold">{lesson.likes_count || 0}</p>
                      <p className="text-xs text-muted-foreground">Curtidas</p>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Criado: {lesson.created_at ? new Date(lesson.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Atualizado: {lesson.updated_at ? new Date(lesson.updated_at).toLocaleDateString('pt-BR') : 'N/A'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB: Extras */}
            <TabsContent value="extras" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Gamificação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label>XP de Recompensa</Label>
                    <Input
                      type="number"
                      placeholder="Ex: 10"
                      value={formData.xp_reward || ""}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        xp_reward: e.target.value ? parseInt(e.target.value) : null 
                      }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      Pontos de experiência concedidos ao completar esta aula
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Material Complementar
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome do Material</Label>
                    <Input
                      placeholder="Ex: Resumo da Aula.pdf"
                      value={formData.material_nome}
                      onChange={(e) => setFormData(prev => ({ ...prev, material_nome: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>URL do Material</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://..."
                        value={formData.material_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, material_url: e.target.value }))}
                      />
                      {formData.material_url && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => window.open(formData.material_url, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Transcrição
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Transcrição do vídeo para acessibilidade e SEO..."
                    value={formData.transcript}
                    onChange={(e) => setFormData(prev => ({ ...prev, transcript: e.target.value }))}
                    rows={6}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </ScrollArea>

        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? (
              <>Salvando...</>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
