// ============================================
// VIRTUALIZADA ALUNO VIDEOAULAS v2300
// Para listas grandes de videoaulas do aluno
// ============================================

import { useRef, useState, useEffect, useCallback, memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlayCircle, Clock, BookOpen, Star, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  duration_minutes: number | null;
  views_count: number | null;
  panda_video_id: string | null;
  youtube_video_id: string | null;
  video_provider: string | null;
  video_url?: string | null;
  is_published: boolean;
  position: number;
  module: { id: string; title: string } | null;
}

interface VirtualizedAlunoVideoaulaListProps {
  lessons: Lesson[];
  onOpenLesson: (lesson: Lesson) => void;
  className?: string;
}

// Card de videoaula memoizado
const VideoaulaCard = memo(({ 
  lesson, 
  onOpenLesson 
}: { 
  lesson: Lesson; 
  onOpenLesson: (lesson: Lesson) => void;
}) => (
  <Card 
    className="relative overflow-hidden transition-all hover:shadow-lg group cursor-pointer h-full"
    onClick={() => onOpenLesson(lesson)}
  >
    {/* Thumbnail */}
    {lesson.thumbnail_url && (
      <div className="relative aspect-video bg-muted overflow-hidden">
        <img 
          src={lesson.thumbnail_url} 
          alt={lesson.title}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <PlayCircle className="w-12 h-12 text-white" />
        </div>
        {lesson.duration_minutes && (
          <Badge className="absolute bottom-2 right-2 bg-black/70">
            <Clock className="w-3 h-3 mr-1" />
            {lesson.duration_minutes} min
          </Badge>
        )}
      </div>
    )}
    
    <CardHeader className="pb-2">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <PlayCircle className="w-5 h-5 text-primary flex-shrink-0" />
          <CardTitle className="text-lg line-clamp-2">{lesson.title}</CardTitle>
        </div>
      </div>
      {lesson.module?.title && (
        <Badge variant="outline" className="w-fit">
          <BookOpen className="w-3 h-3 mr-1" />
          {lesson.module.title}
        </Badge>
      )}
      {lesson.description && (
        <CardDescription className="line-clamp-2">{lesson.description}</CardDescription>
      )}
    </CardHeader>
    
    <CardContent className="space-y-4">
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        {lesson.duration_minutes && (
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {lesson.duration_minutes} min
          </span>
        )}
        {lesson.views_count && lesson.views_count > 0 && (
          <span className="flex items-center gap-1">
            <Star className="w-4 h-4" />
            {lesson.views_count} views
          </span>
        )}
      </div>

      <Button className="w-full" onClick={(e) => { e.stopPropagation(); onOpenLesson(lesson); }}>
        Assistir aula
        <ChevronRight className="w-4 h-4 ml-2" />
      </Button>
    </CardContent>
  </Card>
));

VideoaulaCard.displayName = 'VideoaulaCard';

// Altura de cada row (3 cards por row)
const ROW_HEIGHT = 380;
const CARDS_PER_ROW = 3;

export function VirtualizedAlunoVideoaulaList({
  lessons,
  onOpenLesson,
  className
}: VirtualizedAlunoVideoaulaListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(800);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(([entry]) => {
      setContainerHeight(entry.contentRect.height);
    });

    resizeObserver.observe(container);
    setContainerHeight(container.clientHeight || 800);
    
    return () => resizeObserver.disconnect();
  }, []);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  if (lessons.length === 0) {
    return (
      <div className={cn('flex items-center justify-center p-8 text-muted-foreground', className)}>
        <div className="text-center">
          <PlayCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p>Nenhuma videoaula encontrada</p>
        </div>
      </div>
    );
  }

  // Calcular rows (3 cards por row)
  const totalRows = Math.ceil(lessons.length / CARDS_PER_ROW);
  const totalHeight = totalRows * ROW_HEIGHT;
  
  const overscan = 2;
  const startRow = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - overscan);
  const endRow = Math.min(
    totalRows,
    Math.ceil((scrollTop + containerHeight) / ROW_HEIGHT) + overscan
  );

  const offsetY = startRow * ROW_HEIGHT;

  // Renderizar rows visíveis
  const visibleRows: JSX.Element[] = [];
  for (let row = startRow; row < endRow; row++) {
    const startIdx = row * CARDS_PER_ROW;
    const rowLessons = lessons.slice(startIdx, startIdx + CARDS_PER_ROW);
    
    visibleRows.push(
      <div 
        key={row} 
        className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4"
        style={{ minHeight: ROW_HEIGHT - 16 }}
      >
        {rowLessons.map((lesson) => (
          <VideoaulaCard 
            key={lesson.id} 
            lesson={lesson} 
            onOpenLesson={onOpenLesson} 
          />
        ))}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={cn('overflow-auto', className)}
      style={{ height: 'calc(100vh - 400px)', minHeight: 500 }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleRows}
        </div>
      </div>
    </div>
  );
}
