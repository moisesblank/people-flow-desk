// ============================================
// CENTRAL DO ALUNO - RANKING 2300
// TOP 10 + POSIÇÃO DO USUÁRIO
// GPU-ONLY animations via useQuantumReactivity
// ============================================

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Trophy, Medal, Star, Crown, Flame, 
  TrendingUp, Zap, Sparkles, Target, ChevronUp, Users
} from "lucide-react";
import { motion } from "framer-motion";
import { useQuantumReactivity } from "@/hooks/useQuantumReactivity";
import { useLeaderboard } from "@/hooks/useGamification";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// GPU-ONLY variants factory
const getGpuVariants = (shouldAnimate: boolean) => ({
  container: {
    hidden: shouldAnimate ? { opacity: 0 } : {},
    show: shouldAnimate ? { opacity: 1, transition: { staggerChildren: 0.05 } } : {}
  },
  item: {
    hidden: shouldAnimate ? { opacity: 0, x: -20 } : {},
    show: shouldAnimate ? { opacity: 1, x: 0 } : {}
  }
});

// Helper para extrair iniciais do nome
const getInitials = (name: string | undefined | null): string => {
  if (!name) return "??";
  return name.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
};

export default function AlunoRanking() {
  const { shouldAnimate } = useQuantumReactivity();
  const { container, item } = getGpuVariants(shouldAnimate);
  const { user } = useAuth();
  
  // Top 10 do ranking via hook otimizado
  const { data: leaderboard, isLoading } = useLeaderboard(10);
  
  // Posição do usuário atual via RPC otimizado
  const { data: userRankData } = useQuery({
    queryKey: ['user-ranking-position', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .rpc('get_user_rank', { p_user_id: user.id })
        .single();
      if (error || !data) return { position: 0, total: 0 };
      return { position: Number(data.rank) || 0, total: Number(data.total) || 0 };
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });
  
  // Dados do usuário para exibição
  const { data: userProfile } = useQuery({
    queryKey: ['user-profile-ranking', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('nome, avatar_url')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });
  
  const { data: userGamification } = useQuery({
    queryKey: ['user-gamification-ranking', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('user_gamification')
        .select('total_xp, current_level, current_streak')
        .eq('user_id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  // Top 3 e restante (4-10)
  const top3 = useMemo(() => leaderboard?.slice(0, 3) || [], [leaderboard]);
  const restante = useMemo(() => leaderboard?.slice(3, 10) || [], [leaderboard]);
  
  // Verificar se usuário está no Top 10
  const userInTop10 = useMemo(() => {
    if (!user?.id || !leaderboard) return false;
    return leaderboard.some(entry => entry.user_id === user.id);
  }, [leaderboard, user?.id]);
  
  // Posição do usuário
  const userPosition = userRankData?.position || 0;
  const totalUsers = userRankData?.total || 0;

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        <div className="text-center space-y-4">
          <Skeleton className="h-12 w-64 mx-auto" />
          <Skeleton className="h-6 w-96 mx-auto" />
        </div>
        <div className="flex justify-center items-end gap-4 py-8">
          <Skeleton className="h-48 w-24" />
          <Skeleton className="h-56 w-28" />
          <Skeleton className="h-40 w-24" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header Hero */}
      <motion.div 
        {...(shouldAnimate ? { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 } } : {})}
        className="text-center space-y-4 will-change-transform transform-gpu"
      >
        <div className="flex items-center justify-center gap-3">
          {/* 🎬 PERFORMANCE: Removido rotate infinito - estático */}
          <Trophy className="w-12 h-12 text-amber-400" />
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 bg-clip-text text-transparent">
            RANKING
          </h1>
          <Trophy className="w-12 h-12 text-amber-400" />
        </div>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          Competir é evoluir! Suba no ranking estudando e conquistando XP.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          <span>{totalUsers.toLocaleString()} estudantes competindo</span>
        </div>
      </motion.div>

      {/* Sua Posição Card - Sempre visível */}
      {userPosition > 0 && (
        <motion.div
          initial={shouldAnimate ? { opacity: 0, scale: 0.95 } : {}}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className={`spider-card border-2 ${
            userPosition <= 10 
              ? 'bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-transparent border-amber-500/30' 
              : 'bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/30'
          }`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className={`w-16 h-16 border-4 ${userPosition <= 3 ? 'border-amber-500' : userPosition <= 10 ? 'border-yellow-500' : 'border-primary'}`}>
                      <AvatarImage src={userProfile?.avatar_url || undefined} />
                      <AvatarFallback className="text-xl font-bold bg-primary/20">
                        {getInitials(userProfile?.nome)}
                      </AvatarFallback>
                    </Avatar>
                    <Badge className={`absolute -bottom-1 -right-1 text-white border-0 text-xs ${
                      userPosition <= 3 ? 'bg-amber-500' : userPosition <= 10 ? 'bg-yellow-600' : 'bg-primary'
                    }`}>
                      #{userPosition}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Sua Posição</h3>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span>Nível {userGamification?.current_level || 1}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Flame className="w-4 h-4 text-orange-500" />
                        {userGamification?.current_streak || 0} dias
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="flex items-center gap-1 justify-center">
                      <Zap className="w-5 h-5 text-yellow-500" />
                      <span className="text-3xl font-black">{(userGamification?.total_xp || 0).toLocaleString()}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">XP Total</span>
                  </div>
                  {userPosition <= 10 && (
                    <div className="flex items-center gap-2 text-amber-500">
                      <Crown className="w-6 h-6" />
                      <span className="font-bold">Top 10!</span>
                    </div>
                  )}
                  {userPosition > 10 && (
                    <div className="flex items-center gap-2 text-green-500">
                      <ChevronUp className="w-6 h-6" />
                      <span className="font-bold">Continue subindo!</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Pódio Futurista - Top 3 */}
      {top3.length >= 3 && (
        <motion.div 
          initial={shouldAnimate ? { opacity: 0, y: 20 } : {}}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center items-end gap-4 py-8 px-4"
        >
          {/* 2º Lugar */}
          <motion.div 
            className="text-center"
            initial={shouldAnimate ? { y: 50, opacity: 0 } : {}}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div 
              className="relative"
              whileHover={shouldAnimate ? { scale: 1.05 } : {}}
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center mb-3 shadow-lg">
                <Medal className="w-10 h-10 text-white" />
              </div>
              <Avatar className="w-16 h-16 mx-auto border-4 border-gray-300 -mt-4 relative z-10">
                <AvatarImage src={top3[1]?.profile?.avatar_url || undefined} />
                <AvatarFallback className="text-lg font-bold">
                  {getInitials(top3[1]?.profile?.nome)}
                </AvatarFallback>
              </Avatar>
            </motion.div>
            <p className="font-bold mt-2 truncate max-w-[100px]">{top3[1]?.profile?.nome || 'Anônimo'}</p>
            <Badge variant="outline" className="mt-1 text-xs">Nível {top3[1]?.current_level}</Badge>
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
              <Zap className="w-3 h-3 text-yellow-500" />
              {top3[1]?.total_xp?.toLocaleString()}
            </p>
            <div className="h-28 w-24 bg-gradient-to-b from-gray-300 to-gray-400 rounded-t-2xl mt-3 flex items-center justify-center shadow-xl">
              <span className="text-3xl font-black text-gray-700">2º</span>
            </div>
          </motion.div>

          {/* 1º Lugar */}
          <motion.div 
            className="text-center -mb-4"
            initial={shouldAnimate ? { y: 50, opacity: 0 } : {}}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {/* 🎬 PERFORMANCE: Removido y:[0,-5,0] infinito */}
            <motion.div 
              className="relative"
              whileHover={shouldAnimate ? { scale: 1.05 } : {}}
            >
              <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
              </div>
              <div className="w-28 h-28 mx-auto rounded-full bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500 flex items-center justify-center mb-3 shadow-2xl animate-pulse-glow">
                <Crown className="w-14 h-14 text-white" />
              </div>
              <Avatar className="w-24 h-24 mx-auto border-4 border-yellow-400 -mt-6 relative z-10 shadow-lg">
                <AvatarImage src={top3[0]?.profile?.avatar_url || undefined} />
                <AvatarFallback className="text-2xl font-bold bg-yellow-100 text-yellow-800">
                  {getInitials(top3[0]?.profile?.nome)}
                </AvatarFallback>
              </Avatar>
            </motion.div>
            <p className="font-bold text-lg mt-2 truncate max-w-[120px]">{top3[0]?.profile?.nome || 'Anônimo'}</p>
            <Badge className="mt-1 bg-amber-500/20 text-amber-500 border-amber-500/30">Nível {top3[0]?.current_level}</Badge>
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
              <Zap className="w-4 h-4 text-yellow-500" />
              {top3[0]?.total_xp?.toLocaleString()}
            </p>
            <div className="h-36 w-28 bg-gradient-to-b from-yellow-400 via-amber-500 to-orange-500 rounded-t-2xl mt-3 flex items-center justify-center shadow-2xl">
              <span className="text-4xl font-black text-white drop-shadow-lg">1º</span>
            </div>
          </motion.div>

          {/* 3º Lugar */}
          <motion.div 
            className="text-center"
            initial={shouldAnimate ? { y: 50, opacity: 0 } : {}}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div 
              className="relative"
              whileHover={shouldAnimate ? { scale: 1.05 } : {}}
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center mb-3 shadow-lg">
                <Medal className="w-10 h-10 text-white" />
              </div>
              <Avatar className="w-16 h-16 mx-auto border-4 border-amber-600 -mt-4 relative z-10">
                <AvatarImage src={top3[2]?.profile?.avatar_url || undefined} />
                <AvatarFallback className="text-lg font-bold">
                  {getInitials(top3[2]?.profile?.nome)}
                </AvatarFallback>
              </Avatar>
            </motion.div>
            <p className="font-bold mt-2 truncate max-w-[100px]">{top3[2]?.profile?.nome || 'Anônimo'}</p>
            <Badge variant="outline" className="mt-1 text-xs">Nível {top3[2]?.current_level}</Badge>
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
              <Zap className="w-3 h-3 text-yellow-500" />
              {top3[2]?.total_xp?.toLocaleString()}
            </p>
            <div className="h-20 w-24 bg-gradient-to-b from-amber-600 to-orange-700 rounded-t-2xl mt-3 flex items-center justify-center shadow-xl">
              <span className="text-3xl font-black text-white">3º</span>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Lista do Ranking - Posições 4-10 */}
      <Card className="spider-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Top 10 - Classificação Geral
          </CardTitle>
          <CardDescription>Baseado em XP acumulado por acertos em simulados</CardDescription>
        </CardHeader>
        <CardContent>
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-2"
          >
            {restante.map((entry, index) => {
              const position = index + 4; // Posições 4-10
              const isCurrentUser = entry.user_id === user?.id;
              
              return (
                <motion.div
                  key={entry.user_id}
                  variants={item}
                  whileHover={shouldAnimate ? { x: 5 } : {}}
                  className={`flex items-center gap-4 p-4 rounded-2xl transition-colors ${
                    isCurrentUser 
                      ? "bg-primary/10 border-2 border-primary shadow-glow-sm" 
                      : "bg-muted/50 hover:bg-muted"
                  }`}
                >
                  <div className="w-12 text-center">
                    <span className={`text-xl font-black ${isCurrentUser ? 'text-primary' : ''}`}>
                      {position}º
                    </span>
                  </div>
                  
                  <Avatar className={`w-12 h-12 ${isCurrentUser ? 'border-2 border-primary' : ''}`}>
                    <AvatarImage src={entry.profile?.avatar_url || undefined} />
                    <AvatarFallback className="font-bold">
                      {getInitials(entry.profile?.nome)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold truncate">{entry.profile?.nome || 'Anônimo'}</span>
                      {isCurrentUser && (
                        <Badge className="bg-primary text-white border-0">Você</Badge>
                      )}
                      <Badge variant="outline" className="text-xs gap-1">
                        <Star className="w-3 h-3" />
                        Nível {entry.current_level}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Flame className="w-4 h-4 text-orange-500" />
                        {entry.current_streak} dias
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span className="font-bold text-lg">{entry.total_xp?.toLocaleString()}</span>
                  </div>

                  <div className="w-8 text-center">
                    <motion.div
                      animate={shouldAnimate ? { y: [0, -3, 0] } : {}}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}
            
            {/* Se usuário não está no Top 10, mostrar separador e sua posição */}
            {!userInTop10 && userPosition > 10 && (
              <>
                <div className="flex items-center gap-4 py-4">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground px-2">• • •</span>
                  <div className="flex-1 h-px bg-border" />
                </div>
                
                <motion.div
                  variants={item}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-primary/10 border-2 border-primary shadow-glow-sm"
                >
                  <div className="w-12 text-center">
                    <span className="text-xl font-black text-primary">
                      {userPosition}º
                    </span>
                  </div>
                  
                  <Avatar className="w-12 h-12 border-2 border-primary">
                    <AvatarImage src={userProfile?.avatar_url || undefined} />
                    <AvatarFallback className="font-bold">
                      {getInitials(userProfile?.nome)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{userProfile?.nome || 'Você'}</span>
                      <Badge className="bg-primary text-white border-0">Você</Badge>
                      <Badge variant="outline" className="text-xs gap-1">
                        <Star className="w-3 h-3" />
                        Nível {userGamification?.current_level || 1}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Flame className="w-4 h-4 text-orange-500" />
                        {userGamification?.current_streak || 0} dias
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span className="font-bold text-lg">{(userGamification?.total_xp || 0).toLocaleString()}</span>
                  </div>

                  <div className="w-8 text-center">
                    <ChevronUp className="w-6 h-6 text-green-500" />
                  </div>
                </motion.div>
              </>
            )}
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
}