import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Radio, Users, Play, ExternalLink, Bell,
  Youtube, Clock, Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useYouTubeLive } from '@/hooks/useYouTubeLive';
import { cn } from '@/lib/utils';

interface YouTubeLiveWidgetProps {
  className?: string;
  showUpcoming?: boolean;
  maxUpcoming?: number;
}

export const YouTubeLiveWidget: React.FC<YouTubeLiveWidgetProps> = ({
  className,
  showUpcoming = true,
  maxUpcoming = 3,
}) => {
  const { useLiveStatus, useUpcomingLives } = useYouTubeLive();
  const liveStatusQuery = useLiveStatus();
  const upcomingQuery = useUpcomingLives();

  const liveStatus = liveStatusQuery.data;
  const upcomingLives = upcomingQuery.data || [];
  const isLoading = liveStatusQuery.isLoading;

  const formatTimeUntil = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    
    if (diff < 0) return 'Em breve';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `Em ${days} dia${days > 1 ? 's' : ''}`;
    }
    if (hours > 0) {
      return `Em ${hours}h ${minutes}min`;
    }
    return `Em ${minutes} min`;
  };

  if (isLoading) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full mb-4" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Youtube className="w-5 h-5 text-red-500" />
          YouTube Live
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Live Now Section */}
        <AnimatePresence mode="wait">
          {liveStatus?.isLive && liveStatus.currentLive ? (
            <motion.div
              key="live"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative overflow-hidden rounded-lg bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30"
            >
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent animate-pulse" />
              
              <div className="relative p-4">
                <div className="flex items-start gap-3">
                  {/* Thumbnail */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={liveStatus.currentLive.thumbnails?.medium?.url}
                      alt={liveStatus.currentLive.title}
                      className="w-24 h-14 rounded object-cover"
                    />
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -left-2 text-xs animate-pulse"
                    >
                      <Radio className="w-3 h-3 mr-1" />
                      LIVE
                    </Badge>
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm line-clamp-2 mb-1">
                      {liveStatus.currentLive.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="w-3 h-3" />
                      <span className="font-medium text-foreground">
                        {liveStatus.currentLive.concurrentViewers.toLocaleString('pt-BR')}
                      </span>
                      <span>assistindo agora</span>
                    </div>
                  </div>
                </div>
                
                {/* Action Button */}
                <Button 
                  className="w-full mt-3 bg-red-600 hover:bg-red-700"
                  size="sm"
                  asChild
                >
                  <a 
                    href={`https://youtube.com/watch?v=${liveStatus.currentLive.videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Assistir ao vivo
                  </a>
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="offline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-6 rounded-lg bg-muted/50"
            >
              <Radio className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground">
                Nenhuma transmissão ao vivo no momento
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upcoming Lives */}
        {showUpcoming && upcomingLives.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Próximas transmissões
            </h4>
            
            <div className="space-y-2">
              {upcomingLives.slice(0, maxUpcoming).map((live: any, index: number) => (
                <motion.div
                  key={live.videoId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  {/* Thumbnail */}
                  <img
                    src={live.thumbnails?.default?.url}
                    alt={live.title}
                    className="w-16 h-9 rounded object-cover flex-shrink-0"
                  />
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium line-clamp-1">
                      {live.title}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {live.scheduledStartTime 
                        ? formatTimeUntil(live.scheduledStartTime)
                        : 'Data a definir'
                      }
                    </p>
                  </div>
                  
                  {/* Bell Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    asChild
                  >
                    <a 
                      href={`https://youtube.com/watch?v=${live.videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Bell className="w-4 h-4" />
                    </a>
                  </Button>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* View Channel Button */}
        <Button 
          variant="outline" 
          className="w-full"
          size="sm"
          asChild
        >
          <a 
            href="https://youtube.com/@moises.profquimica" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <Youtube className="w-4 h-4 mr-2" />
            Ver canal no YouTube
            <ExternalLink className="w-3 h-3 ml-2" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
};

export default YouTubeLiveWidget;
