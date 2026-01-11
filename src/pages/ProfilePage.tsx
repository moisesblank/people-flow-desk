// ============================================
// 🏆 PERFIL DO ALUNO — NETFLIX ULTRA PREMIUM 2300
// Layout cinematográfico com Hero Banner e Trilhos
// ============================================

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useGamification, useUserAchievements, getLevelInfo } from '@/hooks/useGamification';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { StudentDispatchSection } from '@/components/aluno/StudentDispatchSection';
import { StudentAddressSection } from '@/components/aluno/StudentAddressSection';
import { ProfileAgendaWidget } from '@/components/aluno/ProfileAgendaWidget';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  User, 
  Calendar, 
  Award, 
  Target, 
  Flame, 
  Trophy, 
  Zap, 
  Star,
  Crown,
  Medal,
  Shield,
  Sparkles,
  TrendingUp,
  BookOpen,
  CheckCircle2,
  Clock,
  Camera,
  Loader2,
  Package,
  MapPin,
  CalendarDays,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import '@/styles/profile-2300.css';

// Ícones de conquistas mapeados
const ACHIEVEMENT_ICONS: Record<string, React.ElementType> = {
  trophy: Trophy,
  star: Star,
  medal: Medal,
  crown: Crown,
  flame: Flame,
  zap: Zap,
  shield: Shield,
  target: Target,
  award: Award,
  sparkles: Sparkles,
};

// Cores por raridade
const RARITY_CONFIG = {
  common: { 
    label: 'Comum', 
    className: 'profile-achievement-common',
    color: 'hsl(var(--muted-foreground))'
  },
  rare: { 
    label: 'Raro', 
    className: 'profile-achievement-rare',
    color: 'hsl(200 90% 50%)'
  },
  epic: { 
    label: 'Épico', 
    className: 'profile-achievement-epic',
    color: 'hsl(280 80% 60%)'
  },
  legendary: { 
    label: 'Lendário', 
    className: 'profile-achievement-legendary',
    color: 'hsl(45 100% 50%)'
  },
};

