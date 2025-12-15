import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Play, 
  Clock, 
  BookOpen, 
  CheckCircle2, 
  Lock, 
  Trophy,
  Users,
  Star,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCourse, useEnrollment, useEnroll, useCourseProgress } from '@/hooks/useLMS';
import { cn } from '@/lib/utils';

export default function CursoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: course, isLoading: isLoadingCourse } = useCourse(id);
  const { data: enrollment, isLoading: isLoadingEnrollment } = useEnrollment(id);
  const { data: progress } = useCourseProgress(id);
  const { mutate: enroll, isPending: isEnrolling } = useEnroll();

  const isEnrolled = !!enrollment;
  const isFree = course?.price === 0;

  const handleEnroll = () => {
    if (id) enroll(id);
  };

  const handleStartLesson = (lessonId: string) => {
    navigate(`/cursos/${id}/aula/${lessonId}`);
  };

  if (isLoadingCourse) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-64 bg-muted rounded-lg" />
          <div className="h-32 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto py-12 text-center">
        <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Curso não encontrado</h2>
        <p className="text-muted-foreground mb-4">O curso que você procura não existe ou foi removido.</p>
        <Button onClick={() => navigate('/cursos')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Cursos
        </Button>
      </div>
    );
  }

  const totalLessons = course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0;
  const totalDuration = course.modules?.reduce((acc, m) => 
    acc + (m.lessons?.reduce((lacc, l) => lacc + (l.duration_minutes || 0), 0) || 0), 0) || 0;

  return (
    <div className="container mx-auto py-6 px-4 space-y-8">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate('/cursos')}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar para Cursos
      </Button>

      {/* Course Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid lg:grid-cols-3 gap-8"
      >
        {/* Course Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Thumbnail */}
          <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
            {course.thumbnail_url ? (
              <img
                src={course.thumbnail_url}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                <BookOpen className="h-20 w-20 text-primary/50" />
              </div>
            )}
            
            {/* Badges */}
            <div className="absolute top-4 left-4 flex gap-2">
              <Badge variant="secondary">{course.difficulty_level}</Badge>
              <Badge variant="secondary">{course.category}</Badge>
            </div>
          </div>

          {/* Title and Description */}
          <div>
            <h1 className="text-3xl font-bold mb-3">{course.title}</h1>
            {course.description && (
              <p className="text-lg text-muted-foreground">{course.description}</p>
            )}
          </div>

          {/* Instructor */}
          {course.instructor && (
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <Avatar className="h-12 w-12">
                <AvatarImage src={course.instructor.avatar_url || undefined} />
                <AvatarFallback>{course.instructor.nome.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm text-muted-foreground">Instrutor</p>
                <p className="font-medium">{course.instructor.nome}</p>
              </div>
            </div>
          )}

          {/* Course Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Conteúdo do Curso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                {course.modules?.map((module, moduleIndex) => (
                  <AccordionItem key={module.id} value={module.id}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-medium">
                          {moduleIndex + 1}
                        </span>
                        <div className="text-left">
                          <p className="font-medium">{module.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {module.lessons?.length || 0} aulas
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pl-11">
                        {module.lessons?.map((lesson, lessonIndex) => {
                          const canAccess = isEnrolled || lesson.is_free;
                          
                          return (
                            <div
                              key={lesson.id}
                              className={cn(
                                'flex items-center gap-3 p-3 rounded-lg transition-colors',
                                canAccess 
                                  ? 'hover:bg-muted cursor-pointer' 
                                  : 'opacity-50'
                              )}
                              onClick={() => canAccess && handleStartLesson(lesson.id)}
                            >
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm">
                                {canAccess ? (
                                  <Play className="h-4 w-4" />
                                ) : (
                                  <Lock className="h-4 w-4" />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium">{lesson.title}</p>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                  {lesson.duration_minutes > 0 && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {lesson.duration_minutes} min
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1">
                                    <Zap className="h-3 w-3 text-amber-500" />
                                    +{lesson.xp_reward} XP
                                  </span>
                                  {lesson.is_free && (
                                    <Badge variant="outline" className="text-xs">
                                      Gratuito
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Enroll Card */}
          <Card className="sticky top-6">
            <CardContent className="p-6 space-y-6">
              {/* Price */}
              <div className="text-center">
                {isFree ? (
                  <Badge className="text-lg px-4 py-1 bg-emerald-500 text-white">
                    Gratuito
                  </Badge>
                ) : (
                  <p className="text-3xl font-bold">R$ {course.price?.toFixed(2)}</p>
                )}
              </div>

              {/* Progress (if enrolled) */}
              {isEnrolled && progress && (
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progresso</span>
                    <span className="font-medium">{progress.percentage}%</span>
                  </div>
                  <Progress value={progress.percentage} className="h-2" />
                  <p className="text-sm text-muted-foreground mt-2">
                    {progress.completed} de {progress.total} aulas concluídas
                  </p>
                </div>
              )}

              {/* Action Button */}
              {isEnrolled ? (
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => {
                    const firstLesson = course.modules?.[0]?.lessons?.[0];
                    if (firstLesson) handleStartLesson(firstLesson.id);
                  }}
                >
                  <Play className="h-5 w-5 mr-2" />
                  Continuar Curso
                </Button>
              ) : (
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleEnroll}
                  disabled={isEnrolling}
                >
                  {isEnrolling ? 'Matriculando...' : isFree ? 'Começar Agora' : 'Comprar Curso'}
                </Button>
              )}

              {/* Course Stats */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="text-center">
                  <BookOpen className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-lg font-bold">{totalLessons}</p>
                  <p className="text-xs text-muted-foreground">Aulas</p>
                </div>
                <div className="text-center">
                  <Clock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-lg font-bold">{course.estimated_hours || Math.round(totalDuration / 60)}h</p>
                  <p className="text-xs text-muted-foreground">Duração</p>
                </div>
                <div className="text-center">
                  <Trophy className="h-5 w-5 mx-auto mb-1 text-amber-500" />
                  <p className="text-lg font-bold">{course.total_xp}</p>
                  <p className="text-xs text-muted-foreground">XP Total</p>
                </div>
                <div className="text-center">
                  <Star className="h-5 w-5 mx-auto mb-1 text-amber-500" />
                  <p className="text-lg font-bold">{course.modules?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">Módulos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
