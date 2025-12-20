import React from 'react';
import { motion } from 'framer-motion';
import { 
  Youtube, Users, Eye, Video, TrendingUp, 
  RefreshCw, ExternalLink, Play, Radio
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useYouTubeLive, useYouTubeChannel } from '@/hooks/useYouTubeLive';
import { cn } from '@/lib/utils';

interface YouTubeChannelStatsProps {
  showSyncButton?: boolean;
  compact?: boolean;
  className?: string;
}

export const YouTubeChannelStats: React.FC<YouTubeChannelStatsProps> = ({
  showSyncButton = true,
  compact = false,
  className,
}) => {
  const { channel, liveStatus, isLoading, error, refetch } = useYouTubeChannel();
  const { useSyncChannel } = useYouTubeLive();
  const syncMutation = useSyncChannel();

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString('pt-BR');
  };

  if (isLoading) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="text-center">
                <Skeleton className="h-8 w-20 mx-auto mb-2" />
                <Skeleton className="h-4 w-16 mx-auto" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !channel) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardContent className="py-8 text-center">
          <Youtube className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground mb-4">
            Não foi possível carregar os dados do canal
          </p>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  const stats = [
    {
      icon: Users,
      label: 'Inscritos',
      value: channel.subscriberCount,
      color: 'text-red-500',
    },
    {
      icon: Eye,
      label: 'Visualizações',
      value: channel.viewCount,
      color: 'text-blue-500',
    },
    {
      icon: Video,
      label: 'Vídeos',
      value: channel.videoCount,
      color: 'text-green-500',
    },
  ];

  if (compact) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={channel.thumbnails?.medium?.url || channel.thumbnails?.default?.url}
                  alt={channel.title}
                  className="w-12 h-12 rounded-full"
                />
                {liveStatus?.isLive && (
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-background animate-pulse" />
                )}
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">{channel.title}</h4>
                  {liveStatus?.isLive && (
                    <Badge variant="destructive" className="text-xs">
                      <Radio className="w-3 h-3 mr-1" />
                      AO VIVO
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatNumber(channel.subscriberCount)} inscritos
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a 
                  href={`https://youtube.com/${channel.customUrl}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <Youtube className="w-4 h-4 mr-1" />
                  Canal
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      {/* Banner */}
      {channel.bannerUrl && (
        <div 
          className="h-32 bg-cover bg-center"
          style={{ backgroundImage: `url(${channel.bannerUrl})` }}
        />
      )}
      
      <CardHeader className="relative">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative -mt-8">
            <img
              src={channel.thumbnails?.medium?.url || channel.thumbnails?.default?.url}
              alt={channel.title}
              className="w-20 h-20 rounded-full border-4 border-background"
            />
            {liveStatus?.isLive && (
              <span className="absolute bottom-0 right-0 w-6 h-6 bg-red-500 rounded-full border-2 border-background flex items-center justify-center animate-pulse">
                <Radio className="w-3 h-3 text-white" />
              </span>
            )}
          </div>
          
          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-xl">{channel.title}</CardTitle>
              {liveStatus?.isLive && (
                <Badge variant="destructive" className="animate-pulse">
                  <Radio className="w-3 h-3 mr-1" />
                  AO VIVO
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {channel.description}
            </p>
          </div>
          
          {/* Actions */}
          <div className="flex gap-2">
            {showSyncButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
              >
                <RefreshCw className={cn(
                  "w-4 h-4 mr-1",
                  syncMutation.isPending && "animate-spin"
                )} />
                Sincronizar
              </Button>
            )}
            <Button
              variant="default"
              size="sm"
              className="bg-red-600 hover:bg-red-700"
              asChild
            >
              <a 
                href={`https://youtube.com/${channel.customUrl}`} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Youtube className="w-4 h-4 mr-1" />
                Acessar Canal
              </a>
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="text-center p-4 rounded-lg bg-muted/50"
            >
              <stat.icon className={cn("w-6 h-6 mx-auto mb-2", stat.color)} />
              <p className="text-2xl font-bold">{formatNumber(stat.value)}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Live Status */}
        {liveStatus?.isLive && liveStatus.currentLive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-lg bg-red-500/10 border border-red-500/20"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={liveStatus.currentLive.thumbnails?.medium?.url}
                  alt={liveStatus.currentLive.title}
                  className="w-32 h-18 rounded object-cover"
                />
                <span className="absolute top-1 left-1 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded">
                  AO VIVO
                </span>
              </div>
              
              <div className="flex-1">
                <h4 className="font-semibold line-clamp-1">
                  {liveStatus.currentLive.title}
                </h4>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {liveStatus.currentLive.concurrentViewers.toLocaleString('pt-BR')} assistindo agora
                </p>
              </div>
              
              <Button className="bg-red-600 hover:bg-red-700" asChild>
                <a 
                  href={`https://youtube.com/watch?v=${liveStatus.currentLive.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Play className="w-4 h-4 mr-1" />
                  Assistir
                </a>
              </Button>
            </div>
          </motion.div>
        )}

        {/* Upcoming Lives */}
        {liveStatus?.upcomingLives && liveStatus.upcomingLives.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Próximas transmissões
            </h4>
            <div className="space-y-2">
              {liveStatus.upcomingLives.slice(0, 3).map((live: any) => (
                <div 
                  key={live.videoId}
                  className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <img
                    src={live.thumbnails?.default?.url}
                    alt={live.title}
                    className="w-16 h-9 rounded object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{live.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {live.scheduledStartTime && new Date(live.scheduledStartTime).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <a 
                      href={`https://youtube.com/watch?v=${live.videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default YouTubeChannelStats;
