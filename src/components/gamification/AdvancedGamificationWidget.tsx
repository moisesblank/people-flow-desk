// ============================================
// EMPRESARIAL 2.0 - GAMIFICAÇÃO AVANÇADA
// Sistema completo de conquistas, XP e rankings
// ============================================

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Star,
  Flame,
  Medal,
  Crown,
  Zap,
  Target,
  Award,
  TrendingUp,
  ChevronRight,
  Lock,
  Sparkles,
  Gift,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGamification, getLevelInfo, useLeaderboard } from "@/hooks/useGamification";
import { useAuth } from "@/hooks/useAuth";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: typeof Trophy;
  rarity: "common" | "rare" | "epic" | "legendary";
  xpReward: number;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

const rarityColors = {
  common: "from-gray-400 to-gray-500",
  rare: "from-blue-400 to-blue-600",
  epic: "from-purple-400 to-purple-600",
  legendary: "from-amber-400 to-orange-500",
};

const rarityBgColors = {
  common: "bg-gray-500/10 border-gray-500/30",
  rare: "bg-blue-500/10 border-blue-500/30",
  epic: "bg-purple-500/10 border-purple-500/30",
  legendary: "bg-amber-500/10 border-amber-500/30",
};

const mockAchievements: Achievement[] = [
  {
    id: "first-login",
    name: "Primeiro Acesso",
    description: "Fez o primeiro login na plataforma",
    icon: Star,
    rarity: "common",
    xpReward: 50,
    unlocked: true,
  },
  {
    id: "task-master",
    name: "Mestre das Tarefas",
    description: "Complete 50 tarefas",
    icon: Target,
    rarity: "rare",
    xpReward: 200,
    unlocked: false,
    progress: 23,
    maxProgress: 50,
  },
  {
    id: "streak-7",
    name: "Semana de Fogo",
    description: "Mantenha 7 dias de streak",
    icon: Flame,
    rarity: "rare",
    xpReward: 150,
    unlocked: true,
  },
  {
    id: "streak-30",
    name: "Mês Invicto",
    description: "Mantenha 30 dias de streak",
    icon: Flame,
    rarity: "epic",
    xpReward: 500,
    unlocked: false,
    progress: 12,
    maxProgress: 30,
  },
  {
    id: "revenue-master",
    name: "Mestre das Finanças",
    description: "Registre R$ 100.000 em receitas",
    icon: TrendingUp,
    rarity: "epic",
    xpReward: 750,
    unlocked: false,
    progress: 45000,
    maxProgress: 100000,
  },
  {
    id: "legend",
    name: "Lenda",
    description: "Alcance o nível 50",
    icon: Crown,
    rarity: "legendary",
    xpReward: 2000,
    unlocked: false,
    progress: 8,
    maxProgress: 50,
  },
];

