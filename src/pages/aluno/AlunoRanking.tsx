// ============================================
// CENTRAL DO ALUNO - RANKING 2300
// GPU-ONLY animations via useQuantumReactivity
// ============================================

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Trophy, Medal, Star, Crown, Flame, 
  TrendingUp, TrendingDown, Minus, Zap,
  Sparkles, Target, Brain, ChevronUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuantumReactivity } from "@/hooks/useQuantumReactivity";

interface Aluno {
  posicao: number;
  nome: string;
  avatar?: string;
  xp: number;
  nivel: number;
  streak: number;
  variacao: "up" | "down" | "same";
  isCurrentUser?: boolean;
  titulo?: string;
}

const rankingGeral: Aluno[] = [
  { posicao: 1, nome: "Maria Silva", xp: 12450, nivel: 15, streak: 45, variacao: "same", titulo: "Mestre Químico" },
  { posicao: 2, nome: "João Pedro", xp: 11890, nivel: 14, streak: 38, variacao: "up", titulo: "Alquimista" },
  { posicao: 3, nome: "Ana Clara", xp: 11200, nivel: 14, streak: 30, variacao: "down", titulo: "Cientista" },
  { posicao: 4, nome: "Lucas Mendes", xp: 10800, nivel: 13, streak: 25, variacao: "up" },
  { posicao: 5, nome: "Beatriz Costa", xp: 10500, nivel: 13, streak: 22, variacao: "same" },
  { posicao: 6, nome: "Pedro Henrique", xp: 9800, nivel: 12, streak: 18, variacao: "up" },
  { posicao: 7, nome: "Juliana Santos", xp: 9200, nivel: 12, streak: 15, variacao: "down" },
  { posicao: 8, nome: "Gabriel Oliveira", xp: 8700, nivel: 11, streak: 12, variacao: "same" },
  { posicao: 15, nome: "Você", xp: 4500, nivel: 8, streak: 12, variacao: "up", isCurrentUser: true },
];

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

