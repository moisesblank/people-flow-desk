import { motion } from 'framer-motion';
import { Clock, Users, Star, Play, Lock, BookOpen } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface CourseCardProps {
  id: string;
  title: string;
  description?: string | null;
  thumbnail_url?: string | null;
  category?: string;
  difficulty_level?: string;
  estimated_hours?: number;
  total_xp?: number;
  price?: number;
  is_published?: boolean;
  instructor?: {
    nome: string;
    avatar_url?: string | null;
  } | null;
  progress?: number;
  isEnrolled?: boolean;
  onClick?: () => void;
  onEnroll?: () => void;
}

const difficultyColors = {
  iniciante: 'bg-stats-green/10 text-stats-green border-stats-green/20',
  intermediario: 'bg-stats-gold/10 text-stats-gold border-stats-gold/20',
  avancado: 'bg-primary/10 text-primary border-primary/20',
};

export function CourseCard({
  id,
  title,
  description,
  thumbnail_url,
  category = 'Geral',
  difficulty_level = 'iniciante',
  estimated_hours = 0,
  total_xp = 100,
  price = 0,
  instructor,
  progress,
  isEnrolled,
  onClick,
  onEnroll,
}: CourseCardProps) {
  const isFree = price === 0;
  const difficultyClass = difficultyColors[difficulty_level as keyof typeof difficultyColors] || difficultyColors.iniciante;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card 
        className={cn(
          'overflow-hidden cursor-pointer group transition-all duration-300',
          'hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20'
        )}
        onClick={onClick}
      >
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden bg-muted">
          {thumbnail_url ? (
            <img
              src={thumbnail_url}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
              <BookOpen className="h-12 w-12 text-primary/50" />
            </div>
          )}
          
          {/* Overlay badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge variant="secondary" className={difficultyClass}>
              {difficulty_level}
            </Badge>
            {isFree && (
              <Badge className="bg-stats-green text-white">
                Gratuito
              </Badge>
            )}
          </div>

          {/* XP Badge */}
          <div className="absolute top-3 right-3">
            <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
              +{total_xp} XP
            </Badge>
          </div>

          {/* Play button overlay */}
          {isEnrolled && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                <Play className="h-8 w-8 text-primary-foreground ml-1" />
              </div>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          {/* Category */}
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            {category}
          </p>

          {/* Title */}
          <h3 className="font-semibold text-lg line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {title}
          </h3>

          {/* Description */}
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {description}
            </p>
          )}

          {/* Meta info */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {estimated_hours > 0 && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{estimated_hours}h</span>
              </div>
            )}
            {instructor && (
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{instructor.nome}</span>
              </div>
            )}
          </div>

          {/* Progress bar for enrolled courses */}
          {isEnrolled && progress !== undefined && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Progresso</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </CardContent>

        <CardFooter className="p-4 pt-0">
          {isEnrolled ? (
            <Button className="w-full" onClick={(e) => { e.stopPropagation(); onClick?.(); }}>
              <Play className="h-4 w-4 mr-2" />
              Continuar
            </Button>
          ) : isFree ? (
            <Button className="w-full" onClick={(e) => { e.stopPropagation(); onEnroll?.(); }}>
              Começar Agora
            </Button>
          ) : (
            <Button className="w-full" variant="secondary" onClick={(e) => { e.stopPropagation(); onEnroll?.(); }}>
              <Lock className="h-4 w-4 mr-2" />
              R$ {price.toFixed(2)}
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}

export default CourseCard;
