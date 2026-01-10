// ============================================
// 🏆 PANTEÃO DOS HERÓIS - PERFIL GAMIFICADO
// Página de perfil com gamificação completa
// ============================================

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuantumReactivity } from '@/hooks/useQuantumReactivity';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useGamification, useUserAchievements, getLevelInfo } from '@/hooks/useGamification';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { StudentDispatchSection } from '@/components/aluno/StudentDispatchSection';
import { ProfileAgendaWidget } from '@/components/aluno/ProfileAgendaWidget';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
const RARITY_STYLES = {
  common: {
    bg: 'from-rarity-common/20 to-muted/20',
    border: 'border-rarity-common/30',
    text: 'text-rarity-common',
    glow: '',
    label: 'Comum',
  },
  rare: {
    bg: 'from-rarity-rare/20 to-holo-cyan/20',
    border: 'border-rarity-rare/30',
    text: 'text-rarity-rare',
    glow: 'shadow-rarity-rare/20',
    label: 'Raro',
  },
  epic: {
    bg: 'from-rarity-epic/20 to-holo-pink/20',
    border: 'border-rarity-epic/30',
    text: 'text-rarity-epic',
    glow: 'shadow-rarity-epic/30',
    label: 'Épico',
  },
  legendary: {
    bg: 'from-rarity-legendary/20 to-role-marketing/20',
    border: 'border-rarity-legendary/30',
    text: 'text-rarity-legendary',
    glow: 'shadow-rarity-legendary/40',
    label: 'Lendário',
  },
};