export default function AlunoRanking() {
  const [periodo, setPeriodo] = useState("semanal");
  const { shouldAnimate } = useQuantumReactivity();
  const { container, item } = getGpuVariants(shouldAnimate);

  const top3 = rankingGeral.slice(0, 3);
  const restante = rankingGeral.slice(3);
  const userPosition = rankingGeral.find(a => a.isCurrentUser);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header Hero */}
      <motion.div 
        {...(shouldAnimate ? { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 } } : {})}
        className="text-center space-y-4 will-change-transform transform-gpu"
      >
        <div className="flex items-center justify-center gap-3">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Trophy className="w-12 h-12 text-amber-400" />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 bg-clip-text text-transparent">
            RANKING
          </h1>
          <motion.div
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Trophy className="w-12 h-12 text-amber-400" />
          </motion.div>
        </div>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          Competir é evoluir! Suba no ranking estudando e conquistando XP.
        </p>
      </motion.div>

      {/* Sua Posição Card */}
      {userPosition && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="spider-card bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="w-16 h-16 border-4 border-primary">
                      <AvatarFallback className="text-xl font-bold bg-primary/20">EU</AvatarFallback>
                    </Avatar>
                    <Badge className="absolute -bottom-1 -right-1 bg-primary text-white border-0 text-xs">
                      #{userPosition.posicao}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Sua Posição</h3>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span>Nível {userPosition.nivel}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Flame className="w-4 h-4 text-orange-500" />
                        {userPosition.streak} dias
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="flex items-center gap-1 justify-center">
                      <Zap className="w-5 h-5 text-yellow-500" />
                      <span className="text-3xl font-black">{userPosition.xp.toLocaleString()}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">XP Total</span>
                  </div>
                  <div className="flex items-center gap-2 text-green-500">
                    <ChevronUp className="w-6 h-6" />
                    <span className="font-bold">Subindo!</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Tabs de Período */}
      <div className="flex justify-center">
        <Tabs value={periodo} onValueChange={setPeriodo}>
          <TabsList className="grid grid-cols-3 w-[300px]">
            <TabsTrigger value="semanal">Semanal</TabsTrigger>
            <TabsTrigger value="mensal">Mensal</TabsTrigger>
            <TabsTrigger value="geral">Geral</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Pódio Futurista */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center items-end gap-4 py-8 px-4"
      >
        {/* 2º Lugar */}
        <motion.div 
          className="text-center"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <motion.div 
            className="relative"
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center mb-3 shadow-lg">
              <Medal className="w-10 h-10 text-white" />
            </div>
            <Avatar className="w-18 h-18 mx-auto border-4 border-gray-300 -mt-4 relative z-10">
              <AvatarFallback className="text-lg font-bold">JP</AvatarFallback>
            </Avatar>
          </motion.div>
          <p className="font-bold mt-2">{top3[1]?.nome}</p>
          {top3[1]?.titulo && (
            <Badge variant="outline" className="mt-1 text-xs">{top3[1].titulo}</Badge>
          )}
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
            <Zap className="w-3 h-3 text-yellow-500" />
            {top3[1]?.xp.toLocaleString()}
          </p>
          <div className="h-28 w-24 bg-gradient-to-b from-gray-300 to-gray-400 rounded-t-2xl mt-3 flex items-center justify-center shadow-xl">
            <span className="text-3xl font-black text-gray-700">2º</span>
          </div>
        </motion.div>

        {/* 1º Lugar */}
        <motion.div 
          className="text-center -mb-4"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <motion.div 
            className="relative"
            whileHover={{ scale: 1.05 }}
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="absolute -top-6 left-1/2 -translate-x-1/2">
              <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
            </div>
            <div className="w-28 h-28 mx-auto rounded-full bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500 flex items-center justify-center mb-3 shadow-2xl animate-pulse-glow">
              <Crown className="w-14 h-14 text-white" />
            </div>
            <Avatar className="w-24 h-24 mx-auto border-4 border-yellow-400 -mt-6 relative z-10 shadow-lg">
              <AvatarFallback className="text-2xl font-bold bg-yellow-100 text-yellow-800">MS</AvatarFallback>
            </Avatar>
          </motion.div>
          <p className="font-bold text-lg mt-2">{top3[0]?.nome}</p>
          {top3[0]?.titulo && (
            <Badge className="mt-1 bg-amber-500/20 text-amber-500 border-amber-500/30">{top3[0].titulo}</Badge>
          )}
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
            <Zap className="w-4 h-4 text-yellow-500" />
            {top3[0]?.xp.toLocaleString()}
          </p>
          <div className="h-36 w-28 bg-gradient-to-b from-yellow-400 via-amber-500 to-orange-500 rounded-t-2xl mt-3 flex items-center justify-center shadow-2xl">
            <span className="text-4xl font-black text-white drop-shadow-lg">1º</span>
          </div>
        </motion.div>

        {/* 3º Lugar */}
        <motion.div 
          className="text-center"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <motion.div 
            className="relative"
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-amber-600 to-orange-700 flex items-center justify-center mb-3 shadow-lg">
              <Medal className="w-10 h-10 text-white" />
            </div>
            <Avatar className="w-18 h-18 mx-auto border-4 border-amber-600 -mt-4 relative z-10">
              <AvatarFallback className="text-lg font-bold">AC</AvatarFallback>
            </Avatar>
          </motion.div>
          <p className="font-bold mt-2">{top3[2]?.nome}</p>
          {top3[2]?.titulo && (
            <Badge variant="outline" className="mt-1 text-xs">{top3[2].titulo}</Badge>
          )}
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-1 mt-1">
            <Zap className="w-3 h-3 text-yellow-500" />
            {top3[2]?.xp.toLocaleString()}
          </p>
          <div className="h-20 w-24 bg-gradient-to-b from-amber-600 to-orange-700 rounded-t-2xl mt-3 flex items-center justify-center shadow-xl">
            <span className="text-3xl font-black text-white">3º</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Lista do Ranking */}
      <Card className="spider-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Classificação Geral
          </CardTitle>
          <CardDescription>Baseado em XP acumulado, streak e atividades</CardDescription>
        </CardHeader>
        <CardContent>
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-2"
          >
            {restante.map((aluno) => (
              <motion.div
                key={aluno.posicao}
                variants={item}
                whileHover={{ x: 5 }}
                className={`flex items-center gap-4 p-4 rounded-2xl transition-colors ${
                  aluno.isCurrentUser 
                    ? "bg-primary/10 border-2 border-primary shadow-glow-sm" 
                    : "bg-muted/50 hover:bg-muted"
                }`}
              >
                <div className="w-12 text-center">
                  <span className={`text-xl font-black ${aluno.isCurrentUser ? 'text-primary' : ''}`}>
                    {aluno.posicao}º
                  </span>
                </div>
                
                <Avatar className={`w-12 h-12 ${aluno.isCurrentUser ? 'border-2 border-primary' : ''}`}>
                  <AvatarFallback className="font-bold">
                    {aluno.nome.split(" ").map(n => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{aluno.nome}</span>
                    {aluno.isCurrentUser && (
                      <Badge className="bg-primary text-white border-0">Você</Badge>
                    )}
                    <Badge variant="outline" className="text-xs gap-1">
                      <Star className="w-3 h-3" />
                      Nível {aluno.nivel}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Flame className="w-4 h-4 text-orange-500" />
                      {aluno.streak} dias
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span className="font-bold text-lg">{aluno.xp.toLocaleString()}</span>
                </div>

                <div className="w-8 text-center">
                  {aluno.variacao === "up" && (
                    <motion.div
                      animate={{ y: [0, -3, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    </motion.div>
                  )}
                  {aluno.variacao === "down" && <TrendingDown className="w-5 h-5 text-red-500" />}
                  {aluno.variacao === "same" && <Minus className="w-5 h-5 text-muted-foreground" />}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
}
