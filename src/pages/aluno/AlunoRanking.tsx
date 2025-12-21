// ============================================
// CENTRAL DO ALUNO - RANKING
// Química ENEM - Prof. Moisés Medeiros
// ============================================

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Trophy, Medal, Star, Crown, Flame, 
  TrendingUp, TrendingDown, Minus, Zap
} from "lucide-react";
import { motion } from "framer-motion";

interface Aluno {
  posicao: number;
  nome: string;
  avatar?: string;
  xp: number;
  nivel: number;
  streak: number;
  variacao: "up" | "down" | "same";
  isCurrentUser?: boolean;
}

const rankingGeral: Aluno[] = [
  { posicao: 1, nome: "Maria Silva", xp: 12450, nivel: 15, streak: 45, variacao: "same" },
  { posicao: 2, nome: "João Pedro", xp: 11890, nivel: 14, streak: 38, variacao: "up" },
  { posicao: 3, nome: "Ana Clara", xp: 11200, nivel: 14, streak: 30, variacao: "down" },
  { posicao: 4, nome: "Lucas Mendes", xp: 10800, nivel: 13, streak: 25, variacao: "up" },
  { posicao: 5, nome: "Beatriz Costa", xp: 10500, nivel: 13, streak: 22, variacao: "same" },
  { posicao: 15, nome: "Você", xp: 4500, nivel: 8, streak: 12, variacao: "up", isCurrentUser: true },
];

const getPodiumStyle = (posicao: number) => {
  switch (posicao) {
    case 1:
      return "bg-gradient-to-br from-yellow-400 to-amber-500 text-white";
    case 2:
      return "bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800";
    case 3:
      return "bg-gradient-to-br from-amber-600 to-orange-700 text-white";
    default:
      return "bg-muted";
  }
};

const getPodiumIcon = (posicao: number) => {
  switch (posicao) {
    case 1:
      return <Crown className="w-6 h-6" />;
    case 2:
      return <Medal className="w-6 h-6" />;
    case 3:
      return <Medal className="w-6 h-6" />;
    default:
      return null;
  }
};

export default function AlunoRanking() {
  const [periodo, setPeriodo] = useState("semanal");

  const top3 = rankingGeral.slice(0, 3);
  const restante = rankingGeral.slice(3);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Ranking de Alunos</h1>
        <p className="text-muted-foreground">Competir é evoluir! Veja sua posição no ranking.</p>
      </div>

      {/* Tabs de Período */}
      <div className="flex justify-center">
        <Tabs value={periodo} onValueChange={setPeriodo}>
          <TabsList>
            <TabsTrigger value="semanal">Semanal</TabsTrigger>
            <TabsTrigger value="mensal">Mensal</TabsTrigger>
            <TabsTrigger value="geral">Geral</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Pódio */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center items-end gap-4 py-8"
      >
        {/* 2º Lugar */}
        <div className="text-center">
          <div className={`w-20 h-20 mx-auto rounded-full ${getPodiumStyle(2)} flex items-center justify-center mb-2`}>
            {getPodiumIcon(2)}
          </div>
          <Avatar className="w-16 h-16 mx-auto border-4 border-gray-300 -mt-4">
            <AvatarFallback>JP</AvatarFallback>
          </Avatar>
          <p className="font-semibold mt-2">{top3[1]?.nome}</p>
          <p className="text-sm text-muted-foreground">{top3[1]?.xp.toLocaleString()} XP</p>
          <div className="h-24 w-20 bg-gray-300 rounded-t-lg mt-2 flex items-center justify-center">
            <span className="text-2xl font-bold text-gray-700">2º</span>
          </div>
        </div>

        {/* 1º Lugar */}
        <div className="text-center">
          <div className={`w-24 h-24 mx-auto rounded-full ${getPodiumStyle(1)} flex items-center justify-center mb-2 animate-pulse`}>
            {getPodiumIcon(1)}
          </div>
          <Avatar className="w-20 h-20 mx-auto border-4 border-yellow-400 -mt-4">
            <AvatarFallback>MS</AvatarFallback>
          </Avatar>
          <p className="font-bold text-lg mt-2">{top3[0]?.nome}</p>
          <p className="text-sm text-muted-foreground">{top3[0]?.xp.toLocaleString()} XP</p>
          <div className="h-32 w-24 bg-gradient-to-b from-yellow-400 to-amber-500 rounded-t-lg mt-2 flex items-center justify-center">
            <span className="text-3xl font-bold text-white">1º</span>
          </div>
        </div>

        {/* 3º Lugar */}
        <div className="text-center">
          <div className={`w-20 h-20 mx-auto rounded-full ${getPodiumStyle(3)} flex items-center justify-center mb-2`}>
            {getPodiumIcon(3)}
          </div>
          <Avatar className="w-16 h-16 mx-auto border-4 border-amber-600 -mt-4">
            <AvatarFallback>AC</AvatarFallback>
          </Avatar>
          <p className="font-semibold mt-2">{top3[2]?.nome}</p>
          <p className="text-sm text-muted-foreground">{top3[2]?.xp.toLocaleString()} XP</p>
          <div className="h-16 w-20 bg-gradient-to-b from-amber-600 to-orange-700 rounded-t-lg mt-2 flex items-center justify-center">
            <span className="text-2xl font-bold text-white">3º</span>
          </div>
        </div>
      </motion.div>

      {/* Lista do Ranking */}
      <Card>
        <CardHeader>
          <CardTitle>Classificação Geral</CardTitle>
          <CardDescription>Baseado em XP acumulado e atividades</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {restante.map((aluno, index) => (
            <motion.div
              key={aluno.posicao}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center gap-4 p-3 rounded-lg ${
                aluno.isCurrentUser 
                  ? "bg-primary/10 border-2 border-primary" 
                  : "bg-muted/50 hover:bg-muted"
              } transition-colors`}
            >
              <div className="w-10 text-center">
                <span className="text-lg font-bold">{aluno.posicao}º</span>
              </div>
              
              <Avatar className="w-10 h-10">
                <AvatarFallback>{aluno.nome.split(" ").map(n => n[0]).join("")}</AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{aluno.nome}</span>
                  {aluno.isCurrentUser && <Badge variant="default">Você</Badge>}
                  <Badge variant="outline" className="text-xs">
                    Nível {aluno.nivel}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span>{aluno.streak} dias</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span className="font-bold">{aluno.xp.toLocaleString()}</span>
              </div>

              <div className="w-8 text-center">
                {aluno.variacao === "up" && <TrendingUp className="w-5 h-5 text-green-500" />}
                {aluno.variacao === "down" && <TrendingDown className="w-5 h-5 text-red-500" />}
                {aluno.variacao === "same" && <Minus className="w-5 h-5 text-muted-foreground" />}
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