const ProfilePage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============================================
  // UPLOAD DE FOTO DE PERFIL
  // ============================================
  const handleAvatarUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    // Validação: apenas PNG e máximo 5MB
    if (file.type !== 'image/png') {
      toast.error('Formato inválido', { description: 'Apenas arquivos PNG são permitidos.' });
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('Arquivo muito grande', { description: 'O tamanho máximo é 5MB.' });
      return;
    }

    setIsUploadingAvatar(true);

    try {
      // Nome único para o arquivo
      const fileName = `${user.id}/avatar-${Date.now()}.png`;

      // Upload para o bucket avatars
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Atualizar profile no banco
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Invalidar cache para atualizar em todo o app
      queryClient.invalidateQueries({ queryKey: ['user-profile-stats'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });

      toast.success('Foto atualizada!', { description: 'Sua foto de perfil foi alterada com sucesso.' });
    } catch (error: any) {
      console.error('[ProfilePage] Erro no upload:', error);
      toast.error('Erro ao enviar foto', { description: error.message || 'Tente novamente.' });
    } finally {
      setIsUploadingAvatar(false);
      // Limpar input para permitir re-upload do mesmo arquivo
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [user?.id, queryClient]);
  
  const { gamification, levelInfo, userRank, isLoading: isLoadingGamification } = useGamification();
  const { data: achievements, isLoading: isLoadingAchievements } = useUserAchievements();

  // ✅ P0 FIX: Consolidar queries em 1 com batching (1 round-trip)
  // ✅ CONSTITUIÇÃO v10.x: expires_at vem de user_roles (fonte única)
  const { data: profileData, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['user-profile-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return { profile: null, roleData: null, studyStats: { lessonsCompleted: 0, coursesCompleted: 0, flashcardsCreated: 0 } };
      
      // ✅ BATCHING: Todas as queries em paralelo, 1 round-trip
      const [profileResult, roleResult, lessonsResult, flashcardsResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        // ✅ FONTE DA VERDADE: user_roles.expires_at
        supabase.from('user_roles').select('role, expires_at').eq('user_id', user.id).maybeSingle(),
        supabase.from('lesson_progress').select('id', { count: 'exact' }).eq('user_id', user.id).eq('completed', true),
        supabase.from('study_flashcards').select('id', { count: 'exact' }).eq('user_id', user.id),
      ]);

      return {
        profile: profileResult.data,
        roleData: roleResult.data, // { role, expires_at }
        studyStats: {
          lessonsCompleted: lessonsResult.count || 0,
          coursesCompleted: gamification?.courses_completed || 0,
          flashcardsCreated: flashcardsResult.count || 0,
        }
      };
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 min - LEI I anti-tempestade
  });

  // ✅ Extrair dados do resultado consolidado
  const profile = profileData?.profile;
  const roleData = profileData?.roleData; // { role, expires_at }
  const studyStats = profileData?.studyStats;

  const isLoading = isLoadingProfile || isLoadingGamification;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-64 w-full rounded-2xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
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

  // ✅ CONSTITUIÇÃO v10.x: expires_at vem de user_roles (fonte única)
  // Só mostra expiração para role beta_expira
  const daysUntilExpiration = (roleData?.role === 'beta_expira' && roleData?.expires_at)
    ? Math.ceil((new Date(roleData.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const currentXP = gamification?.total_xp || profile.xp_total || 0;
  const currentLevel = levelInfo.level;
  const currentStreak = gamification?.current_streak || profile.streak_days || 0;
  const progressPercent = levelInfo.progressPercentage;

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-5xl">
      {/* Seção de Envios - Aparece primeiro se houver envios pendentes */}
      <StudentDispatchSection />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-background to-secondary/10 border border-border/50"
      >
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-secondary/5 rounded-full blur-3xl" />
        </div>

        <div className="relative p-6 md:p-8">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            {/* Avatar with Level Ring + Upload Button */}
            <div className="relative">
              {/* Input oculto para upload */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png"
                onChange={handleAvatarUpload}
                className="hidden"
                aria-label="Upload de foto de perfil"
              />

              <motion.div
                className="relative cursor-pointer group"
                whileHover={{ scale: 1.05 }}
                onClick={() => !isUploadingAvatar && fileInputRef.current?.click()}
              >
                <div className="w-28 h-28 md:w-32 md:h-32 rounded-full p-1 bg-gradient-to-br from-primary via-secondary to-primary">
                  <Avatar className="w-full h-full border-4 border-background">
                    <AvatarImage src={profile.avatar_url || ''} alt={profile.nome} />
                    <AvatarFallback className="text-2xl bg-muted">
                      {profile.nome?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                {/* Overlay de upload */}
                <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {isUploadingAvatar ? (
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  ) : (
                    <div className="flex flex-col items-center text-white">
                      <Camera className="w-6 h-6 mb-1" />
                      <span className="text-xs font-medium">Alterar</span>
                    </div>
                  )}
                </div>
                
                {/* Level Badge */}
                <motion.div
                  className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center border-4 border-background shadow-lg"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring' }}
                >
                  <span className="text-lg font-bold text-primary-foreground">{currentLevel}</span>
                </motion.div>

                {/* Streak Flame */}
                {currentStreak > 0 && (
                  <motion.div
                    className="absolute -top-1 -left-1 w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center border-3 border-background shadow-lg"
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
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">
                {profile.nome}
              </h1>
              <p className="text-muted-foreground mb-3">{profile.email}</p>

              <div className="flex flex-wrap justify-center md:justify-start gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>Desde {memberSince}</span>
                </div>
                {userRank && (
                  <Badge variant="secondary" className="gap-1">
                    <Trophy className="w-3 h-3" />
                    #{userRank} no Ranking
                  </Badge>
                )}
                {daysUntilExpiration !== null && (
                  <Badge 
                    variant={daysUntilExpiration > 30 ? 'default' : daysUntilExpiration > 7 ? 'secondary' : 'destructive'}
                    className="gap-1"
                  >
                    <Clock className="w-3 h-3" />
                    {daysUntilExpiration > 0 ? `${daysUntilExpiration} dias` : 'Expirado'}
                  </Badge>
                )}
              </div>

              {/* XP Progress Bar */}
              <div className="mt-4 max-w-md">
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-foreground">{levelInfo.title}</span>
                  <span className="text-muted-foreground">
                    {currentXP.toLocaleString()} / {levelInfo.nextLevelXP.toLocaleString()} XP
                  </span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round(levelInfo.xpNeededForNextLevel - levelInfo.xpInCurrentLevel)} XP para o próximo nível
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { icon: Zap, label: 'XP Total', value: currentXP.toLocaleString(), color: 'from-amber-500 to-orange-500' },
          { icon: Star, label: 'Nível', value: currentLevel, color: 'from-primary to-secondary' },
          { icon: Award, label: 'Conquistas', value: achievements?.length || 0, color: 'from-purple-500 to-pink-500' },
          { icon: Flame, label: 'Sequência', value: `${currentStreak} dias`, color: 'from-red-500 to-orange-500' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 + index * 0.05 }}
          >
            <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border-border/50">
              <div className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity",
                `bg-gradient-to-br ${stat.color}`
              )} style={{ opacity: 0.05 }} />
              <CardContent className="p-4 text-center">
                <div className={cn(
                  "w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center",
                  `bg-gradient-to-br ${stat.color}`
                )}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full max-w-md mx-auto grid grid-cols-2 mb-6">
          <TabsTrigger value="overview" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            Estatísticas
          </TabsTrigger>
          <TabsTrigger value="achievements" className="gap-2">
            <Trophy className="w-4 h-4" />
            Conquistas
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-6 md:grid-cols-2"
          >
            {/* Study Progress */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Progresso de Estudos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'Aulas Concluídas', value: studyStats?.lessonsCompleted || 0, icon: CheckCircle2 },
                  { label: 'Cursos Completados', value: studyStats?.coursesCompleted || 0, icon: Target },
                  { label: 'Flashcards Criados', value: studyStats?.flashcardsCreated || 0, icon: Sparkles },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5 text-muted-foreground" />
                      <span className="text-sm text-foreground">{item.label}</span>
                    </div>
                    <span className="font-semibold text-foreground">{item.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Level Progress */}
            <Card className="border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Star className="w-5 h-5 text-amber-500" />
                  Progressão de Nível
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-4 rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10">
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-3">
                    <span className="text-3xl font-bold text-primary-foreground">{currentLevel}</span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground">{levelInfo.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {levelInfo.isMaxLevel ? 'Nível Máximo!' : `Próximo: Nível ${currentLevel + 1}`}
                  </p>
                </div>

                {!levelInfo.isMaxLevel && (
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-medium text-foreground">{Math.round(progressPercent)}%</span>
                    </div>
                    <Progress value={progressPercent} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  Salão de Troféus
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingAchievements ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                      <Skeleton key={i} className="h-32 rounded-xl" />
                    ))}
                  </div>
                ) : achievements && achievements.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence>
                      {achievements.map((item, index) => {
                        const rarity = (item.achievement?.rarity as keyof typeof RARITY_STYLES) || 'common';
                        const styles = RARITY_STYLES[rarity] || RARITY_STYLES.common;
                        const IconComponent = ACHIEVEMENT_ICONS[item.achievement?.icon || 'trophy'] || Trophy;

                        return (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className={cn(
                              "relative p-4 rounded-xl border-2 transition-all hover:scale-105",
                              `bg-gradient-to-br ${styles.bg}`,
                              styles.border,
                              styles.glow && `shadow-lg ${styles.glow}`
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center",
                                `bg-gradient-to-br ${styles.bg}`
                              )}>
                                <IconComponent className={cn("w-6 h-6", styles.text)} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-foreground truncate">
                                  {item.achievement?.name}
                                </h4>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {item.achievement?.description}
                                </p>
                                <div className="flex items-center justify-between mt-2">
                                  <Badge variant="outline" className={cn("text-xs", styles.text)}>
                                    {styles.label}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(item.earned_at).toLocaleDateString('pt-BR')}
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
                  <div className="text-center py-12">
                    <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center mb-4">
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
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Widget de Agenda integrado */}
      <ProfileAgendaWidget />
    </div>
  );
};

export default ProfilePage;
