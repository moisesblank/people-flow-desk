// ============================================
// MOISÉS MEDEIROS v10.0 - CENTRAL DE LIVES
// Página dedicada para aulas ao vivo YouTube
// Design futurista com player e chat integrados
// ============================================

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuantumReactivity } from "@/hooks/useQuantumReactivity";
import { Helmet } from "react-helmet";
import {
  Youtube,
  Radio,
  Users,
  Eye,
  Calendar,
  Clock,
  Play,
  Video,
  MessageCircle,
  Bell,
  BellRing,
  TrendingUp,
  Heart,
  Share2,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Wifi,
  WifiOff,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  YouTubeLivePlayer,
  YouTubeChannelStats,
  YouTubeVideoGrid,
  YouTubeLiveWidget
} from "@/components/youtube";
import { useYouTubeLive, useYouTubeChannel } from "@/hooks/useYouTubeLive";
import { LiveChatPanel } from "@/components/chat";

// Componente de Live Card
function LiveCard({ live, isUpcoming = false }: { live: any; isUpcoming?: boolean }) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  
  const formatDate = (dateStr: string) => {
    return format(new Date(dateStr), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR });
  };

  const handleSubscribe = () => {
    setIsSubscribed(!isSubscribed);
    toast.success(isSubscribed ? "Lembrete removido" : "Você será notificado quando a live começar!");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.01 }}
      className="group"
    >
      <Card className="overflow-hidden border-border/20 bg-gradient-to-br from-card/90 to-card/50 backdrop-blur-xl hover:border-red-500/40 transition-all duration-500">
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden">
          {live.thumbnail_url ? (
            <img
              src={live.thumbnail_url}
              alt={live.titulo}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-red-600 to-pink-600 flex items-center justify-center">
              <Youtube className="h-16 w-16 text-white/50" />
            </div>
          )}
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          
          {/* Live Badge */}
          {live.status === 'live' && (
            <motion.div
              className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600"
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Radio className="h-3 w-3 text-white" />
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">AO VIVO</span>
            </motion.div>
          )}
          
          {isUpcoming && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-600">
              <Calendar className="h-3 w-3 text-white" />
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">AGENDADA</span>
            </div>
          )}
          
          {/* Viewers */}
          {live.status === 'live' && live.max_viewers > 0 && (
            <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm">
              <Eye className="h-3 w-3 text-white" />
              <span className="text-xs font-semibold text-white">
                {live.max_viewers.toLocaleString()}
              </span>
            </div>
          )}
          
          {/* Play button */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            whileHover={{ scale: 1.1 }}
          >
            <div className="p-4 rounded-full bg-red-600/90 backdrop-blur-sm shadow-2xl">
              <Play className="h-8 w-8 text-white fill-white" />
            </div>
          </motion.div>
          
          {/* Bottom info */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            {live.scheduled_start && live.status !== 'live' && (
              <div className="flex items-center gap-1.5 text-white/90">
                <Clock className="h-3.5 w-3.5" />
                <span className="text-xs">{formatDate(live.scheduled_start)}</span>
              </div>
            )}
          </div>
        </div>
        
        <CardContent className="p-4 space-y-3">
          <h3 className="font-bold text-foreground line-clamp-2 group-hover:text-red-400 transition-colors">
            {live.titulo}
          </h3>
          
          {live.descricao && (
            <p className="text-sm text-muted-foreground line-clamp-2">{live.descricao}</p>
          )}
          
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {live.max_viewers > 0 && (
                <span className="flex items-center gap-1">
                  <Eye className="h-3.5 w-3.5" />
                  {live.max_viewers.toLocaleString()}
                </span>
              )}
              {live.total_chat_messages > 0 && (
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-3.5 w-3.5" />
                  {live.total_chat_messages.toLocaleString()}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {isUpcoming && (
                <Button
                  variant={isSubscribed ? "default" : "outline"}
                  size="sm"
                  onClick={handleSubscribe}
                  className="h-8"
                >
                  {isSubscribed ? (
                    <>
                      <BellRing className="h-3.5 w-3.5 mr-1" />
                      Notificar
                    </>
                  ) : (
                    <>
                      <Bell className="h-3.5 w-3.5 mr-1" />
                      Lembrar
                    </>
                  )}
                </Button>
              )}
              
              {live.status === 'live' && (
                <Button
                  size="sm"
                  className="h-8 bg-red-600 hover:bg-red-700"
                  onClick={() => window.open(`https://youtube.com/watch?v=${live.video_id}`, "_blank")}
                >
                  <Play className="h-3.5 w-3.5 mr-1 fill-white" />
                  Assistir
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Status Indicator
function ConnectionStatus({ isConnected }: { isConnected: boolean }) {
  return (
    <motion.div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
        isConnected 
          ? "bg-emerald-500/20 text-emerald-500" 
          : "bg-red-500/20 text-red-500"
      }`}
      animate={isConnected ? { opacity: [1, 0.7, 1] } : {}}
      transition={{ duration: 2, repeat: Infinity }}
    >
      {isConnected ? (
        <>
          <Wifi className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">Conectado</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">Desconectado</span>
        </>
      )}
    </motion.div>
  );
}

export default function Lives() {
  const [activeTab, setActiveTab] = useState("ao-vivo");
  const queryClient = useQueryClient();
  
  // Hooks do YouTube
  const { useChannelStats, useLiveStatus, useSyncChannel } = useYouTubeLive();
  const { data: channelStats, isLoading: loadingStats } = useChannelStats();
  const { data: liveStatus, isLoading: loadingLive } = useLiveStatus();
  const syncMutation = useSyncChannel();
  
  // Buscar lives do banco
  const { data: lives = [], isLoading: loadingLives, refetch: refetchLives } = useQuery({
    queryKey: ["youtube-lives"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("youtube_lives")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    refetchInterval: 30000 // Atualiza a cada 30s
  });
  
  // Tipos para as lives
  type LiveData = {
    id: string;
    video_id: string;
    titulo: string;
    descricao: string | null;
    status: string;
    scheduled_start: string | null;
    actual_start: string | null;
    actual_end: string | null;
    thumbnail_url: string | null;
    max_viewers: number;
    total_chat_messages: number;
  };
  
  // Buscar vídeos recentes
  const { data: videos = [], isLoading: loadingVideos } = useQuery({
    queryKey: ["youtube-videos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("youtube_videos")
        .select("*")
        .order("published_at", { ascending: false })
        .limit(12);
      if (error) throw error;
      return data || [];
    }
  });
  
  // Realtime subscription para lives
  useEffect(() => {
    const channel = supabase
      .channel("youtube-lives-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "youtube_lives" },
        () => {
          refetchLives();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetchLives]);
  
  const handleSync = async () => {
    try {
      await syncMutation.mutateAsync();
      toast.success("Dados do YouTube sincronizados com sucesso!");
    } catch (error) {
      toast.error("Erro ao sincronizar dados do YouTube");
    }
  };
  
  // Mapear dados do banco para UI
  const currentLive = lives.find((l: LiveData) => l.status === 'live');
  const upcomingLives = lives.filter((l: LiveData) => 
    l.status === 'scheduled' && l.scheduled_start && new Date(l.scheduled_start) > new Date()
  );
  const pastLives = lives.filter((l: LiveData) => 
    l.status === 'ended' || (l.scheduled_start && new Date(l.scheduled_start) <= new Date() && l.status !== 'live')
  );
  
  const isConnected = !!(channelStats as any)?.channelId;
  
  return (
    <>
      <Helmet>
        <title>Lives YouTube | Curso de Química - Moisés Medeiros</title>
        <meta 
          name="description" 
          content="Assista às aulas ao vivo do Professor Moisés Medeiros. Química para Enem e vestibulares com interação em tempo real." 
        />
      </Helmet>
      
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <motion.div
              className="p-3 rounded-2xl bg-gradient-to-br from-red-600 to-pink-600 shadow-lg"
              whileHover={{ scale: 1.05, rotate: 5 }}
              style={{ boxShadow: "0 8px 32px rgba(239, 68, 68, 0.3)" }}
            >
              <Youtube className="h-8 w-8 text-white" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-black text-foreground">Central de Lives</h1>
              <p className="text-muted-foreground">Aulas ao vivo com o Professor Moisés</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <ConnectionStatus isConnected={isConnected} />
            <Button
              variant="outline"
              onClick={handleSync}
              disabled={syncMutation.isPending}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? "animate-spin" : ""}`} />
              Sincronizar
            </Button>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-red-500/10 to-pink-500/10 border-red-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/20">
                  <Users className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Inscritos</p>
                  <p className="text-2xl font-bold text-foreground">
                    {channelStats?.subscriber_count?.toLocaleString() || "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/20">
                  <Eye className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Visualizações</p>
                  <p className="text-2xl font-bold text-foreground">
                    {channelStats?.view_count?.toLocaleString() || "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500/10 to-violet-500/10 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/20">
                  <Video className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Vídeos</p>
                  <p className="text-2xl font-bold text-foreground">
                    {channelStats?.video_count?.toLocaleString() || "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border-emerald-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Lives Este Mês</p>
                  <p className="text-2xl font-bold text-foreground">{lives.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Live Now Banner */}
        {currentLive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 via-pink-600 to-purple-600 p-6"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
            <div className="relative flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1">
                <motion.div
                  className="flex items-center gap-2 mb-2"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <Radio className="h-5 w-5 text-white" />
                  <span className="text-sm font-bold text-white uppercase tracking-wider">AO VIVO AGORA</span>
                </motion.div>
                <h2 className="text-2xl font-black text-white mb-2">{currentLive.titulo}</h2>
                <div className="flex items-center gap-4 text-white/80 text-sm">
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {currentLive.max_viewers?.toLocaleString() || 0} assistindo
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-4 w-4" />
                    {currentLive.total_chat_messages?.toLocaleString() || 0} mensagens
                  </span>
                </div>
              </div>
              <Button
                size="lg"
                className="bg-white text-red-600 hover:bg-white/90 font-bold shadow-2xl"
                onClick={() => window.open(`https://youtube.com/watch?v=${currentLive.video_id}`, "_blank")}
              >
                <Play className="h-5 w-5 mr-2 fill-red-600" />
                Assistir Agora
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}
        
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="ao-vivo" className="gap-2">
              <Radio className="h-4 w-4" />
              Ao Vivo
              {currentLive && (
                <Badge variant="destructive" className="ml-1 h-5 px-1.5">1</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="agendadas" className="gap-2">
              <Calendar className="h-4 w-4" />
              Agendadas
              {upcomingLives.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">{upcomingLives.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="anteriores" className="gap-2">
              <Video className="h-4 w-4" />
              Anteriores
            </TabsTrigger>
            <TabsTrigger value="videos" className="gap-2">
              <Youtube className="h-4 w-4" />
              Todos os Vídeos
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="ao-vivo" className="space-y-6">
            {currentLive ? (
              <div className="grid lg:grid-cols-4 gap-6">
                {/* Player de Vídeo - 3 colunas */}
                <div className="lg:col-span-3 space-y-4">
                  <YouTubeLivePlayer videoId={currentLive.video_id} showChat={false} />
                  
                  {/* Stats do canal */}
                  <YouTubeChannelStats compact />
                </div>
                
                {/* Chat em Tempo Real - 1 coluna */}
                <div className="lg:col-span-1">
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card className="h-[600px] flex flex-col overflow-hidden border-red-500/20">
                      <CardHeader className="p-3 border-b bg-gradient-to-r from-red-500/10 to-pink-500/10">
                        <CardTitle className="text-sm flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MessageCircle className="h-4 w-4 text-red-500" />
                            Chat ao Vivo
                          </div>
                          <Badge variant="outline" className="text-xs">
                            <Users className="h-3 w-3 mr-1" />
                            {currentLive.max_viewers?.toLocaleString() || 0}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex-1 p-0 overflow-hidden">
                        {/* Chat interno - suporta 5.000 simultâneos */}
                        <LiveChatPanel 
                          liveId={currentLive.id} 
                          className="h-full border-0 rounded-none"
                          maxHeight="calc(100% - 60px)"
                          showViewerCount={false}
                        />
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              </div>
            ) : (
              <Card className="p-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 rounded-full bg-muted">
                    <Radio className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Nenhuma live acontecendo agora</h3>
                    <p className="text-muted-foreground">
                      Fique ligado nas próximas lives agendadas ou assista às gravações anteriores.
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => setActiveTab("agendadas")}>
                    Ver Próximas Lives
                  </Button>
                </div>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="agendadas">
            {upcomingLives.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingLives.map((live: any) => (
                  <LiveCard key={live.id} live={live} isUpcoming />
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 rounded-full bg-muted">
                    <Calendar className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Nenhuma live agendada</h3>
                    <p className="text-muted-foreground">
                      Novas lives serão anunciadas em breve. Ative as notificações para ser avisado!
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="anteriores">
            {pastLives.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pastLives.map((live: any) => (
                  <LiveCard key={live.id} live={live} />
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 rounded-full bg-muted">
                    <Video className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Nenhuma live anterior</h3>
                    <p className="text-muted-foreground">
                      As gravações das lives ficarão disponíveis aqui após serem transmitidas.
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="videos">
            <YouTubeVideoGrid />
          </TabsContent>
        </Tabs>
        
        {/* Widget flutuante de Live */}
        <AnimatePresence>
          {currentLive && activeTab !== "ao-vivo" && (
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.8 }}
              className="fixed bottom-6 right-6 z-50"
            >
              <YouTubeLiveWidget />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