const ProfilePage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { gamification, levelInfo, userRank, isLoading: isLoadingGamification } = useGamification();
  const { data: achievements, isLoading: isLoadingAchievements } = useUserAchievements();

  // ============================================
  // UPLOAD DE FOTO DE PERFIL
  // ============================================
  const handleAvatarUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    if (file.type !== 'image/png') {
      toast.error('Formato inválido', { description: 'Apenas arquivos PNG são permitidos.' });
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Arquivo muito grande', { description: 'O tamanho máximo é 5MB.' });
      return;
    }

    setIsUploadingAvatar(true);

    try {
      const fileName = `${user.id}/avatar-${Date.now()}.png`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ['user-profile-stats'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });

      toast.success('Foto atualizada!', { description: 'Sua foto de perfil foi alterada com sucesso.' });
    } catch (error: any) {
      console.error('[ProfilePage] Erro no upload:', error);
      toast.error('Erro ao enviar foto', { description: error.message || 'Tente novamente.' });
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [user?.id, queryClient]);

  // ============================================
  // QUERY CONSOLIDADA
  // ============================================
  const { data: profileData, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['user-profile-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return { profile: null, roleData: null, studyStats: { lessonsCompleted: 0, coursesCompleted: 0, flashcardsCreated: 0 } };
      
      const [profileResult, roleResult, lessonsResult, flashcardsResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('user_roles').select('role, expires_at').eq('user_id', user.id).maybeSingle(),
        supabase.from('lesson_progress').select('id', { count: 'exact' }).eq('user_id', user.id).eq('completed', true),
        supabase.from('study_flashcards').select('id', { count: 'exact' }).eq('user_id', user.id),
      ]);

      return {
        profile: profileResult.data,
        roleData: roleResult.data,
        studyStats: {
          lessonsCompleted: lessonsResult.count || 0,
          coursesCompleted: gamification?.courses_completed || 0,
          flashcardsCreated: flashcardsResult.count || 0,
        }
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const profile = profileData?.profile;
  const roleData = profileData?.roleData;
  const studyStats = profileData?.studyStats;
  const isLoading = isLoadingProfile || isLoadingGamification;

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-6xl">
        <Skeleton className="h-80 w-full rounded-2xl" />
        <div className="profile-stats-grid-2300">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const memberSince = new Date(profile.created_at).toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
  });

  const daysUntilExpiration = (roleData?.role === 'beta_expira' && roleData?.expires_at)
    ? Math.ceil((new Date(roleData.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const currentXP = gamification?.total_xp || profile.xp_total || 0;
  const currentLevel = levelInfo.level;
  const currentStreak = gamification?.current_streak || profile.streak_days || 0;
  const progressPercent = levelInfo.progressPercentage;

  const stats = [
    { icon: Zap, label: 'XP Total', value: currentXP.toLocaleString(), gradient: 'from-amber-500 to-orange-500' },
    { icon: Star, label: 'Nível', value: currentLevel, gradient: 'from-primary to-secondary' },
    { icon: Award, label: 'Conquistas', value: achievements?.length || 0, gradient: 'from-purple-500 to-pink-500' },
    { icon: Flame, label: 'Sequência', value: `${currentStreak}d`, gradient: 'from-red-500 to-orange-500' },
  ];

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-8 max-w-6xl">
      
      {/* ============================================
          HERO BANNER — NETFLIX 2300
          ============================================ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="profile-hero-2300"
      >
        <div className="profile-hero-scanlines" />
        
        <div className="relative z-10 p-6 md:p-8 lg:p-10">
          <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start">
            
            {/* Avatar com Ring Animado */}
            <div className="relative flex-shrink-0">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png"
                onChange={handleAvatarUpload}
                className="hidden"
                aria-label="Upload de foto de perfil"
              />

              <motion.div
                className="profile-avatar-ring-2300 cursor-pointer group"
                whileHover={{ scale: 1.02 }}
                onClick={() => !isUploadingAvatar && fileInputRef.current?.click()}
              >
                <Avatar className="w-full h-full relative z-10 border-4 border-background">
                  <AvatarImage src={profile.avatar_url || ''} alt={profile.nome} />
                  <AvatarFallback className="text-3xl bg-muted">
                    {profile.nome?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                {/* Overlay de upload */}
                <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
                  {isUploadingAvatar ? (
                    <Loader2 className="w-10 h-10 text-white animate-spin" />
                  ) : (
                    <div className="flex flex-col items-center text-white">
                      <Camera className="w-7 h-7 mb-1" />
                      <span className="text-xs font-medium">Alterar</span>
                    </div>
                  )}
                </div>
                
                {/* Level Badge */}
                <motion.div
                  className="profile-level-badge-2300"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring' }}
                >
                  {currentLevel}
                </motion.div>

                {/* Streak Flame */}
                {currentStreak > 0 && (
                  <motion.div
                    className="profile-streak-badge-2300"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.4, type: 'spring' }}
                  >
                    <Flame className="w-5 h-5 text-white" />
                  </motion.div>
                )}
              </motion.div>
            </div>

            {/* User Info */}
            <div className="flex-1 text-center lg:text-left min-w-0">
              <motion.h1 
                className="text-3xl md:text-4xl font-bold profile-holo-text-2300 mb-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {profile.nome}
              </motion.h1>
              
              <p className="text-muted-foreground text-lg mb-4">{profile.email}</p>

              {/* Badges */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-2 mb-6">
                <Badge variant="secondary" className="gap-1.5 px-3 py-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Desde {memberSince}
                </Badge>
                
                {userRank && (
                  <Badge className="gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 border-0">
                    <Trophy className="w-3.5 h-3.5" />
                    #{userRank} Ranking
                  </Badge>
                )}
                
                {daysUntilExpiration !== null && (
                  <Badge 
                    variant={daysUntilExpiration > 30 ? 'default' : daysUntilExpiration > 7 ? 'secondary' : 'destructive'}
                    className="gap-1.5 px-3 py-1"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    {daysUntilExpiration > 0 ? `${daysUntilExpiration} dias` : 'Expirado'}
                  </Badge>
                )}
              </div>

              {/* XP Progress Bar 2300 */}
              <div className="max-w-lg mx-auto lg:mx-0">
                <div className="flex justify-between items-center text-sm mb-2">
                  <span className="font-semibold text-foreground">{levelInfo.title}</span>
                  <span className="text-muted-foreground">
                    {currentXP.toLocaleString()} / {levelInfo.nextLevelXP.toLocaleString()} XP
                  </span>
                </div>
                <div className="profile-xp-bar-2300">
                  <motion.div
                    className="profile-xp-bar-fill-2300"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {Math.round(levelInfo.xpNeededForNextLevel - levelInfo.xpInCurrentLevel)} XP para o próximo nível
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ============================================
          STATS ORBS GRID — NETFLIX 2300
          ============================================ */}
      <div className="profile-stats-grid-2300 profile-fade-in-delay-1">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            className="profile-stat-orb-2300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.05 }}
          >
            <div className={cn(
              "profile-stat-orb-glow absolute inset-0 rounded-xl",
              `bg-gradient-to-br ${stat.gradient} opacity-10`
            )} />
            
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center mb-3",
                `bg-gradient-to-br ${stat.gradient}`
              )}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ============================================
          TRILHO: ENVIOS & ENDEREÇO — NETFLIX 2300
          ============================================ */}
      <div className="profile-rail-2300 profile-fade-in-delay-2">
        <div className="profile-rail-header-2300">
          <div className="profile-rail-title-2300">
            <div className="profile-rail-icon-2300">
              <Package className="w-5 h-5 text-white" />
            </div>
            Envios & Endereço
          </div>
        </div>
        
        <div className="profile-two-col-grid-2300">
          <StudentDispatchSection />
          <StudentAddressSection />
        </div>
      </div>

      {/* ============================================
          TRILHO: PROGRESSO DE ESTUDOS — NETFLIX 2300
          ============================================ */}
      <div className="profile-rail-2300 profile-fade-in-delay-3">
        <div className="profile-rail-header-2300">
          <div className="profile-rail-title-2300">
            <div className="profile-rail-icon-2300">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            Progresso de Estudos
          </div>
        </div>
        
        <div className="profile-two-col-grid-2300">
          {/* Study Progress Card */}
          <div className="profile-study-card-2300">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Métricas
            </h3>
            <div className="space-y-4">
              {[
                { label: 'Aulas Concluídas', value: studyStats?.lessonsCompleted || 0, icon: CheckCircle2, color: 'text-green-400' },
                { label: 'Cursos Completados', value: studyStats?.coursesCompleted || 0, icon: Target, color: 'text-blue-400' },
                { label: 'Flashcards Criados', value: studyStats?.flashcardsCreated || 0, icon: Sparkles, color: 'text-purple-400' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <item.icon className={cn("w-5 h-5", item.color)} />
                    <span className="text-sm text-foreground">{item.label}</span>
                  </div>
                  <span className="text-lg font-bold text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Level Progress Card */}
          <div className="profile-study-card-2300">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              Progressão de Nível
            </h3>
            
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 mb-4">
              <motion.div 
                className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-3 shadow-lg"
                animate={{ 
                  boxShadow: ['0 0 20px hsl(var(--primary) / 0.3)', '0 0 40px hsl(var(--primary) / 0.4)', '0 0 20px hsl(var(--primary) / 0.3)']
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span className="text-4xl font-bold text-primary-foreground">{currentLevel}</span>
              </motion.div>
              <h4 className="text-xl font-bold text-foreground">{levelInfo.title}</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {levelInfo.isMaxLevel ? 'Nível Máximo Alcançado! 🏆' : `Próximo: Nível ${currentLevel + 1}`}
              </p>
            </div>

            {!levelInfo.isMaxLevel && (
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-semibold text-foreground">{Math.round(progressPercent)}%</span>
                </div>
                <Progress value={progressPercent} className="h-3" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================
          TRILHO: CONQUISTAS — NETFLIX 2300
          ============================================ */}
      <div className="profile-rail-2300">
        <div className="profile-rail-header-2300">
          <div className="profile-rail-title-2300">
            <div className="profile-rail-icon-2300 bg-gradient-to-br from-amber-500 to-orange-500">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            Salão de Troféus
          </div>
          
          {achievements && achievements.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              {achievements.length} Conquistas
            </Badge>
          )}
        </div>
        
        {isLoadingAchievements ? (
          <div className="profile-achievements-grid-2300">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : achievements && achievements.length > 0 ? (
          <div className="profile-achievements-grid-2300">
            <AnimatePresence>
              {achievements.map((item, index) => {
                const rarity = (item.achievement?.rarity as keyof typeof RARITY_CONFIG) || 'common';
                const config = RARITY_CONFIG[rarity] || RARITY_CONFIG.common;
                const IconComponent = ACHIEVEMENT_ICONS[item.achievement?.icon || 'trophy'] || Trophy;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className={cn("profile-achievement-card-2300", config.className)}
                  >
                    <div className="flex items-start gap-3">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${config.color}20` }}
                      >
                        <IconComponent className="w-6 h-6" style={{ color: config.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground truncate text-sm">
                          {item.achievement?.name}
                        </h4>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {item.achievement?.description}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <Badge 
                            variant="outline" 
                            className="text-xs px-2 py-0"
                            style={{ borderColor: config.color, color: config.color }}
                          >
                            {config.label}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(item.earned_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-16 px-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Trophy className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhuma conquista ainda
            </h3>
            <p className="text-muted-foreground max-w-sm mx-auto">
              Continue estudando para desbloquear conquistas incríveis!
            </p>
          </div>
        )}
      </div>

      {/* ============================================
          TRILHO: AGENDA (COMING SOON) — NETFLIX 2300
          ============================================ */}
      <ProfileAgendaWidget />
      
    </div>
  );
};

export default ProfilePage;