export function AdvancedGamificationWidget() {
  const { user } = useAuth();
  const { gamification, levelInfo, userRank, isLoading } = useGamification();
  const { data: leaderboard } = useLeaderboard(10);
  const [activeTab, setActiveTab] = useState("overview");

  if (isLoading) {
    return (
      <Card className="glass-card animate-pulse">
        <CardHeader>
          <div className="h-6 w-32 bg-muted rounded" />
        </CardHeader>
        <CardContent>
          <div className="h-40 bg-muted/50 rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  const currentXP = gamification?.total_xp || 0;
  const currentStreak = gamification?.current_streak || 0;
  const level = levelInfo.level;
  const progressToNext = levelInfo.progressPercentage;

  return (
    <Card className="glass-card overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20">
              <Trophy className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Gamificação</CardTitle>
              <p className="text-xs text-muted-foreground">
                Seu progresso e conquistas
              </p>
            </div>
          </div>
          {userRank && (
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
              <Medal className="h-3 w-3 mr-1" />
              #{userRank}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Level & XP Overview */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative p-4 rounded-xl bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 border border-primary/20"
        >
          <div className="absolute top-2 right-2">
            <Badge variant="outline" className="text-xs bg-background/50">
              <Sparkles className="h-3 w-3 mr-1 text-amber-500" />
              {levelInfo.title}
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                {level}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5">
                <div className="h-6 w-6 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 flex items-center justify-center">
                  <Star className="h-3 w-3 text-white" />
                </div>
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium">Nível {level}</span>
                <span className="text-xs text-muted-foreground">
                  {currentXP.toLocaleString()} / {levelInfo.nextLevelXP.toLocaleString()} XP
                </span>
              </div>
              <Progress value={progressToNext} className="h-2 mb-2" />
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-amber-500">
                  <Zap className="h-3 w-3" />
                  {currentXP.toLocaleString()} XP
                </span>
                <span className="flex items-center gap-1 text-orange-500">
                  <Flame className="h-3 w-3" />
                  {currentStreak} dias
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 h-8">
            <TabsTrigger value="overview" className="text-xs">
              <Award className="h-3 w-3 mr-1" />
              Conquistas
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="text-xs">
              <Trophy className="h-3 w-3 mr-1" />
              Ranking
            </TabsTrigger>
            <TabsTrigger value="rewards" className="text-xs">
              <Gift className="h-3 w-3 mr-1" />
              Recompensas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-3">
            <ScrollArea className="h-[200px]">
              <div className="space-y-2 pr-2">
                {mockAchievements.map((achievement, index) => {
                  const Icon = achievement.icon;
                  const progress = achievement.progress && achievement.maxProgress
                    ? (achievement.progress / achievement.maxProgress) * 100
                    : 0;

                  return (
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-3 rounded-xl border transition-all ${
                        achievement.unlocked
                          ? rarityBgColors[achievement.rarity]
                          : "bg-muted/20 border-border/30 opacity-70"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          achievement.unlocked
                            ? `bg-gradient-to-br ${rarityColors[achievement.rarity]}`
                            : "bg-muted"
                        }`}>
                          {achievement.unlocked ? (
                            <Icon className="h-4 w-4 text-white" />
                          ) : (
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-medium ${
                              !achievement.unlocked && "text-muted-foreground"
                            }`}>
                              {achievement.name}
                            </span>
                            <Badge variant="outline" className={`text-[8px] px-1 h-4 ${
                              achievement.unlocked ? "" : "opacity-50"
                            }`}>
                              {achievement.rarity}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            {achievement.description}
                          </p>
                          
                          {!achievement.unlocked && achievement.progress !== undefined && (
                            <div className="mt-1">
                              <Progress value={progress} className="h-1" />
                              <span className="text-[9px] text-muted-foreground">
                                {achievement.progress.toLocaleString()} / {achievement.maxProgress?.toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="text-right">
                          <Badge className={`text-[10px] ${
                            achievement.unlocked
                              ? "bg-amber-500/20 text-amber-500"
                              : "bg-muted text-muted-foreground"
                          }`}>
                            +{achievement.xpReward} XP
                          </Badge>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="leaderboard" className="mt-3">
            <ScrollArea className="h-[200px]">
              <div className="space-y-2 pr-2">
                {leaderboard?.map((entry, index) => {
                  const isCurrentUser = entry.user_id === user?.id;
                  const rankIcon = index === 0 ? Crown : index === 1 ? Medal : index === 2 ? Award : null;
                  const RankIcon = rankIcon;

                  return (
                    <motion.div
                      key={entry.user_id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`p-3 rounded-xl border transition-all ${
                        isCurrentUser
                          ? "bg-primary/10 border-primary/30"
                          : "bg-muted/20 border-border/30"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0 ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white" :
                          index === 1 ? "bg-gradient-to-br from-gray-300 to-gray-400 text-white" :
                          index === 2 ? "bg-gradient-to-br from-amber-600 to-amber-700 text-white" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {RankIcon ? <RankIcon className="h-4 w-4" /> : index + 1}
                        </div>

                        <Avatar className="h-8 w-8">
                          <AvatarImage src={entry.profile?.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {entry.profile?.nome?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${
                            isCurrentUser && "text-primary"
                          }`}>
                            {entry.profile?.nome || "Usuário"}
                            {isCurrentUser && " (você)"}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            Nível {entry.current_level} • {entry.current_streak} dias de streak
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-bold text-amber-500">
                            {entry.total_xp.toLocaleString()}
                          </p>
                          <p className="text-[10px] text-muted-foreground">XP</p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="rewards" className="mt-3">
            <div className="text-center py-6">
              <Gift className="h-12 w-12 mx-auto mb-3 text-primary/50" />
              <p className="text-sm font-medium">Recompensas em breve!</p>
              <p className="text-xs text-muted-foreground mt-1">
                Continue ganhando XP para desbloquear recompensas exclusivas
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Daily Challenge */}
        <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-xs font-medium">Desafio Diário</p>
                <p className="text-[10px] text-muted-foreground">Complete 3 tarefas hoje</p>
              </div>
            </div>
            <Badge className="bg-purple-500/20 text-purple-500">
              +100 XP
            </Badge>
          </div>
          <Progress value={66} className="h-1 mt-2" />
          <p className="text-[10px] text-muted-foreground mt-1">2/3 concluídas</p>
        </div>
      </CardContent>
    </Card>
  );
}
