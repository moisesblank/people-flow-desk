// ============================================
// 🏆 PERFIL DO ALUNO — PERFORMANCE OPTIMIZED v2300
// Lazy loading + Virtualização + Performance Tiering
// ============================================

import { useState, Suspense, lazy, memo, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useGamification, useUserAchievements, getLevelInfo } from '@/hooks/useGamification';
import { useConstitutionPerformance } from '@/hooks/useConstitutionPerformance';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import '@/styles/profile-2300.css';

// ============================================
// LAZY IMPORTS — Carregamento sob demanda
// ============================================
const ProfileHeroSection = lazy(() => 
  import('@/components/aluno/profile/ProfileHeroSection').then(m => ({ default: m.ProfileHeroSection }))
);

const ProfileStatsOrbs = lazy(() => 
  import('@/components/aluno/profile/ProfileStatsOrbs').then(m => ({ default: m.ProfileStatsOrbs }))
);

const ProfileDispatchRail = lazy(() => 
  import('@/components/aluno/profile/ProfileDispatchRail').then(m => ({ default: m.ProfileDispatchRail }))
);

const ProfileStudyProgressRail = lazy(() => 
  import('@/components/aluno/profile/ProfileStudyProgressRail').then(m => ({ default: m.ProfileStudyProgressRail }))
);

const ProfileAchievementsRail = lazy(() => 
  import('@/components/aluno/profile/ProfileAchievementsRail').then(m => ({ default: m.ProfileAchievementsRail }))
);

const ProfileAgendaWidget = lazy(() => 
  import('@/components/aluno/ProfileAgendaWidget').then(m => ({ default: m.ProfileAgendaWidget }))
);

// ============================================
// SKELETON LOADERS
// ============================================
const HeroSkeleton = memo(() => (
  <div className="profile-hero-2300">
    <div className="p-6 md:p-8 lg:p-10">
      <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start">
        <Skeleton className="w-[140px] h-[140px] rounded-full" />
        <div className="flex-1 space-y-4 text-center lg:text-left">
          <Skeleton className="h-10 w-64 mx-auto lg:mx-0" />
          <Skeleton className="h-6 w-48 mx-auto lg:mx-0" />
          <div className="flex gap-2 justify-center lg:justify-start">
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-7 w-24" />
          </div>
          <Skeleton className="h-3 w-full max-w-lg mx-auto lg:mx-0" />
        </div>
      </div>
    </div>
  </div>
));

const StatsSkeleton = memo(() => (
  <div className="profile-stats-grid-2300">
    {[...Array(4)].map((_, i) => (
      <Skeleton key={i} className="h-32 rounded-xl" />
    ))}
  </div>
));

const RailSkeleton = memo(() => (
  <div className="profile-rail-2300">
    <Skeleton className="h-10 w-48 mb-4" />
    <div className="profile-two-col-grid-2300">
      <Skeleton className="h-48 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
  </div>
));

// ============================================
// MAIN COMPONENT
// ============================================
const ProfilePage = () => {
  const { user } = useAuth();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const { shouldAnimate } = useConstitutionPerformance();
  
  const { gamification, levelInfo, userRank, isLoading: isLoadingGamification } = useGamification();
  const { data: achievements, isLoading: isLoadingAchievements } = useUserAchievements();

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

  // ============================================
  // COMPUTED VALUES
  // ============================================
  const profile = profileData?.profile;
  const roleData = profileData?.roleData;
  const studyStats = profileData?.studyStats;
  const isLoading = isLoadingProfile || isLoadingGamification;

  const computedValues = useMemo(() => {
    if (!profile) return null;

    const daysUntilExpiration = (roleData?.role === 'beta_expira' && roleData?.expires_at)
      ? Math.ceil((new Date(roleData.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;

    const currentXP = gamification?.total_xp || profile.xp_total || 0;
    const currentLevel = levelInfo.level;
    const currentStreak = gamification?.current_streak || profile.streak_days || 0;

    return {
      daysUntilExpiration,
      currentXP,
      currentLevel,
      currentStreak,
    };
  }, [profile, roleData, gamification, levelInfo]);

  // ============================================
  // LOADING STATE
  // ============================================
  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6 space-y-6 max-w-6xl">
        <HeroSkeleton />
        <StatsSkeleton />
        <RailSkeleton />
      </div>
    );
  }

  if (!profile || !computedValues) return null;

  const { daysUntilExpiration, currentXP, currentLevel, currentStreak } = computedValues;

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="container mx-auto p-4 md:p-6 space-y-8 max-w-6xl">
      
      {/* HERO SECTION */}
      <Suspense fallback={<HeroSkeleton />}>
        <ProfileHeroSection
          profile={{
            id: profile.id,
            nome: profile.nome,
            email: profile.email,
            avatar_url: profile.avatar_url,
            created_at: profile.created_at,
          }}
          currentLevel={currentLevel}
          currentStreak={currentStreak}
          currentXP={currentXP}
          levelInfo={{
            title: levelInfo.title,
            nextLevelXP: levelInfo.nextLevelXP,
            progressPercentage: levelInfo.progressPercentage,
            xpNeededForNextLevel: levelInfo.xpNeededForNextLevel,
            xpInCurrentLevel: levelInfo.xpInCurrentLevel,
          }}
          userRank={userRank}
          daysUntilExpiration={daysUntilExpiration}
          isUploadingAvatar={isUploadingAvatar}
          onAvatarUploadStart={() => setIsUploadingAvatar(true)}
          onAvatarUploadEnd={() => setIsUploadingAvatar(false)}
        />
      </Suspense>

      {/* STATS ORBS */}
      <Suspense fallback={<StatsSkeleton />}>
        <ProfileStatsOrbs
          currentXP={currentXP}
          currentLevel={currentLevel}
          achievementsCount={achievements?.length || 0}
          currentStreak={currentStreak}
        />
      </Suspense>

      {/* ENVIOS & ENDEREÇO */}
      <Suspense fallback={<RailSkeleton />}>
        <ProfileDispatchRail />
      </Suspense>

      {/* PROGRESSO DE ESTUDOS */}
      <Suspense fallback={<RailSkeleton />}>
        <ProfileStudyProgressRail
          studyStats={studyStats || { lessonsCompleted: 0, coursesCompleted: 0, flashcardsCreated: 0 }}
          currentLevel={currentLevel}
          levelInfo={{
            title: levelInfo.title,
            progressPercentage: levelInfo.progressPercentage,
            isMaxLevel: levelInfo.isMaxLevel,
          }}
        />
      </Suspense>

      {/* SALÃO DE TROFÉUS */}
      <Suspense fallback={<RailSkeleton />}>
        <ProfileAchievementsRail
          achievements={achievements}
          isLoading={isLoadingAchievements}
        />
      </Suspense>

      {/* AGENDA */}
      <Suspense fallback={<RailSkeleton />}>
        <ProfileAgendaWidget />
      </Suspense>
      
    </div>
  );
};

export default ProfilePage;
