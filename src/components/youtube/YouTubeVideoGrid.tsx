import React from 'react';
import { motion } from 'framer-motion';
import { 
  Play, Eye, ThumbsUp, MessageSquare, Clock,
  Radio, Calendar, ExternalLink
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useYouTubeLive, YouTubeVideo } from '@/hooks/useYouTubeLive';
import { cn } from '@/lib/utils';

interface YouTubeVideoGridProps {
  maxVideos?: number;
  columns?: 2 | 3 | 4;
  showStats?: boolean;
  className?: string;
  onVideoClick?: (video: YouTubeVideo) => void;
}

export const YouTubeVideoGrid: React.FC<YouTubeVideoGridProps> = ({
  maxVideos = 12,
  columns = 3,
  showStats = true,
  className,
  onVideoClick,
}) => {
  const { useVideos } = useYouTubeLive();
  const { data, isLoading, error } = useVideos(maxVideos);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString('pt-BR');
  };

  const formatDuration = (duration: string) => {
    if (!duration) return '';
    
    // ISO 8601 duration format: PT1H2M3S
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return duration;
    
    const hours = match[1] ? parseInt(match[1]) : 0;
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const seconds = match[3] ? parseInt(match[3]) : 0;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Hoje';
    if (days === 1) return 'Ontem';
    if (days < 7) return `${days} dias atrás`;
    if (days < 30) return `${Math.floor(days / 7)} semanas atrás`;
    if (days < 365) return `${Math.floor(days / 30)} meses atrás`;
    return `${Math.floor(days / 365)} anos atrás`;
  };

  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  };

  if (isLoading) {
    return (
      <div className={cn(`grid ${gridCols[columns]} gap-4`, className)}>
        {Array.from({ length: maxVideos }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="aspect-video" />
            <CardContent className="p-3">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !data?.videos?.length) {
    return (
      <Card className={className}>
        <CardContent className="py-12 text-center">
          <Play className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">
            Nenhum vídeo encontrado
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn(`grid ${gridCols[columns]} gap-4`, className)}>
      {data.videos.map((video: YouTubeVideo, index: number) => (
        <motion.div
          key={video.videoId}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card 
            className="overflow-hidden group cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all"
            onClick={() => onVideoClick?.(video)}
          >
            {/* Thumbnail */}
            <div className="relative aspect-video bg-muted">
              <img
                src={video.thumbnails?.high?.url || video.thumbnails?.medium?.url}
                alt={video.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              
              {/* Duration Badge */}
              {video.duration && !video.isLive && (
                <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-medium">
                  {formatDuration(video.duration)}
                </span>
              )}
              
              {/* Live Badge */}
              {video.isLive && (
                <Badge 
                  variant="destructive" 
                  className="absolute top-2 left-2 animate-pulse"
                >
                  <Radio className="w-3 h-3 mr-1" />
                  AO VIVO
                </Badge>
              )}
              
              {/* Upcoming Badge */}
              {video.isUpcoming && (
                <Badge 
                  variant="secondary" 
                  className="absolute top-2 left-2"
                >
                  <Calendar className="w-3 h-3 mr-1" />
                  AGENDADO
                </Badge>
              )}
              
              {/* Play overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            
            <CardContent className="p-3">
              {/* Title */}
              <h4 className="font-medium line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                {video.title}
              </h4>
              
              {/* Stats */}
              {showStats && (
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {formatNumber(video.viewCount)}
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="w-3 h-3" />
                    {formatNumber(video.likeCount)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(video.publishedAt)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default YouTubeVideoGrid;
