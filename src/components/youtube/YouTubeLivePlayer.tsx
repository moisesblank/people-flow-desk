import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, Users, Radio, ExternalLink, Maximize2, 
  MessageSquare, Heart, Share2, Bell, Volume2, VolumeX,
  ChevronDown, ChevronUp, Clock, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useYouTubeLivePlayer } from '@/hooks/useYouTubeLive';
import { cn } from '@/lib/utils';
import { FortressPlayerWrapper, getFortressYouTubeUrl } from "@/components/video";

interface YouTubeLivePlayerProps {
  videoId?: string;
  autoplay?: boolean;
  showChat?: boolean;
  className?: string;
  onViewerCountChange?: (count: number) => void;
}

export const YouTubeLivePlayer: React.FC<YouTubeLivePlayerProps> = ({
  videoId,
  autoplay = true,
  showChat = true,
  className,
  onViewerCountChange,
}) => {
  const { 
    videoId: activeVideoId, 
    isLive, 
    concurrentViewers, 
    title, 
    embedUrl,
    watchUrl,
    isLoading,
    refetch 
  } = useYouTubeLivePlayer(videoId);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showChatPanel, setShowChatPanel] = useState(showChat);
  const [isMuted, setIsMuted] = useState(false);

  // Atualizar contador de viewers
  useEffect(() => {
    if (onViewerCountChange && concurrentViewers) {
      onViewerCountChange(concurrentViewers);
    }
  }, [concurrentViewers, onViewerCountChange]);

  // Polling para atualizar viewers
  useEffect(() => {
    if (!isLive) return;
    
    const interval = setInterval(() => {
      refetch();
    }, 30000); // A cada 30 segundos

    return () => clearInterval(interval);
  }, [isLive, refetch]);

  if (isLoading) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <Skeleton className="aspect-video w-full" />
        <CardContent className="p-4">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (!activeVideoId) {
    return (
      <Card className={cn("overflow-hidden bg-gradient-to-br from-background to-muted", className)}>
        <CardContent className="aspect-video flex flex-col items-center justify-center p-8 text-center">
          <Radio className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">Nenhuma live ativa</h3>
          <p className="text-muted-foreground mb-4">
            Não há transmissões ao vivo no momento.
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            Verificar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  const embedSrc = `https://www.youtube.com/embed/${activeVideoId}?autoplay=${autoplay ? 1 : 0}&rel=0&modestbranding=1&mute=${isMuted ? 1 : 0}&vq=hd1080&showinfo=0&iv_load_policy=3`;
  const chatSrc = `https://www.youtube.com/live_chat?v=${activeVideoId}&embed_domain=${window.location.hostname}`;

  return (
    <Card className={cn(
      "overflow-hidden bg-gradient-to-br from-background to-muted/50",
      isFullscreen && "fixed inset-0 z-50 rounded-none",
      className
    )}>
      {/* Header */}
      <CardHeader className="p-3 border-b bg-background/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isLive && (
              <Badge variant="destructive" className="animate-pulse flex items-center gap-1">
                <Radio className="w-3 h-3" />
                AO VIVO
              </Badge>
            )}
            <CardTitle className="text-sm md:text-base line-clamp-1">
              {title}
            </CardTitle>
          </div>
          
          <div className="flex items-center gap-2">
            {isLive && concurrentViewers > 0 && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {concurrentViewers.toLocaleString('pt-BR')}
              </Badge>
            )}
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              asChild
            >
              <a href={watchUrl || '#'} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Player + Chat Container */}
      <div className={cn(
        "flex",
        showChatPanel ? "flex-col lg:flex-row" : "flex-col"
      )}>
        {/* Video Player com FortressPlayerWrapper */}
        <div className={cn(
          "relative bg-black",
          showChatPanel ? "lg:flex-1" : "w-full"
        )}>
          <FortressPlayerWrapper className="aspect-video" showSecurityBadge>
            <iframe
              src={embedSrc}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              title={title || 'YouTube Live'}
            />
          </FortressPlayerWrapper>

          {/* Live indicator overlay */}
          {isLive && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-4 left-4 pointer-events-none z-[70]"
            >
              <div className="flex items-center gap-2 bg-red-600/90 text-white px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                AO VIVO
                <span className="text-white/80">
                  • {concurrentViewers.toLocaleString('pt-BR')} assistindo
                </span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Chat Panel */}
        <AnimatePresence>
          {showChatPanel && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="border-l bg-background lg:w-80"
            >
              <div className="flex items-center justify-between p-2 border-b">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <MessageSquare className="w-4 h-4" />
                  Chat ao vivo
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setShowChatPanel(false)}
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </div>
              
              <iframe
                src={chatSrc}
                className="w-full h-[400px] lg:h-[calc(100%-40px)]"
                title="YouTube Live Chat"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle Chat Button (when hidden) */}
        {!showChatPanel && (
          <Button
            variant="outline"
            size="sm"
            className="absolute bottom-4 right-4"
            onClick={() => setShowChatPanel(true)}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Mostrar chat
          </Button>
        )}
      </div>

      {/* Action Bar */}
      <div className="flex items-center justify-between p-3 border-t bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Heart className="w-4 h-4 mr-1" />
            Curtir
          </Button>
          <Button variant="ghost" size="sm">
            <Share2 className="w-4 h-4 mr-1" />
            Compartilhar
          </Button>
        </div>
        
        <Button variant="outline" size="sm">
          <Bell className="w-4 h-4 mr-1" />
          Ativar notificações
        </Button>
      </div>
    </Card>
  );
};

export default YouTubeLivePlayer;
