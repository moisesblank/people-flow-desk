// ============================================
// 🎬 PROFILE HERO — LAZY PERFORMANT v2300
// Componente focado para o Hero Banner
// ============================================

import { memo, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useConstitutionPerformance } from '@/hooks/useConstitutionPerformance';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  User, Calendar, Trophy, Flame, Clock, Camera, Loader2, Star 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProfileHeroProps {
  profile: {
    id: string;
    nome: string;
    email: string;
    avatar_url?: string | null;
    created_at: string;
  };
  currentLevel: number;
  currentStreak: number;
  currentXP: number;
  levelInfo: {
    title: string;
    nextLevelXP: number;
    progressPercentage: number;
    xpNeededForNextLevel: number;
    xpInCurrentLevel: number;
  };
  userRank?: number | null;
  daysUntilExpiration?: number | null;
  isUploadingAvatar: boolean;
  onAvatarUploadStart: () => void;
  onAvatarUploadEnd: () => void;
}

export const ProfileHeroSection = memo(function ProfileHeroSection({
  profile,
  currentLevel,
  currentStreak,
  currentXP,
  levelInfo,
  userRank,
  daysUntilExpiration,
  isUploadingAvatar,
  onAvatarUploadStart,
  onAvatarUploadEnd,
}: ProfileHeroProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { shouldAnimate, motionProps, isLowEnd } = useConstitutionPerformance();

  const handleAvatarUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile.id) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Formato inválido', { description: 'Use PNG, JPG, WEBP ou GIF.' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande', { description: 'O tamanho máximo é 5MB.' });
      return;
    }

    onAvatarUploadStart();

    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const fileName = `${profile.id}/avatar-${Date.now()}.${ext}`;
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
        .eq('id', profile.id);

      if (updateError) throw updateError;

      queryClient.invalidateQueries({ queryKey: ['user-profile-stats'] });
      toast.success('Foto atualizada!');
    } catch (error: any) {
      console.error('[ProfileHero] Erro no upload:', error);
      toast.error('Erro ao enviar foto', { description: error.message });
    } finally {
      onAvatarUploadEnd();
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [profile.id, queryClient, onAvatarUploadStart, onAvatarUploadEnd]);

  const memberSince = new Date(profile.created_at).toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
  });

  const progressPercent = levelInfo.progressPercentage;

  return (
    <motion.div
      {...(shouldAnimate ? motionProps : {})}
      className="profile-hero-2300"
    >
      {/* Scanlines - só em high-end */}
      {!isLowEnd && <div className="profile-hero-scanlines" />}

      <div className="relative z-10 p-6 md:p-8 lg:p-10">
        <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start">
          
          {/* Avatar com Ring */}
          <div className="relative flex-shrink-0">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
              onChange={handleAvatarUpload}
              className="hidden"
              aria-label="Upload de foto de perfil"
            />

            <div
              className={cn(
                "profile-avatar-ring-2300 cursor-pointer group",
                isLowEnd && "profile-avatar-ring-static"
              )}
              onClick={() => !isUploadingAvatar && fileInputRef.current?.click()}
            >
              <Avatar className="w-full h-full relative z-10 border-4 border-background">
                <AvatarImage 
                  src={profile.avatar_url || ''} 
                  alt={profile.nome}
                  loading="lazy"
                  className="object-contain"
                />
                <AvatarFallback className="text-3xl bg-muted">
                  {profile.nome?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>

              {/* Upload Overlay */}
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
              <div className="profile-level-badge-2300">
                {currentLevel}
              </div>

              {/* Streak Flame */}
              {currentStreak > 0 && (
                <div className="profile-streak-badge-2300">
                  <Flame className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          </div>

          {/* User Info */}
          <div className="flex-1 text-center lg:text-left min-w-0">
            <h1 className="text-3xl md:text-4xl font-bold profile-holo-text-2300 mb-2">
              {profile.nome}
            </h1>

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

              {daysUntilExpiration !== null && daysUntilExpiration !== undefined && (
                <Badge
                  variant={daysUntilExpiration > 30 ? 'default' : daysUntilExpiration > 7 ? 'secondary' : 'destructive'}
                  className="gap-1.5 px-3 py-1"
                >
                  <Clock className="w-3.5 h-3.5" />
                  {daysUntilExpiration > 0 ? `${daysUntilExpiration} dias` : 'Expirado'}
                </Badge>
              )}
            </div>

            {/* XP Progress Bar */}
            <div className="max-w-lg mx-auto lg:mx-0">
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-500" />
                  {levelInfo.title}
                </span>
                <span className="text-muted-foreground">
                  {currentXP.toLocaleString()} / {levelInfo.nextLevelXP.toLocaleString()} XP
                </span>
              </div>
              <div className="profile-xp-bar-2300">
                <div
                  className={cn(
                    "profile-xp-bar-fill-2300",
                    !shouldAnimate && "transition-none"
                  )}
                  style={{ width: `${progressPercent}%` }}
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
  );
});
