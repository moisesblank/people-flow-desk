// ============================================
// MOISÉS MEDEIROS v7.0 - Cursos
// 🚀 P0 FIX: OptimizedImage para hero banner
// Design: 2300 | Performance: 3500
// ============================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, BookOpen, GraduationCap, Trophy, Flame, Sparkles, FlaskConical, Atom, Beaker } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCourses, useEnrollments, useEnroll, useCourseProgress } from '@/hooks/useLMS';
import { useGamification } from '@/hooks/useGamification';
import CourseCard from '@/components/lms/CourseCard';
import XPProgressCard from '@/components/lms/XPProgressCard';
import Leaderboard from '@/components/lms/Leaderboard';
import { AnimatedAtom, BubblingFlask, MiniPeriodicTable, ChemistryTip, LabEquipmentIcons } from '@/components/chemistry/ChemistryVisuals';
import { OptimizedImage } from '@/components/ui/optimized-image';
import heroImage from '@/assets/dashboard-chemistry-hero.jpg';

export default function Cursos() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');

  const { data: allCourses, isLoading: isLoadingCourses } = useCourses({ published: true });
  const { data: enrollments, isLoading: isLoadingEnrollments } = useEnrollments();
  const { mutate: enroll, isPending: isEnrolling } = useEnroll();
  const { gamification } = useGamification();

  const enrolledCourseIds = enrollments?.map(e => e.course_id) || [];

  // Filter courses
  const filteredCourses = allCourses?.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          course.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || course.category === categoryFilter;
    const matchesDifficulty = difficultyFilter === 'all' || course.difficulty_level === difficultyFilter;
    return matchesSearch && matchesCategory && matchesDifficulty;
  }) || [];

  // Get unique categories
  const categories = [...new Set(allCourses?.map(c => c.category) || [])];

  const handleCourseClick = (courseId: string) => {
    navigate(`/cursos/${courseId}`);
  };

  const handleEnroll = (courseId: string) => {
    enroll(courseId);
  };

  return (
    <div className="container mx-auto py-6 px-4 space-y-8">
      {/* Hero Banner com Química */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full h-48 md:h-64 rounded-2xl overflow-hidden mb-8"
      >
        <OptimizedImage
          src={heroImage}
          alt="Curso de Química - Moisés Medeiros"
          aspectRatio="auto"
          objectFit="cover"
          placeholderColor="#0a1a2a"
          priority={true}
          containerClassName="absolute inset-0 w-full h-full"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-between p-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FlaskConical className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary uppercase tracking-wider">Curso de Química</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Moisés Medeiros</h2>
            <p className="text-muted-foreground max-w-md">
              Domine a química e conquiste sua aprovação em medicina
            </p>
            <div className="mt-4">
              <LabEquipmentIcons />
            </div>
          </div>
          <div className="hidden lg:block">
            <AnimatedAtom size={100} />
          </div>
        </div>
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-primary" />
            Cursos
          </h1>
          <p className="text-muted-foreground mt-1">
            Explore nossos cursos e comece a aprender
          </p>
        </div>

        {/* XP Summary */}
        {gamification && (
          <div className="flex items-center gap-4 p-4 bg-primary/10 rounded-lg border border-primary/20">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              <span className="font-bold text-primary">{gamification.total_xp} XP</span>
            </div>
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-stats-gold" />
              <span className="text-stats-gold">{gamification.current_streak} dias</span>
            </div>
          </div>
        )}
      </motion.div>

      {/* XP Progress Card */}
      <XPProgressCard variant="compact" />

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col md:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cursos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Dificuldade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas dificuldades</SelectItem>
            <SelectItem value="iniciante">Iniciante</SelectItem>
            <SelectItem value="intermediario">Intermediário</SelectItem>
            <SelectItem value="avancado">Avançado</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="all" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Todos
          </TabsTrigger>
          <TabsTrigger value="enrolled" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            Meus Cursos
          </TabsTrigger>
          <TabsTrigger value="ranking" className="gap-2">
            <Trophy className="h-4 w-4" />
            Ranking
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {isLoadingCourses ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-80 bg-muted/50 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">Nenhum curso encontrado</h3>
              <p className="text-muted-foreground">Tente ajustar os filtros de busca</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => {
                const isEnrolled = enrolledCourseIds.includes(course.id);
                const enrollment = enrollments?.find(e => e.course_id === course.id);
                
                return (
                  <CourseCard
                    key={course.id}
                    {...course}
                    isEnrolled={isEnrolled}
                    progress={enrollment?.progress_percentage}
                    onClick={() => handleCourseClick(course.id)}
                    onEnroll={() => handleEnroll(course.id)}
                  />
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="enrolled" className="mt-6">
          {isLoadingEnrollments ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-80 bg-muted/50 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : !enrollments || enrollments.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium">Você ainda não está matriculado em nenhum curso</h3>
            <p className="text-muted-foreground mb-4">Explore nossos cursos e comece a aprender</p>
              <Button onClick={() => (document.querySelector('[value="all"]') as HTMLButtonElement)?.click()}>
                Ver Cursos Disponíveis
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrollments.map((enrollment) => (
                <CourseCard
                  key={enrollment.id}
                  id={enrollment.course?.id || enrollment.course_id}
                  title={enrollment.course?.title || 'Curso'}
                  description={enrollment.course?.description}
                  thumbnail_url={enrollment.course?.thumbnail_url}
                  category={enrollment.course?.category}
                  difficulty_level={enrollment.course?.difficulty_level}
                  estimated_hours={enrollment.course?.estimated_hours}
                  total_xp={enrollment.course?.total_xp}
                  instructor={enrollment.course?.instructor}
                  isEnrolled={true}
                  progress={enrollment.progress_percentage}
                  onClick={() => handleCourseClick(enrollment.course_id)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="ranking" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Leaderboard limit={20} />
            </div>
            <div className="space-y-6">
              <XPProgressCard variant="full" />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
